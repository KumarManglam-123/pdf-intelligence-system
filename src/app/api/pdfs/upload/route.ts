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

    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 15MB limit. Please upload a smaller PDF document.' },
        { status: 400 }
      );
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

    // 2. Extract text from PDF first before uploading to Blob to fail fast on invalid PDFs
    let extractedText = '';
    try {
      const parsedData = await pdfParse(fileBuffer);
      extractedText = parsedData && parsedData.text ? parsedData.text.trim() : '';
    } catch (parseError: any) {
      console.error('PDF text extraction error:', parseError);
      return NextResponse.json(
        { error: 'Failed to extract text from the PDF. The file may be corrupted, encrypted, or malformed.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        { error: 'The uploaded PDF contains no extractable text (it may be a scanned image-only PDF or empty). Please upload a document with selectable text.' },
        { status: 400 }
      );
    }

    // 3. Store in Vercel Blob (or dev fallback)
    const blobUrl = await uploadToBlob(filename, fileBuffer);


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
