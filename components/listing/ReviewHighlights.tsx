'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface Review {
  displayName: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export interface ReviewHighlightsProps {
  businessSlug: string;
  totalCount: number;
  limit?: 2 | 3 | 5;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? 'text-star' : 'text-gray-300'}`}
          strokeWidth={1.7}
          fill="none"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function ReviewHighlights({
  businessSlug,
  totalCount,
  limit = 2,
}: ReviewHighlightsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?slug=${encodeURIComponent(businessSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        const withComments = (data.reviews as Review[]).filter((r) => r.comment?.trim());
        setReviews(withComments.slice(0, limit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessSlug, limit]);

  if (loading || reviews.length === 0) return null;

  const shownOf = Math.max(totalCount, reviews.length);

  return (
    <SectionContainer>
      <SectionHeading>What customers say</SectionHeading>
      <div className="flex flex-col gap-2.5">
        {reviews.map((review, idx) => (
          <div
            key={`${review.createdAt}-${idx}`}
            className="flex items-start gap-3 rounded-[14px] border border-gray-200 bg-white px-3.5 py-3.5"
          >
            <span
              className="flex items-center justify-center w-11 h-11 rounded-full bg-cta-soft text-cta text-[13px] font-bold shrink-0"
              aria-hidden="true"
            >
              {initials(review.displayName)}
            </span>
            <div className="min-w-0 pt-0.5">
              <StarRating rating={review.rating} />
              <p className="text-[14px] text-gray-600 leading-relaxed mt-1.5">
                {review.comment}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-gray-400 mt-3">
        Showing {reviews.length} of {shownOf} {shownOf === 1 ? 'review' : 'reviews'}
      </p>
    </SectionContainer>
  );
}
