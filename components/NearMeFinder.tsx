'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { LocateFixed, Loader2 } from 'lucide-react';
import type { NearbyResponse } from '@/app/api/nearby/route';
import type { Service } from '@/lib/data';
import Button from '@/components/ui/Button';
import ProviderCard from '@/components/listing/ProviderCard';
import { useUserLocation } from '@/components/location/UserLocationProvider';

type PopularCity = { name: string; href: string };

type FinderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; data: NearbyResponse }
  | { status: 'error'; kind: 'unsupported' | 'permission' | 'unavailable' | 'fetch' };

function SkeletonCards() {
  return (
    <div className="mt-6 flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-card)] border border-slate-700 bg-slate-800/50 p-4 animate-pulse"
        >
          <div className="h-4 w-2/3 rounded bg-slate-700 mb-3" />
          <div className="h-3 w-1/2 rounded bg-slate-700 mb-4" />
          <div className="h-11 w-full rounded-lg bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

function CityChips({ cities }: { cities: PopularCity[] }) {
  if (cities.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {cities.map((city) => (
        <Link
          key={city.href}
          href={city.href}
          className="btn btn-secondary btn-sm"
        >
          {city.name}
        </Link>
      ))}
    </div>
  );
}

export default function NearMeFinder({
  popularCities,
  services,
}: {
  popularCities: PopularCity[];
  services: Service[];
}) {
  const { location, hasUserLocation, status: locationStatus, requestLocation } =
    useUserLocation();
  const [state, setState] = useState<FinderState>({ status: 'idle' });

  const fetchNearby = useCallback(async (latitude: number, longitude: number) => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(
        `/api/nearby?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
      );
      if (!res.ok) {
        setState({ status: 'error', kind: 'fetch' });
        return;
      }
      const data = (await res.json()) as NearbyResponse;
      setState({ status: 'results', data });
    } catch {
      setState({ status: 'error', kind: 'fetch' });
    }
  }, []);

  useEffect(() => {
    if (hasUserLocation && location) {
      void fetchNearby(location.lat, location.lng);
    }
  }, [hasUserLocation, location, fetchNearby]);

  const startLocate = useCallback(() => {
    if (hasUserLocation && location) {
      void fetchNearby(location.lat, location.lng);
      return;
    }
    requestLocation();
  }, [hasUserLocation, location, fetchNearby, requestLocation]);

  const isBusy = locationStatus === 'locating' || state.status === 'loading';

  const locationError =
    locationStatus === 'unsupported'
      ? 'unsupported'
      : locationStatus === 'denied'
        ? 'permission'
        : locationStatus === 'error'
          ? 'unavailable'
          : null;

  return (
    <div id="near-me-finder" className="mt-8">
      <Button
        type="button"
        onClick={startLocate}
        disabled={isBusy}
        aria-busy={isBusy}
        variant="primary"
        size="lg"
      >
        {locationStatus === 'locating' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Getting your location…
          </>
        ) : hasUserLocation ? (
          <>
            <LocateFixed className="w-5 h-5" aria-hidden="true" />
            Refresh nearby results
          </>
        ) : (
          <>
            <LocateFixed className="w-5 h-5" aria-hidden="true" />
            Find Tire Repair Near Me
          </>
        )}
      </Button>

      {state.status === 'loading' && <SkeletonCards />}

      {(state.status === 'error' || locationError) && (
        <div className="mt-6 text-left max-w-lg mx-auto" role="alert">
          {(state.status === 'error' ? state.kind : locationError) === 'unsupported' && (
            <>
              <p className="text-slate-300 text-sm mb-2">
                Your browser does not support location services. Search for your city instead:
              </p>
              <CityChips cities={popularCities} />
            </>
          )}
          {(state.status === 'error' ? state.kind : locationError) === 'permission' && (
            <>
              <p className="text-slate-300 text-sm mb-2">
                Location access was denied. Search for your city instead:
              </p>
              <CityChips cities={popularCities} />
            </>
          )}
          {((state.status === 'error' && (state.kind === 'unavailable' || state.kind === 'fetch')) ||
            locationError === 'unavailable') && (
            <>
              <p className="text-slate-300 text-sm mb-3">
                We couldn&apos;t get your location. Try again or search for your city below.
              </p>
              <Button type="button" onClick={startLocate} variant="secondary">
                Try again
              </Button>
            </>
          )}
        </div>
      )}

      {state.status === 'results' && (
        <div className="mt-6 text-left max-w-lg mx-auto" aria-live="polite">
          {state.data.results.length === 0 ? (
            <>
              <p className="text-slate-300 text-sm">
                No listed providers near you yet. Browse by state below.
              </p>
              <CityChips cities={popularCities} />
            </>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold !text-white">Closest options to you</h2>
                <p className="text-slate-400 text-xs mt-1">Sorted by open now, then distance</p>
              </div>
              <ul className="flex flex-col gap-3" role="list">
                {state.data.results.map((provider) => (
                  <li key={provider.slug}>
                    <ProviderCard
                      provider={provider}
                      services={services}
                      distanceFromUser
                    />
                  </li>
                ))}
              </ul>
              {state.data.nearestCity && (
                <p className="mt-4 text-center">
                  <Link
                    href={state.data.nearestCity.href}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                  >
                    See all providers in {state.data.nearestCity.name} →
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
