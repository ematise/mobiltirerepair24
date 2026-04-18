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
  limit?: 3 | 5;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function ReviewHighlights({
  businessSlug,
  limit = 3,
}: ReviewHighlightsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?slug=${encodeURIComponent(businessSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews.slice(0, limit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessSlug, limit]);

  if (loading || reviews.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Recent Reviews</SectionHeading>
      <div className="space-y-3">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">{review.displayName}</p>
                <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
