import { NextRequest, NextResponse } from 'next/server';
import { getUploadSignedUrl, validateImageFile } from '@/lib/s3';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const businessSlug = formData.get('businessSlug') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate SEO-friendly filename if business slug is provided
    let fileName = file.name;
    if (businessSlug) {
      const ext = file.name.split('.').pop();
      const timestamp = Date.now();
      fileName = `${businessSlug}-mobile-tire-repair-${timestamp}.${ext}`;
    }

    // Get signed URL and final URL
    const { signedUrl, url } = await getUploadSignedUrl(
      fileName,
      file.type
    );

    // Convert file to buffer and resize image for S3 upload
    let imageBuffer: Buffer | ArrayBuffer = await file.arrayBuffer();

    // Resize image to max width 1024 with auto height
    try {
      imageBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(1024, undefined, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();
    } catch (err) {
      console.error('Image resize error:', err);
      // Continue with original buffer if resize fails
    }

    // Upload file to S3 using the signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: imageBuffer instanceof ArrayBuffer ? new Uint8Array(imageBuffer) : imageBuffer,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: errorText,
      });
      throw new Error(`Failed to upload file to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    return NextResponse.json(
      { url, message: 'File uploaded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
