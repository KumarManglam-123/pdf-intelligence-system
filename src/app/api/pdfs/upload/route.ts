import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';
import { generatePdfSummary } from '@/lib/groq';
import { chunkText, generateEmbedding } from '@/lib/rag';
import pdfParse from 'pdf-parse';

export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to upload files.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Validate MIME type & file extension
    const filename = file.name || 'document.pdf';
    const isPdfMime = file.type === 'application/pdf';
    const isPdfExt = filename.toLowerCase().endsWith('.pdf');

    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF files (.pdf) are accepted.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 2. Store in Vercel Blob (or dev fallback)
    const blobUrl = await uploadToBlob(filename, fileBuffer);

    // 3. Extract text from PDF
    let extractedText = '';
    try {
      const parsedData = await pdfParse(fileBuffer);
      extractedText = parsedData.text || '';
    } catch (parseError: any) {
      console.warn('PDF text extraction error:', parseError);
      extractedText = `Could not extract text cleanly from ${filename}.`;
    }

    if (!extractedText.trim()) {
      extractedText = 'PDF appears to be scanned or contains no selectable text.';
    }

    // 4. Generate AI Summary synchronously before returning
    const summary = await generatePdfSummary(extractedText);

    // 5. Create PDF record in database
    const newPdf = await db.pdf.create({
      data: {
        ownerId: userId,
        filename,
        blobUrl,
        extractedText,
        summary,
      },
    });

    // 6. Chunk text and generate vector embeddings for RAG AI Chat
    const textChunks = chunkText(extractedText);
    
    // Process chunk embeddings concurrently
    const chunkPromises = textChunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk.text);
      return {
        pdfId: newPdf.id,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: JSON.stringify(embedding),
      };
    });

    const chunkData = await Promise.all(chunkPromises);

    if (chunkData.length > 0) {
      await db.pdfChunk.createMany({
        data: chunkData,
      });
    }

    return NextResponse.json({
      message: 'PDF uploaded and processed successfully',
      pdf: {
        id: newPdf.id,
        filename: newPdf.filename,
        blobUrl: newPdf.blobUrl,
        summary: newPdf.summary,
        createdAt: newPdf.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('PDF Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process PDF upload' }, { status: 500 });
  }
}
