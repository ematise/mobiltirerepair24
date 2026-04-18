import Link from 'next/link';
import type { City } from '@/lib/data';

type Props = {
  cities: City[];
  stateSlug: string;
  serviceSlug?: string;
  heading?: string;
};

export default function CityLinks({ cities, stateSlug, serviceSlug, heading }: Props) {
  if (cities.length === 0) return null;

  return (
    <section aria-labelledby="city-links-heading">
      {heading && (
        <h2 id="city-links-heading" className="text-xl font-semibold text-slate-900 mb-4">
          {heading}
        </h2>
      )}
      <ul className="flex flex-col gap-2" role="list">
        {cities.map((city) => {
          const href = serviceSlug
            ? `/${stateSlug}/${city.slug}/${serviceSlug}/`
            : `/${stateSlug}/${city.slug}/`;
          const label = serviceSlug
            ? `${serviceSlug
                .split('-')
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(' ')} in ${city.name}, ${city.stateCode}`
            : `Mobile Tire Repair in ${city.name}, ${city.stateCode}`;

          return (
            <li key={city.slug}>
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0 text-slate-400"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
