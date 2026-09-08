import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyPdfAccess } from '@/lib/security';

export const dynamic = 'force-dynamic';


// GET PDF details
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

    if (!access.authorized || !access.pdf) {
      return NextResponse.json({ error: access.reason || 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      pdf: access.pdf,
      isOwner: access.isOwner,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch PDF' }, { status: 500 });
  }
}

// DELETE PDF (Owner only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const pdf = await db.pdf.findUnique({
      where: { id: params.id },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    if (pdf.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden. Only the owner can delete this PDF.' }, { status: 403 });
    }

    await db.pdf.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'PDF deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete PDF' }, { status: 500 });
  }
}
