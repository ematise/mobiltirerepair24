'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Something went wrong</h1>
      <p className="text-slate-600 mb-8 leading-relaxed">
        We had trouble loading this page. Please try again, or return to the homepage.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn-primary"
        >
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
