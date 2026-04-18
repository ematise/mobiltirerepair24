'use client';

import { Star } from 'lucide-react';

export interface RatingBadgeProps {
  rating: number;
  count: number;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarIcon({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  if (fill === 'full') {
    return (
      <svg
        className="w-4 h-4 text-amber-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={STAR_PATH} />
      </svg>
    );
  }
  if (fill === 'empty') {
    return (
      <svg
        className="w-4 h-4 text-slate-300"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={STAR_PATH} />
      </svg>
    );
  }
  return (
    <span
      className="relative inline-block w-4 h-4"
      aria-hidden="true"
    >
      <svg
        className="w-4 h-4 text-slate-300 absolute inset-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
      <svg
        className="w-4 h-4 text-amber-400 absolute inset-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        style={{ clipPath: 'inset(0 50% 0 0)' }}
      >
        <path d={STAR_PATH} />
      </svg>
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  const r = Math.round(rating * 2) / 2;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rating: ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = r >= i ? 'full' : r >= i - 0.5 ? 'half' : 'empty';
        return <StarIcon key={i} fill={fill} />;
      })}
    </div>
  );
}

export default function RatingBadge({ rating, count }: RatingBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Stars rating={rating} />
      <span className="text-slate-600 text-sm">
        {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
