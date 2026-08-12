import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { slugify } from './slugify';
import {
  getAllCities,
  upsertBusiness,
  ensureBusinessLocation,
  type Business,
  type City,
} from './data';

// ── Places API (New) response types ───────────────────────────────────────────

type PlaceResult = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  businessStatus?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    periods?: Array<{
      open?: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  };
};

type SearchResponse = { places?: PlaceResult[]; nextPageToken?: string };

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.businessStatus',
  'places.types',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
  'nextPageToken',
].join(',');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type FetchBusinessesOptions = {
  citySlugs?: string[];
  maxPages?: number;
  useCache?: boolean;
  dryRun?: boolean;
};

export type FetchBusinessesResult = {
  citiesProcessed: number;
  businessesFound: number;
  created: number;
  updated: number;
  apiCalls: number;
  cacheHits: number;
  cityResults: Array<{ city: string; stateCode: string; count: number }>;
};

function getCacheDir(): string {
  return path.join(os.tmpdir(), 'mobiltirerepair24-places-cache');
}

function mapHours(hours?: PlaceResult['regularOpeningHours']): Business['hours'] | undefined {
  if (!hours?.periods?.length) return undefined;
  const out: NonNullable<Business['hours']> = {};
  for (const p of hours.periods) {
    if (!p.open) continue;
    const day = DAY_NAMES[p.open.day];
    const fmt = (t: { hour: number; minute: number }) =>
      `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    out[day] = p.close
      ? { open: fmt(p.open), close: fmt(p.close) }
      : { open: '00:00', close: '23:59' };
  }
  for (const day of DAY_NAMES) {
    if (!out[day]) out[day] = { open: '', close: '', closed: true };
  }
  return out;
}

function inferServices(name: string): string[] {
  const services = ['mobile-tire-repair', 'flat-tire-repair'];
  if (/install|new tire|tire shop|tire sales|tires? (and|&) wheels/i.test(name)) {
    services.push('tire-installation');
  }
  return services;
}

function isRelevant(place: PlaceResult): boolean {
  if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') return false;
  if (!place.nationalPhoneNumber && !place.internationalPhoneNumber) return false;
  const name = place.displayName?.text ?? '';
  const types = place.types ?? [];
  return (
    /tire|tyre/i.test(name) ||
    types.some((t) => /tire|car_repair|auto/i.test(t)) ||
    /mobile/i.test(name)
  );
}

function toBusiness(place: PlaceResult, city: City): Business {
  const name = place.displayName!.text;
  const phoneIntl = (place.internationalPhoneNumber ?? '').replace(/[^\d+]/g, '');
  return {
    id: `g-${place.id}`,
    name,
    slug: slugify(`${name}-${city.slug}-${city.stateCode}`),
    phone: phoneIntl || (place.nationalPhoneNumber ?? '').replace(/[^\d+]/g, ''),
    phoneDisplay: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? '',
    address: place.formattedAddress ?? `${city.name}, ${city.stateCode}`,
    city: city.slug,
    state: city.state,
    stateCode: city.stateCode,
    services: inferServices(name),
    areasServed: [city.name],
    description: `${name} provides mobile tire services in and around ${city.name}, ${city.stateCode}. Call for availability, pricing, and service area details.`,
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    ...(place.websiteUri ? { website: place.websiteUri } : {}),
    ...(mapHours(place.regularOpeningHours) ? { hours: mapHours(place.regularOpeningHours) } : {}),
  };
}

async function searchTextPage(
  apiKey: string,
  query: string,
  cacheKey: string,
  useCache: boolean,
  stats: { apiCalls: number; cacheHits: number },
  pageToken?: string,
): Promise<SearchResponse> {
  const cacheDir = getCacheDir();
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (useCache && fs.existsSync(cacheFile)) {
    stats.cacheHits++;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  stats.apiCalls++;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status} for "${query}": ${body}`);
  }

  const json = (await res.json()) as SearchResponse;
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(json, null, 2));
  return json;
}

/** Fetch businesses from Google Places and upsert directly into MongoDB. */
export async function fetchBusinessesFromPlaces(
  options: FetchBusinessesOptions = {},
): Promise<FetchBusinessesResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set');
  }

  const {
    citySlugs,
    maxPages = 1,
    useCache = true,
    dryRun = false,
  } = options;

  const pages = Math.min(Math.max(maxPages, 1), 3);
  const allCities = await getAllCities();
  const targets = citySlugs?.length
    ? allCities.filter((c) => citySlugs.includes(c.slug))
    : allCities;

  if (!targets.length) {
    throw new Error(
      citySlugs?.length
        ? `No cities matched: ${citySlugs.join(', ')}`
        : 'No cities in database — add cities in admin first',
    );
  }

  const stats = { apiCalls: 0, cacheHits: 0 };
  const seen = new Set<string>();
  const cityResults: FetchBusinessesResult['cityResults'] = [];
  let created = 0;
  let updated = 0;
  let businessesFound = 0;

  for (const city of targets) {
    const query = `mobile tire repair in ${city.name}, ${city.stateCode}`;
    let pageToken: string | undefined;
    let cityCount = 0;

    for (let page = 0; page < pages; page++) {
      const cacheKey = `${city.slug}-${city.stateCode.toLowerCase()}-p${page + 1}`;
      let data: SearchResponse;
      try {
        data = await searchTextPage(apiKey, query, cacheKey, useCache, stats, pageToken);
      } catch (err) {
        throw new Error(`${city.name}, ${city.stateCode}: ${(err as Error).message}`);
      }

      for (const place of data.places ?? []) {
        if (seen.has(place.id) || !isRelevant(place) || !place.displayName) continue;
        seen.add(place.id);

        const business = toBusiness(place, city);
        businessesFound++;
        cityCount++;

        if (!dryRun) {
          await ensureBusinessLocation(business);
          const { created: isNew } = await upsertBusiness(business);
          if (isNew) created++;
          else updated++;
        }
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    cityResults.push({ city: city.name, stateCode: city.stateCode, count: cityCount });
  }

  return {
    citiesProcessed: targets.length,
    businessesFound,
    created,
    updated,
    apiCalls: stats.apiCalls,
    cacheHits: stats.cacheHits,
    cityResults,
  };
}
