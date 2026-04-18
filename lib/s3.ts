import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

if (!BUCKET_NAME) {
  console.warn('AWS_S3_BUCKET environment variable is not set');
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials are not properly configured');
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
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket is not configured');
  }

  const key = `business-photos/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

  return { signedUrl, url };
}

/**
 * Delete a file from S3
 */
export async function deleteS3File(fileUrl: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('S3 bucket is not configured');
  }

  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
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
