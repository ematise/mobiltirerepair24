import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { fetchWithTimeout, withTimeout } from './fetch-with-timeout';

let s3Client: S3Client | undefined;

function getBucketName(): string {
  return process.env.AWS_S3_BUCKET || '';
}

export function isS3Configured(): boolean {
  return Boolean(
    getBucketName() &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  );
}

export type S3CheckResult = {
  ok: boolean;
  configured: boolean;
  message: string;
};

/** Verify S3 credentials and bucket access (used by fetch script preflight). */
export async function checkS3Available(): Promise<S3CheckResult> {
  if (!isS3Configured()) {
    return {
      ok: false,
      configured: false,
      message: 'AWS S3 is not configured — business photos will be skipped',
    };
  }

  try {
    await withTimeout(
      getS3Client().send(new HeadBucketCommand({ Bucket: getBucketName() })),
      10_000,
      'S3 bucket check',
    );
    return { ok: true, configured: true, message: `S3 bucket "${getBucketName()}" is reachable` };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      message: `S3 unavailable (${getBucketName()}): ${(err as Error).message}`,
    };
  }
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
}

/**
 * Generate a signed URL for uploading a file to S3
 * Valid for 15 minutes by default
 */
export async function getUploadSignedUrl(
  fileName: string,
  fileType: string,
  expiresIn: number = 900
): Promise<{ signedUrl: string; url: string }> {
  const bucket = getBucketName();
  if (!bucket) {
    throw new Error('S3 bucket is not configured');
  }

  const key = `business-photos/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

  const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn });
  const url = `https://${bucket}.s3.amazonaws.com/${key}`;

  return { signedUrl, url };
}

/**
 * Delete a file from S3
 */
export async function deleteS3File(fileUrl: string): Promise<void> {
  if (!getBucketName()) {
    throw new Error('S3 bucket is not configured');
  }

  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });

    await getS3Client().send(command);
  } catch (error) {
    console.error('Error deleting S3 file:', error);
    throw error;
  }
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }

  return { valid: true };
}

/**
 * Download external photo URLs and re-host them to S3
 */
export async function reHostPhotosToS3(
  photos: string[],
  slug: string,
  startIndex = 1
): Promise<string[]> {
  const bucket = getBucketName();
  if (!bucket) throw new Error('S3 bucket is not configured');

  const result: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const url = photos[i];

    if (url.includes('.s3.amazonaws.com/')) {
      result.push(url);
      continue;
    }

    try {
      const res = await fetchWithTimeout(url, undefined, 30_000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
      const typeExt = contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : contentType.includes('gif')
            ? 'gif'
            : 'jpg';
      const urlExt = url.split('?')[0].split('.').pop() ?? '';
      // Google photo URIs often lack a real file extension — prefer content-type.
      const ext = /^[a-zA-Z0-9]{2,4}$/.test(urlExt) ? urlExt : typeExt;

      const resized = await sharp(Buffer.from(await res.arrayBuffer()))
        .resize(1024, undefined, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      const key = `business-photos/${slug}-mobile-tire-repair-${startIndex + i}.${ext}`;

      await withTimeout(
        getS3Client().send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: new Uint8Array(resized),
          ContentType: contentType,
        })),
        30_000,
        'S3 upload',
      );

      result.push(`https://${bucket}.s3.amazonaws.com/${key}`);
    } catch (err) {
      console.error(`reHostPhotosToS3: failed for ${url}:`, err);
      result.push(url);
    }
  }

  return result;
}
