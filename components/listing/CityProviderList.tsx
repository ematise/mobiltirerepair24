'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { ProviderListing, SortMode } from '@/lib/provider-list';
import { filterProvidersByService, sortProviders } from '@/lib/provider-list';
import type { Service } from '@/lib/data';
import ProviderCard from '@/components/listing/ProviderCard';
import ServiceFilterPills from '@/components/listing/ServiceFilterPills';
import { useProvidersForUser } from '@/components/listing/useProvidersForUser';

type Props = {
  providers: ProviderListing[];
  services: Service[];
  cityName: string;
  initialServiceSlug?: string | null;
};

const SORT_LABELS: Record<SortMode, string> = {
  nearest: 'Nearest',
  rating: 'Top rated',
};

export default function CityProviderList({
  providers,
  services,
  cityName,
  initialServiceSlug = null,
}: Props) {
  const { providers: userProviders, hasUserLocation } = useProvidersForUser(providers);
  const [serviceFilter, setServiceFilter] = useState<string | null>(initialServiceSlug);
  const [sortMode, setSortMode] = useState<SortMode>('rating');
  const [sortTouched, setSortTouched] = useState(false);

  useEffect(() => {
    if (hasUserLocation && !sortTouched) {
      setSortMode('nearest');
    }
  }, [hasUserLocation, sortTouched]);

  const visible = useMemo(() => {
    const filtered = filterProvidersByService(userProviders, serviceFilter);
    return sortProviders(filtered, sortMode);
  }, [userProviders, serviceFilter, sortMode]);

  function toggleSort() {
    setSortTouched(true);
    setSortMode((mode) => (mode === 'nearest' ? 'rating' : 'nearest'));
  }

  if (providers.length === 0) return null;

  const countLabel =
    visible.length === 1
      ? `1 provider in ${cityName}`
      : `${visible.length} providers in ${cityName}`;

  const sortHint = hasUserLocation && sortMode === 'nearest' ? 'Sorted by distance from you' : null;

  return (
    <section aria-labelledby="top-providers-heading">
      <h2
        id="top-providers-heading"
        className="text-base font-semibold text-heading mb-3 [font-family:var(--font-body)]"
      >
        Top providers
      </h2>

      <ServiceFilterPills
        services={services}
        activeSlug={serviceFilter}
        onSelect={setServiceFilter}
      />

      <div className="mt-4 mb-3 flex items-center justify-between gap-3 text-[13px] text-muted [font-family:var(--font-body)]">
        <div>
          <p>{countLabel}</p>
          {sortHint && <p className="text-xs mt-0.5">{sortHint}</p>}
        </div>
        <button
          type="button"
          onClick={toggleSort}
          className="inline-flex items-center gap-1 font-medium text-text hover:text-heading transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded shrink-0"
          aria-label={`Sort by ${SORT_LABELS[sortMode]}. Click to change.`}
        >
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Sort: {SORT_LABELS[sortMode]}
        </button>
      </div>

      <ul className="flex flex-col gap-3" role="list">
        {visible.map((provider) => (
          <li key={provider.slug}>
            <ProviderCard
              provider={provider}
              services={services}
              distanceFromUser={hasUserLocation}
            />
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-sm text-muted [font-family:var(--font-body)]">
          No providers offer this service in {cityName} yet.
        </p>
      )}
    </section>
  );
}
