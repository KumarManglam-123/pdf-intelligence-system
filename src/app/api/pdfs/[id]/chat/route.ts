import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyPdfAccess } from '@/lib/security';
import { getGroqClient, DEFAULT_GROQ_MODEL } from '@/lib/groq';
import { findTopKChunks } from '@/lib/rag';

export const dynamic = 'force-dynamic';


// GET chat history for session / user
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const sessionId = searchParams.get('sessionId');

    const access = await verifyPdfAccess(params.id, userId, token);
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason || 'Access denied' }, { status: 403 });
    }

    const messages = await db.chatMessage.findMany({
      where: {
        pdfId: params.id,
        ...(sessionId ? { sessionId } : userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ messages, modelName: DEFAULT_GROQ_MODEL });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch chat history' }, { status: 500 });
  }
}

// POST new question & get Groq AI response (with RAG chunking & streaming)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const { message, sessionId, token } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const access = await verifyPdfAccess(params.id, userId, token);
    if (!access.authorized || !access.pdf) {
      return NextResponse.json({ error: access.reason || 'Access denied' }, { status: 403 });
    }

    const userQuery = message.trim();

    // 1. Save user query in DB
    const userMsg = await db.chatMessage.create({
      data: {
        pdfId: params.id,
        sessionId: sessionId || null,
        userId: userId || null,
        role: 'user',
        content: userQuery,
      },
    });

    // 2. Fetch all PDF chunks and retrieve top-k most relevant excerpts via vector similarity
    const chunks = await db.pdfChunk.findMany({
      where: { pdfId: params.id },
      select: { id: true, text: true, embedding: true },
    });

    let contextExcerpts = '';
    if (chunks.length > 0) {
      const topChunks = await findTopKChunks(userQuery, chunks, 3);
      contextExcerpts = topChunks
        .map((c, i) => `[Excerpt ${i + 1}]:\n${c.text}`)
        .join('\n\n');
    } else {
      contextExcerpts = access.pdf.extractedText.slice(0, 4000);
    }

    // 3. Fetch prior conversation history (last 5 turns)
    const historyMessages = await db.chatMessage.findMany({
      where: {
        pdfId: params.id,
        ...(sessionId ? { sessionId } : userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const conversationTurns = historyMessages
      .reverse()
      .filter((m) => m.id !== userMsg.id)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 4. Construct system prompt and Groq payload
    const systemPrompt = `You are an intelligent PDF document assistant. You must answer questions STRICTLY based on the provided document excerpts below.

CRITICAL INSTRUCTIONS:
- Ground your answer ONLY in the provided Document Excerpts.
- If the requested information is NOT contained within the provided excerpts, reply explicitly: "I cannot find the answer to that in the provided document."
- Do NOT hallucinate, infer outside facts, or bring in external knowledge.

--- DOCUMENT EXCERPTS ---
${contextExcerpts}
--- END EXCERPTS ---`;

    const groq = getGroqClient();

    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationTurns,
      { role: 'user' as const, content: userQuery },
    ];

    // Create streaming completion
    const stream = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.2,
      max_tokens: 600,
      stream: true,
    });

    // Create ReadableStream to stream tokens to client while building full assistant response
    let assistantContent = '';
    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const tokenText = chunk.choices[0]?.delta?.content || '';
            if (tokenText) {
              assistantContent += tokenText;
              controller.enqueue(encoder.encode(tokenText));
            }
          }

          // Save final assistant response to DB
          await db.chatMessage.create({
            data: {
              pdfId: params.id,
              sessionId: sessionId || null,
              userId: userId || null,
              role: 'assistant',
              content: assistantContent || 'I cannot find the answer to that in the provided document.',
            },
          });

          controller.close();
        } catch (err) {
          console.error('Error during streaming Groq completion:', err);
          controller.error(err);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process chat query' }, { status: 500 });
  }
}
