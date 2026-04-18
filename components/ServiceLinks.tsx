import Link from 'next/link';
import type { Service } from '@/lib/data';

type Props = {
  services: Service[];
  citySlug: string;
  stateSlug: string;
  heading?: string;
};

export default function ServiceLinks({ services, citySlug, stateSlug, heading }: Props) {
  if (services.length === 0) return null;

  return (
    <section aria-labelledby="service-links-heading">
      {heading && (
        <h2 id="service-links-heading" className="text-xl font-semibold text-slate-900 mb-4">
          {heading}
        </h2>
      )}
      <ul className="flex flex-col gap-2" role="list">
        {services.map((svc) => (
          <li key={svc.slug}>
            <Link
              href={`/${stateSlug}/${citySlug}/${svc.slug}/`}
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
              {svc.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
