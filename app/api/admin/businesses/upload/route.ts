import { NextRequest, NextResponse } from 'next/server';
import { createBusiness, ensureBusinessLocation } from '@/lib/data';
import { Business } from '@/lib/data';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { reHostPhotosToS3 } from '@/lib/s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get JSON business data
    const jsonData = formData.get('business');
    if (!jsonData || typeof jsonData !== 'string') {
      return NextResponse.json(
        { error: 'Missing "business" field with JSON data' },
        { status: 400 }
      );
    }

    let business: Business;
    try {
      business = JSON.parse(jsonData) as Business;
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON in "business" field' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'slug',
      'name',
      'phone',
      'phoneDisplay',
      'address',
      'city',
      'state',
      'stateCode',
      'description',
      'services',
      'areasServed',
      'rating',
      'reviewCount',
    ];

    const missingFields = requiredFields.filter((field) => !(field in business));
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    await ensureBusinessLocation(business);

    // Handle file uploads
    const files = formData.getAll('photos') as File[];
    const uploadedPhotos: string[] = [];

    if (files.length > 0) {
      if (!BUCKET_NAME) {
        return NextResponse.json(
          { error: 'S3 bucket not configured' },
          { status: 500 }
        );
      }

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        if (!file.type.startsWith('image/')) {
          return NextResponse.json(
            { error: `File ${file.name} is not an image` },
            { status: 400 }
          );
        }

        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds 5MB limit` },
            { status: 400 }
          );
        }

        try {
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

          // Generate SEO-friendly filename: {slug}-mobile-tire-repair-{index}.{ext}
          const ext = file.name.split('.').pop();
          const seoFileName = `${business.slug}-mobile-tire-repair-${fileIndex + 1}.${ext}`;
          const key = `business-photos/${seoFileName}`;

          // Convert to Uint8Array (Buffer is a subclass, so always convert to ensure proper type)
          const uploadBytes = Buffer.isBuffer(imageBuffer)
            ? new Uint8Array(imageBuffer)
            : new Uint8Array(imageBuffer as ArrayBuffer);

          const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: uploadBytes,
            ContentType: file.type,
          });

          await s3Client.send(command);
          const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
          uploadedPhotos.push(url);
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          return NextResponse.json(
            { error: `Failed to upload ${file.name}` },
            { status: 500 }
          );
        }
      }
    }

    // Re-host any external URLs from the JSON
    if (business.photos && business.photos.length > 0) {
      const rehostedUrls = await reHostPhotosToS3(business.photos, business.slug, uploadedPhotos.length + 1);
      // Replace original URLs with rehosted ones
      business.photos = rehostedUrls;
    }

    // Merge uploaded photos with any existing photos in JSON
    const allPhotos = [...(business.photos || []), ...uploadedPhotos];
    if (allPhotos.length > 0) {
      business.photos = allPhotos;
    }

    // Generate ID if not provided
    if (!business.id) {
      business.id = Math.random().toString(36).substr(2, 9);
    }

    // Create business in database
    const created = await createBusiness(business);

    return NextResponse.json(
      {
        success: true,
        business: created,
        photosUploaded: uploadedPhotos.length,
        message: `Business created with ${uploadedPhotos.length} photos uploaded`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Business upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create business' },
      { status: 500 }
    );
  }
}
