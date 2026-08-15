import { NextRequest, NextResponse } from 'next/server';
import { getAllBusinesses, getAllCities } from '@/lib/data';
import { haversineMiles, isValidLatLng } from '@/lib/geo';
import { businessToProviderListing } from '@/lib/provider-list';
import type { ProviderListing } from '@/lib/provider-list';
export const runtime = 'nodejs';

export type NearbyBusiness = ProviderListing;

export type NearbyResponse = {
  results: NearbyBusiness[];
  nearestCity: { name: string; href: string; distanceMiles: number } | null;
};

function openSortRank(openNow: boolean | null): number {
  if (openNow === true) return 0;
  if (openNow === null) return 1;
  return 2;
}

export async function GET(req: NextRequest) {  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lng = Number(req.nextUrl.searchParams.get('lng'));
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? 5);
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 5, 1), 10);

  if (!isValidLatLng(lat, lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const [cities, businesses] = await Promise.all([getAllCities(), getAllBusinesses()]);
    const cityMap = new Map(cities.map((c) => [`${c.slug}:${c.state}`, c]));

    const cityDistances = new Map<string, number>();
    let nearestCity: NearbyResponse['nearestCity'] = null;

    for (const city of cities) {
      if (!isValidLatLng(city.lat, city.lng)) continue;
      const dist = haversineMiles(lat, lng, city.lat, city.lng);
      cityDistances.set(`${city.slug}:${city.state}`, dist);
      if (!nearestCity || dist < nearestCity.distanceMiles) {
        nearestCity = {
          name: city.name,
          href: `/${city.state}/${city.slug}/`,
          distanceMiles: Math.round(dist * 10) / 10,
        };
      }
    }

    const ranked = businesses
      .map((biz) => {
        const city = cityMap.get(`${biz.city}:${biz.state}`);
        if (!city) return null;

        let distanceMiles: number | null = null;
        if (isValidLatLng(biz.lat ?? 0, biz.lng ?? 0)) {
          distanceMiles = haversineMiles(lat, lng, biz.lat!, biz.lng!);
        } else if (isValidLatLng(city.lat, city.lng)) {
          distanceMiles = cityDistances.get(`${city.slug}:${city.state}`) ?? null;
        }
        if (distanceMiles === null) return null;

        return businessToProviderListing(biz, {
          stateCode: biz.stateCode,
          distanceMiles: Math.round(distanceMiles * 10) / 10,
        }) satisfies NearbyBusiness;      })
      .filter((b): b is NearbyBusiness => b !== null)
      .sort((a, b) => {
        const openDiff = openSortRank(a.openNow) - openSortRank(b.openNow);
        if (openDiff !== 0) return openDiff;
        const aDist = a.distanceMiles ?? Number.POSITIVE_INFINITY;
        const bDist = b.distanceMiles ?? Number.POSITIVE_INFINITY;
        if (aDist !== bDist) return aDist - bDist;
        return b.rating - a.rating;
      })
      .slice(0, limit);

    const response: NearbyResponse = {
      results: ranked,
      nearestCity,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { results: [], nearestCity: null } satisfies NearbyResponse,
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
