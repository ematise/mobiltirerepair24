'use client';

import { useEffect } from 'react';
import './globals.css';

const SITE_TITLE = 'MobileTireRepair24 — Find Mobile Tire Repair Near You';
const SITE_DESCRIPTION =
  'MobileTireRepair24 is the #1 directory for mobile tire repair services across the United States. Find a technician near you — fast.';

export default function GlobalError({
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
    <html lang="en">
      <head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
      </head>
      <body className="flex flex-col min-h-screen bg-bg text-text">
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center">
            <h1 className="text-3xl font-bold text-heading mb-3">Something went wrong</h1>
            <p className="text-muted mb-8 leading-relaxed">
              We had trouble loading this page. Please try again, or return to the homepage to find
              mobile tire repair near you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" onClick={() => reset()} className="btn btn-primary">
                Try again
              </button>
              <a href="/" className="btn btn-secondary">
                Go to homepage
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
