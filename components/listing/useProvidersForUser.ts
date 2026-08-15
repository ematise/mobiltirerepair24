'use client';

import { useMemo } from 'react';
import { applyUserDistance, type ProviderListing } from '@/lib/provider-list';
import { useUserLocation } from '@/components/location/UserLocationProvider';

export function useProvidersForUser(providers: ProviderListing[]) {
  const { location, hasUserLocation } = useUserLocation();

  const resolved = useMemo(() => {
    if (!hasUserLocation || !location) {
      return providers.map((p) => ({ ...p, distanceMiles: null }));
    }
    return applyUserDistance(providers, location.lat, location.lng);
  }, [providers, hasUserLocation, location]);

  return { providers: resolved, hasUserLocation };
}
