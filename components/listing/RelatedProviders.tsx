'use client';

import type { ProviderListing } from '@/lib/provider-list';
import type { Service } from '@/lib/data';
import ProviderCard from '@/components/listing/ProviderCard';
import { useProvidersForUser } from '@/components/listing/useProvidersForUser';

export default function RelatedProviders({
  providers,
  services,
}: {
  providers: ProviderListing[];
  services: Service[];
}) {
  const { providers: userProviders, hasUserLocation } = useProvidersForUser(providers);

  if (userProviders.length === 0) return null;

  return (
    <ul className="flex flex-col gap-3 mb-4" role="list">
      {userProviders.map((provider) => (
        <li key={provider.slug}>
          <ProviderCard
            provider={provider}
            services={services}
            distanceFromUser={hasUserLocation}
          />
        </li>
      ))}
    </ul>
  );
}
