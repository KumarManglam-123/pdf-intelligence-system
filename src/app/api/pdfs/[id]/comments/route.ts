import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyPdfAccess } from '@/lib/security';

export const dynamic = 'force-dynamic';


// GET comments for PDF
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    const access = await verifyPdfAccess(params.id, userId, token);
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason || 'Access denied' }, { status: 403 });
    }

    const comments = await db.comment.findMany({
      where: {
        pdfId: params.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST new comment or reply
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const bodyData = await req.json();
    const { body, authorName, parentCommentId, token } = bodyData;

    if (!body || !body.trim()) {
      return NextResponse.json({ error: 'Comment body cannot be empty' }, { status: 400 });
    }

    const access = await verifyPdfAccess(params.id, userId, token);
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason || 'Access denied' }, { status: 403 });
    }

    let finalAuthorName = '';
    let authorUserId: string | null = null;

    if (userId && session?.user) {
      authorUserId = userId;
      finalAuthorName = session.user.name || session.user.email || 'Authenticated User';
    } else {
      if (!authorName || !authorName.trim()) {
        return NextResponse.json({ error: 'Display name is required for guest comments' }, { status: 400 });
      }
      finalAuthorName = authorName.trim();
    }

    const comment = await db.comment.create({
      data: {
        pdfId: params.id,
        authorName: finalAuthorName,
        authorUserId,
        body: body.trim(),
        parentCommentId: parentCommentId || null,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    console.error('Comment creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post comment' }, { status: 500 });
  }
}
