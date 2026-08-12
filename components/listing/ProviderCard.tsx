import Link from 'next/link';
import { MapPin, Phone, Star } from 'lucide-react';
import type { ProviderListing } from '@/lib/provider-list';
import { getInitials, serviceNameForSlug } from '@/lib/provider-list';
import type { Service } from '@/lib/data';
import Button from '@/components/ui/Button';
import OpenStatusBadge from '@/components/listing/OpenStatusBadge';

export default function ProviderCard({
  provider,
  services,
}: {
  provider: ProviderListing;
  services: Service[];
}) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cta-soft text-sm font-semibold text-cta [font-family:var(--font-body)]"
          aria-hidden="true"
        >
          {getInitials(provider.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-heading leading-snug [font-family:var(--font-body)]">
              <Link
                href={`/business/${provider.slug}/`}
                className="hover:text-cta transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded"
              >
                {provider.name}
              </Link>
            </h3>
            <OpenStatusBadge openNow={provider.openNow} label={provider.openLabel} />
          </div>

          {(provider.rating > 0 || provider.distanceMiles !== null) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm [font-family:var(--font-body)]">
              {provider.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-heading">
                  <Star className="h-3.5 w-3.5 fill-star text-star" strokeWidth={0} aria-hidden="true" />
                  <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                  <span className="text-muted">({provider.reviewCount})</span>
                </span>
              )}
              {provider.distanceMiles !== null && (
                <span className="inline-flex items-center gap-1 text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                  {provider.distanceMiles} mi
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-muted line-clamp-2 [font-family:var(--font-body)]">
        {provider.description}
      </p>

      {provider.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {provider.services.slice(0, 3).map((slug) => (
            <span
              key={slug}
              className="inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text [font-family:var(--font-body)]"
            >
              {serviceNameForSlug(slug, services)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button
          href={`tel:${provider.phone}`}
          variant="secondary"
          block
          aria-label={`Call ${provider.name} at ${provider.phoneDisplay}`}
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          {provider.phoneDisplay}
        </Button>
      </div>
    </article>
  );
}
