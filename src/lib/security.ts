import { db } from '@/lib/db';

export interface SecurityAccessCheck {
  authorized: boolean;
  pdf: any | null;
  isOwner: boolean;
  reason?: string;
}

export async function verifyPdfAccess(
  pdfId: string,
  userId?: string | null,
  shareToken?: string | null
): Promise<SecurityAccessCheck> {
  const pdf = await db.pdf.findUnique({
    where: { id: pdfId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!pdf) {
    return { authorized: false, pdf: null, isOwner: false, reason: 'PDF not found' };
  }

  // 1. Check if user is the PDF owner
  if (userId && pdf.ownerId === userId) {
    return { authorized: true, pdf, isOwner: true };
  }

  // 2. Check if a valid share token matches
  if (shareToken) {
    const share = await db.share.findUnique({
      where: { token: shareToken },
    });

    if (share && share.pdfId === pdfId) {
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return { authorized: false, pdf: null, isOwner: false, reason: 'Share link has expired' };
      }
      return { authorized: true, pdf, isOwner: false };
    }
  }

  return { authorized: false, pdf: null, isOwner: false, reason: 'Unauthorized access to PDF' };
}
