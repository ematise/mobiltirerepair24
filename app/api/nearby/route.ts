import { NextRequest, NextResponse } from 'next/server';
import { getAllBusinesses, getAllCities } from '@/lib/data';
import { haversineMiles, isValidLatLng } from '@/lib/geo';
import { getOpenStatus } from '@/lib/open-now';
import { timezoneForStateCode } from '@/lib/timezones';

export const runtime = 'nodejs';

export type NearbyBusiness = {
  slug: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  rating: number;
  reviewCount: number;
  cityName: string;
  stateCode: string;
  distanceMiles: number;
  openNow: boolean | null;
  openLabel: string | null;
  photo: string | null;
};

export type NearbyResponse = {
  results: NearbyBusiness[];
  nearestCity: { name: string; href: string; distanceMiles: number } | null;
};

function openSortRank(openNow: boolean | null): number {
  if (openNow === true) return 0;
  if (openNow === null) return 1;
  return 2;
}

function formatCityName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
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

        const openStatus = getOpenStatus(biz.hours, timezoneForStateCode(biz.stateCode));

        return {
          slug: biz.slug,
          name: biz.name,
          phone: biz.phone,
          phoneDisplay: biz.phoneDisplay,
          rating: biz.rating,
          reviewCount: biz.reviewCount,
          cityName: city.name || formatCityName(biz.city),
          stateCode: biz.stateCode,
          distanceMiles: Math.round(distanceMiles * 10) / 10,
          openNow: openStatus?.openNow ?? null,
          openLabel: openStatus?.label ?? null,
          photo: biz.photos?.[0] ?? null,
        } satisfies NearbyBusiness;
      })
      .filter((b): b is NearbyBusiness => b !== null)
      .sort((a, b) => {
        const openDiff = openSortRank(a.openNow) - openSortRank(b.openNow);
        if (openDiff !== 0) return openDiff;
        if (a.distanceMiles !== b.distanceMiles) return a.distanceMiles - b.distanceMiles;
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
