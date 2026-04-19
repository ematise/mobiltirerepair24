import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/db';
import { updateBusiness, getBusinessBySlug } from '@/lib/data';

export const runtime = 'nodejs';

export type Review = {
  businessSlug: string;
  displayName: string;
  comment: string;
  rating: number;
  createdAt: string;
};

// GET /api/reviews?slug=<businessSlug>
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ reviews: [], averageRating: null, totalCount: 0 });

  try {
    const db = await getDb();
    const col = db.collection(COLLECTIONS.reviews);

    const [reviews, agg] = await Promise.all([
      col
        .find({ businessSlug: slug }, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
      col
        .aggregate([
          { $match: { businessSlug: slug } },
          { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const averageRating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : null;
    const totalCount = agg[0]?.count ?? 0;

    return NextResponse.json({ reviews, averageRating, totalCount });
  } catch {
    return NextResponse.json({ reviews: [], averageRating: null, totalCount: 0 }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessSlug, displayName, comment, rating, recaptchaToken } = body;

    // Basic validation
    if (
      !businessSlug ||
      typeof businessSlug !== 'string' ||
      typeof rating !== 'number' ||
      rating < 1 ||
      rating > 5 ||
      !recaptchaToken
    ) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    // Verify reCAPTCHA
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    const captchaResult = await verify.json();
    if (!captchaResult.success) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed.' }, { status: 400 });
    }

    const review: Review = {
      businessSlug: businessSlug.trim(),
      displayName: displayName.trim().slice(0, 60),
      comment: comment.trim().slice(0, 1000),
      rating: Math.round(rating),
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection(COLLECTIONS.reviews).insertOne(review);

    // Get original business rating and count (from admin panel)
    const business = await getBusinessBySlug(businessSlug.trim());
    const initialRating = business?.rating ?? 0;
    const initialCount = business?.reviewCount ?? 0;

    // Get all user-submitted reviews
    const agg = await db
      .collection(COLLECTIONS.reviews)
      .aggregate([
        { $match: { businessSlug: businessSlug.trim() } },
        { $group: { _id: null, sum: { $sum: '$rating' }, count: { $sum: 1 } } },
      ])
      .toArray();

    if (agg[0]) {
      const userReviewSum = agg[0].sum;
      const userReviewCount = agg[0].count;

      // Combine initial admin rating with user reviews
      const totalSum = (initialRating * initialCount) + userReviewSum;
      const totalCount = initialCount + userReviewCount;
      const combinedRating = Math.round((totalSum / totalCount) * 10) / 10;

      await updateBusiness(businessSlug.trim(), {
        rating: combinedRating,
        reviewCount: totalCount,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
