'use client';

import type { Service } from '@/lib/data';

type Props = {
  services: Service[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export default function ServiceFilterPills({ services, activeSlug, onSelect }: Props) {
  if (services.length === 0) return null;

  return (
    <div className="relative -mx-4 px-4">
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="tablist"
        aria-label="Filter by service"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSlug === null}
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta [font-family:var(--font-body)] ${
            activeSlug === null
              ? 'border-heading bg-heading text-surface'
              : 'border-border bg-surface text-text hover:bg-surface-hover'
          }`}
        >
          All services
        </button>
        {services.map((svc) => (
          <button
            key={svc.slug}
            type="button"
            role="tab"
            aria-selected={activeSlug === svc.slug}
            onClick={() => onSelect(svc.slug)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta [font-family:var(--font-body)] ${
              activeSlug === svc.slug
                ? 'border-heading bg-heading text-surface'
                : 'border-border bg-surface text-text hover:bg-surface-hover'
            }`}
          >
            {svc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
