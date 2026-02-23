/**
 * Upload a file to a presigned PUT URL (e.g. S3).
 * Use the raw file body and Content-Type; do not send Authorization.
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
}
