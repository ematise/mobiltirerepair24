'use client';

import type { Business, Service } from '@/lib/data';
import { businessesToProviderListings } from '@/lib/provider-list';
import ProviderCard from '@/components/listing/ProviderCard';
import { useProvidersForUser } from '@/components/listing/useProvidersForUser';

export default function TopRatedBusinesses({
  businesses,
  services,
}: {
  businesses: Business[];
  services: Service[];
}) {
  const baseProviders = businessesToProviderListings(businesses);
  const { providers, hasUserLocation } = useProvidersForUser(baseProviders);

  if (businesses.length === 0) return null;

  return (
    <section aria-labelledby="top-rated-heading">
      <h2
        id="top-rated-heading"
        className="text-base font-semibold text-heading mb-3 [font-family:var(--font-body)]"
      >
        Top-rated mobile tire techs
      </h2>
      <ul className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4" role="list">
        {providers.map((provider) => (
          <li key={provider.slug}>
            <ProviderCard
              provider={provider}
              services={services}
              distanceFromUser={hasUserLocation}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
