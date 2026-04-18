'use client';

import { useState, useEffect, useRef } from 'react';
import type { Review } from '@/app/api/reviews/route';

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
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-medium text-slate-900 text-sm">{review.displayName}</p>
          <p className="text-xs text-slate-400">{date}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((s) => (
            <svg
              key={s}
              className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
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

  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

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
        setReviews((prev) => [
          { businessSlug, displayName: resolvedName, comment, rating, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      window.grecaptcha?.reset(widgetIdRef.current ?? undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 border-t border-slate-200 pt-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Reviews</h2>

      {/* Submit form */}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm mb-8">
          Thank you for your review!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 space-y-4">
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

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Review list */}
      {loadingReviews ? (
        <p className="text-slate-400 text-sm">Loading reviews…</p>
      ) : reviews.filter((r) => r.comment?.trim()).length === 0 ? (
        <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.filter((r) => r.comment?.trim()).map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
