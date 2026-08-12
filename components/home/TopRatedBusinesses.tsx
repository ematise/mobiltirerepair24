import Link from 'next/link';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import type { Business } from '@/lib/data';

function formatCitySlug(slug: string) {
  return slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export default function TopRatedBusinesses({ businesses }: { businesses: Business[] }) {
  if (businesses.length === 0) return null;

  return (
    <section aria-labelledby="top-rated-heading">
      <h2 id="top-rated-heading" className="text-2xl font-semibold text-slate-900 mb-6">
        Top-rated mobile tire techs
      </h2>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0 md:gap-6">
        {businesses.map((biz) => (
          <article
            key={biz.slug}
            className="snap-start shrink-0 w-72 md:w-auto border border-slate-200 rounded-lg bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            {biz.photos?.[0] ? (
              <div className="relative h-36 w-full">
                <Image
                  src={biz.photos[0]}
                  alt={`${biz.name} photo`}
                  fill
                  className="object-cover"
                  sizes="288px"
                />
              </div>
            ) : (
              <div className="h-36 w-full bg-slate-100" aria-hidden="true" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 leading-tight">
                <Link
                  href={`/business/${biz.slug}/`}
                  className="hover:text-blue-700 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {biz.name}
                </Link>
              </h3>
              {biz.rating > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-sm">
                  <span className="text-amber-400" aria-hidden="true">
                    ★
                  </span>
                  <span className="font-semibold text-slate-800">{biz.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({biz.reviewCount})</span>
                </div>
              )}
              <p className="text-slate-500 text-sm mt-1">
                {formatCitySlug(biz.city)}, {biz.stateCode}
              </p>
              <a
                href={`tel:${biz.phone}`}
                className="inline-flex items-center gap-1.5 mt-3 text-blue-700 font-semibold text-sm hover:text-blue-800 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded min-h-11"
                aria-label={`Call ${biz.name} at ${biz.phoneDisplay}`}
              >
                <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                {biz.phoneDisplay}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
