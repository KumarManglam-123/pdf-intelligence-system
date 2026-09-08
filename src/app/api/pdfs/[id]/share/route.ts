import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if user owns the PDF
    const pdf = await db.pdf.findUnique({
      where: { id: params.id },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    if (pdf.ownerId !== userId) {
      return NextResponse.json({ error: 'Only the PDF owner can generate share links' }, { status: 403 });
    }

    // Check if a share token already exists
    const existingShare = await db.share.findFirst({
      where: { pdfId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existingShare) {
      return NextResponse.json({ share: existingShare });
    }

    // Create new unique token
    const token = crypto.randomBytes(16).toString('hex');

    const newShare = await db.share.create({
      data: {
        pdfId: params.id,
        token,
      },
    });

    return NextResponse.json({ share: newShare }, { status: 201 });
  } catch (error: any) {
    console.error('Share generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate share link' }, { status: 500 });
  }
}
