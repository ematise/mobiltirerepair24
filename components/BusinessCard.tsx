import Link from 'next/link';
import type { Business } from '@/lib/data';

export default function BusinessCard({ biz }: { biz: Business }) {
  return (
    <article className="border border-slate-200 rounded-lg p-5 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-lg leading-tight">
            <Link
              href={`/business/${biz.slug}/`}
              className="hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-colors duration-150"
            >
              {biz.name}
            </Link>
          </h3>
          <p className="text-slate-600 text-sm mt-1">{biz.address}</p>
        </div>

        {biz.rating && (
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 justify-end">
              <svg
                className="w-4 h-4 text-amber-400 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-slate-800 text-sm">
                {biz.rating.toFixed(1)}
              </span>
              <span className="text-slate-400 text-xs">({biz.reviewCount})</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-sm mt-3 leading-relaxed line-clamp-2">
        {biz.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {biz.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded border border-blue-100"
            >
              {s
                .split('-')
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(' ')}
            </span>
          ))}
        </div>

        <a
          href={`tel:${biz.phone}`}
          className="inline-flex items-center gap-1.5 text-blue-700 font-semibold text-sm hover:text-blue-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded cursor-pointer"
          aria-label={`Call ${biz.name} at ${biz.phoneDisplay}`}
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.64A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
          </svg>
          {biz.phoneDisplay}
        </a>
      </div>
    </article>
  );
}
