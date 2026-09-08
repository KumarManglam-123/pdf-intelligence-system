import { put } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage, with local data-URL fallback if token is missing.
 */
export async function uploadToBlob(filename: string, fileBuffer: Buffer): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token && token !== 'vercel_blob_rw_token') {
    try {
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: 'application/pdf',
        token,
      });
      return blob.url;
    } catch (error) {
      console.warn('Vercel Blob upload failed, falling back to Data URL:', error);
    }
  }

  // Local fallback: generate base64 data URL if Vercel Blob is not configured
  const base64 = fileBuffer.toString('base64');
  return `data:application/pdf;base64,${base64}`;
}
