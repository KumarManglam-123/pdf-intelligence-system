import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function ShareTokenRedirectPage({
  params,
}: {
  params: { token: string };
}) {
  const share = await db.share.findUnique({
    where: { token: params.token },
  });

  if (!share) {
    redirect('/login?error=InvalidShareToken');
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    redirect('/login?error=ExpiredShareToken');
  }

  redirect(`/pdf/${share.pdfId}?token=${share.token}`);
}
