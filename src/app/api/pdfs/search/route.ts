import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { findTopKChunks } from '@/lib/rag';

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    // Fetch user's PDFs
    const userPdfs = await db.pdf.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        shares: {
          select: { token: true },
        },
      },
    });

    if (!query) {
      return NextResponse.json({ pdfs: userPdfs });
    }

    // 1. Text match filter on filename & summary
    const lowerQ = query.toLowerCase();
    const textMatchedPdfs = userPdfs.filter(
      (pdf) =>
        pdf.filename.toLowerCase().includes(lowerQ) ||
        pdf.summary.toLowerCase().includes(lowerQ)
    );

    // 2. Semantic search across vector chunks for user's PDFs
    const allUserChunks = await db.pdfChunk.findMany({
      where: {
        pdf: { ownerId: userId },
      },
      select: {
        id: true,
        pdfId: true,
        text: true,
        embedding: true,
      },
    });

    const topChunks = await findTopKChunks(query, allUserChunks, 10);
    const semanticallyRelevantPdfIds = new Set<string>();

    topChunks.forEach((chunk) => {
      // Find chunk matching text in allUserChunks to retrieve pdfId
      const matchedChunk = allUserChunks.find((c) => c.text === chunk.text);
      if (matchedChunk && chunk.score > 0.1) {
        semanticallyRelevantPdfIds.add(matchedChunk.pdfId);
      }
    });

    // Combine text matches and semantic matches
    const resultMap = new Map<string, typeof userPdfs[0]>();

    textMatchedPdfs.forEach((pdf) => resultMap.set(pdf.id, pdf));
    userPdfs.forEach((pdf) => {
      if (semanticallyRelevantPdfIds.has(pdf.id)) {
        resultMap.set(pdf.id, pdf);
      }
    });

    return NextResponse.json({ pdfs: Array.from(resultMap.values()) });
  } catch (error: any) {
    console.error('PDF Search API error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}
