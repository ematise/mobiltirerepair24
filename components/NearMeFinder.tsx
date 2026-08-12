'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { LocateFixed, Loader2, Phone } from 'lucide-react';
import type { NearbyResponse } from '@/app/api/nearby/route';

type PopularCity = { name: string; href: string };

type FinderState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'loading' }
  | { status: 'results'; data: NearbyResponse }
  | { status: 'error'; kind: 'unsupported' | 'permission' | 'unavailable' | 'fetch' };

function OpenBadge({ openNow, label }: { openNow: boolean | null; label: string | null }) {
  if (openNow === null || !label) return null;
  const colors =
    openNow === true
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${colors}`}
    >
      {label}
    </span>
  );
}

function SkeletonCards() {
  return (
    <div className="mt-6 flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 animate-pulse">
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
          className="inline-flex items-center bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {city.name}
        </Link>
      ))}
    </div>
  );
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-300">
      <span className="text-amber-400" aria-hidden="true">
        ★
      </span>
      <span className="font-semibold text-white">{rating.toFixed(1)}</span>
      <span className="text-slate-400">({reviewCount})</span>
    </span>
  );
}

export default function NearMeFinder({ popularCities }: { popularCities: PopularCity[] }) {
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

  const startLocate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', kind: 'unsupported' });
      return;
    }

    setState({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchNearby(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: 'error', kind: 'permission' });
        } else {
          setState({ status: 'error', kind: 'unavailable' });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 300_000,
      },
    );
  }, [fetchNearby]);

  const isBusy = state.status === 'locating' || state.status === 'loading';

  return (
    <div id="near-me-finder" className="mt-8">
      <button
        type="button"
        onClick={startLocate}
        disabled={isBusy}
        aria-busy={isBusy}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-12 px-8 py-3.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {state.status === 'locating' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Getting your location…
          </>
        ) : (
          <>
            <LocateFixed className="w-5 h-5" aria-hidden="true" />
            Find Tire Repair Near Me
          </>
        )}
      </button>

      {state.status === 'loading' && <SkeletonCards />}

      {state.status === 'error' && (
        <div className="mt-6 text-left max-w-lg mx-auto" role="alert">
          {state.kind === 'unsupported' && (
            <>
              <p className="text-slate-300 text-sm mb-2">
                Your browser does not support location services. Search for your city instead:
              </p>
              <CityChips cities={popularCities} />
            </>
          )}
          {state.kind === 'permission' && (
            <>
              <p className="text-slate-300 text-sm mb-2">
                Location access was denied. Search for your city instead:
              </p>
              <CityChips cities={popularCities} />
            </>
          )}
          {(state.kind === 'unavailable' || state.kind === 'fetch') && (
            <>
              <p className="text-slate-300 text-sm mb-3">
                We couldn&apos;t get your location. Try again or search for your city below.
              </p>
              <button
                type="button"
                onClick={startLocate}
                className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}

      {state.status === 'results' && (
        <div className="mt-6 text-left" aria-live="polite">
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
                <h2 className="text-lg font-semibold text-white">Closest options to you</h2>
                <p className="text-slate-400 text-xs mt-1">Sorted by open now, then distance</p>
              </div>
              <ul className="flex flex-col gap-3" role="list">
                {state.data.results.map((biz) => (
                  <li
                    key={biz.slug}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Link
                        href={`/business/${biz.slug}/`}
                        className="font-semibold text-white hover:text-blue-300 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded min-w-0"
                      >
                        {biz.name}
                      </Link>
                      <OpenBadge openNow={biz.openNow} label={biz.openLabel} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm">
                      <span className="text-slate-400">
                        {biz.distanceMiles} mi · {biz.cityName}, {biz.stateCode}
                      </span>
                      {biz.rating > 0 && (
                        <StarRating rating={biz.rating} reviewCount={biz.reviewCount} />
                      )}
                    </div>
                    <a
                      href={`tel:${biz.phone}`}
                      className="flex items-center justify-center gap-2 w-full min-h-11 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={`Call ${biz.name} at ${biz.phoneDisplay}`}
                    >
                      <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                      Call {biz.phoneDisplay}
                    </a>
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
