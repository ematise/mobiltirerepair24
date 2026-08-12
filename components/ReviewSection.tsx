'use client';

import { useState, useEffect, useRef } from 'react';
import type { Review } from '@/app/api/reviews/route';
import Button from '@/components/ui/Button';

const ANON_ADJECTIVES = ['Happy', 'Quick', 'Friendly', 'Helpful', 'Honest', 'Local', 'Loyal', 'Trusted'];
const ANON_NOUNS = ['Driver', 'Customer', 'Motorist', 'Traveler', 'Commuter', 'Rider'];

function randomAnonName() {
  const adj = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)];
  const noun = ANON_NOUNS[Math.floor(Math.random() * ANON_NOUNS.length)];
  return `${adj}${noun}`;
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
      render: (container: string | HTMLElement, params: object) => number;
    };
  }
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <svg
            className={`w-8 h-8 transition-colors duration-75 ${
              star <= display ? 'text-amber-400' : 'text-slate-300'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-gray-200 bg-white px-3.5 py-3.5">
      <span
        className="flex items-center justify-center w-11 h-11 rounded-full bg-cta-soft text-cta text-[13px] font-bold shrink-0"
        aria-hidden="true"
      >
        {review.displayName
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p, _i, arr) => (arr.length === 1 ? p.slice(0, 2) : p[0]))
          .join('')
          .toUpperCase() || '?'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="font-medium text-gray-900 text-sm [font-family:var(--font-body)]">{review.displayName}</p>
          <p className="text-xs text-gray-400 shrink-0">{date}</p>
        </div>
        <div className="flex items-center gap-0.5 mb-1.5" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-star' : 'text-gray-300'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
      </div>
    </div>
  );
}

export default function ReviewSection({ businessSlug }: { businessSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // Check if user already reviewed this business
  useEffect(() => {
    const reviewed = localStorage.getItem(`reviewed_${businessSlug}`);
    setHasReviewed(!!reviewed);
  }, [businessSlug]);

  // Load existing reviews
  useEffect(() => {
    fetch(`/api/reviews?slug=${encodeURIComponent(businessSlug)}`)
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [businessSlug]);

  // Load reCAPTCHA script once
  useEffect(() => {
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?onload=__rcLoaded&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Render reCAPTCHA widget once the container is in the DOM
  useEffect(() => {
    function tryRender() {
      if (!captchaRef.current || widgetIdRef.current !== null) return;
      if (typeof window.grecaptcha?.render !== 'function') return;
      widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      });
    }

    // grecaptcha might already be ready
    if (typeof window.grecaptcha?.render === 'function') {
      tryRender();
    } else {
      // Wait for the onload callback
      (window as unknown as Record<string, unknown>).__rcLoaded = () => {
        window.grecaptcha.ready(tryRender);
      };
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    const token =
      widgetIdRef.current !== null
        ? window.grecaptcha?.getResponse(widgetIdRef.current)
        : window.grecaptcha?.getResponse();

    if (!token) {
      setError('Please complete the reCAPTCHA check.');
      return;
    }

    const resolvedName = displayName.trim() || (comment.trim() ? randomAnonName() : '');

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessSlug, displayName: resolvedName, comment, rating, recaptchaToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
      } else {
        setSubmitted(true);
        setHasReviewed(true);
        localStorage.setItem(`reviewed_${businessSlug}`, 'true');
        setReviews((prev) => [
          { businessSlug, displayName: resolvedName, comment, rating, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        // Reload page after 2 seconds to show updated rating
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="text-[22px] font-bold text-gray-950 mb-4 tracking-tight [font-family:var(--font-body)]">
        Leave a review
      </h2>

      {/* Submit form */}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm mb-8">
          Thank you for your review!
        </div>
      ) : hasReviewed ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm mb-8">
          You've already reviewed this business. Thank you for your feedback!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-[14px] p-5 mb-8 space-y-4">
          <p className="text-sm font-medium text-slate-700">Leave a review</p>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Your rating <span className="text-red-500">*</span>
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-slate-600 mb-1">
              Display name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John D. — leave blank to post anonymously"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-xs font-medium text-slate-600 mb-1">
              Comment <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="comment"
              maxLength={1000}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div ref={captchaRef} />

          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}

          <Button type="submit" disabled={submitting} variant="primary">
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
        </form>
      )}

      {/* Review list */}
      {loadingReviews ? (
        <p className="text-slate-400 text-sm">Loading reviews…</p>
      ) : reviews.filter((r) => r.comment?.trim()).length === 0 ? (
        <p className="text-slate-400 text-sm hidden">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.filter((r) => r.comment?.trim()).map((r) => (
            <ReviewCard key={r.createdAt} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
