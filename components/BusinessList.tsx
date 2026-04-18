import type { Business } from '@/lib/data';
import BusinessCard from './BusinessCard';

export default function BusinessList({
  businesses,
  heading,
}: {
  businesses: Business[];
  heading?: string;
}) {
  if (businesses.length === 0) return null;

  return (
    <section aria-labelledby="business-list-heading">
      {heading && (
        <h2
          id="business-list-heading"
          className="text-2xl font-semibold text-slate-900 mb-5"
        >
          {heading}
        </h2>
      )}
      <div className="flex flex-col gap-4">
        {businesses.map((biz) => (
          <BusinessCard key={biz.id} biz={biz} />
        ))}
      </div>
    </section>
  );
}
