/**
 * fetch-businesses.ts — pulls REAL mobile tire repair businesses from the
 * Google Places API (New) and maps them into the Business schema used by
 * this directory (data/businesses.json → scripts/seed.ts → MongoDB).
 *
 * Cost: uses Text Search with Enterprise-tier fields (phone, website, hours).
 * Each request returns up to 20 businesses and Google gives 1,000 free
 * Enterprise Text Search calls per month, so fetching every city in
 * data/cities.json costs $0. Raw responses are cached on disk so re-runs
 * don't spend API calls.
 *
 * Setup:
 *   1. Create a Google Cloud project, enable "Places API (New)", create an
 *      API key: https://console.cloud.google.com/google/maps-apis
 *   2. (Recommended) In Google Cloud console, cap the "Text Search Enterprise"
 *      quota below 1,000/month so you can never be billed.
 *   3. Add GOOGLE_MAPS_API_KEY=... to .env.local
 *
 * Usage:
 *   npx tsx scripts/fetch-businesses.ts                  # all cities → data/businesses.fetched.json
 *   npx tsx scripts/fetch-businesses.ts --cities dallas,houston
 *   npx tsx scripts/fetch-businesses.ts --pages 2        # up to 40 results/city (2 API calls/city)
 *   npx tsx scripts/fetch-businesses.ts --merge          # also merge into data/businesses.json
 *   npx tsx scripts/fetch-businesses.ts --no-cache       # ignore disk cache, refetch
 *
 * After reviewing the output, run `npx tsx scripts/seed.ts` to push to MongoDB.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { slugify } from '../lib/slugify';
import type { Business, City } from '../lib/data';

dotenv.config({ path: ['.env.local', '.env'] });

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE_DIR = path.join(DATA_DIR, '.places-cache');
const OUT_FILE = path.join(DATA_DIR, 'businesses.fetched.json');
const BUSINESSES_FILE = path.join(DATA_DIR, 'businesses.json');

// ── Places API (New) response types (only the fields we request) ────────────

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

// Every field below the Enterprise tier — requesting rating/hours/phone/website
// bills the whole call as "Text Search Enterprise" (1,000 free/month).
// Do NOT add fields like places.reviews or places.paymentOptions: those bump
// the call to "Enterprise + Atmosphere" pricing.
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

let apiCalls = 0;
let cacheHits = 0;

async function searchTextPage(
  query: string,
  cacheKey: string,
  useCache: boolean,
  pageToken?: string,
): Promise<SearchResponse> {
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (useCache && fs.existsSync(cacheFile)) {
    cacheHits++;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY!,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  apiCalls++;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status} for "${query}": ${body}`);
  }

  const json = (await res.json()) as SearchResponse;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(json, null, 2));
  return json;
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function mapHours(hours?: PlaceResult['regularOpeningHours']): Business['hours'] | undefined {
  if (!hours?.periods?.length) return undefined;
  const out: NonNullable<Business['hours']> = {};
  for (const p of hours.periods) {
    if (!p.open) continue;
    const day = DAY_NAMES[p.open.day];
    // A period with an open time but no close means open 24 hours that day.
    const fmt = (t: { hour: number; minute: number }) =>
      `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    out[day] = p.close
      ? { open: fmt(p.open), close: fmt(p.close) }
      : { open: '00:00', close: '23:59' };
  }
  // Mark days Google reported nothing for as closed.
  for (const day of DAY_NAMES) {
    if (!out[day]) out[day] = { open: '', close: '', closed: true };
  }
  return out;
}

function inferServices(name: string): string[] {
  // Every result came from a "mobile tire repair" search, and flat/puncture
  // repair is the core of that trade, so both are safe defaults. Only claim
  // installation when the name suggests it — enrich manually or from the
  // business's own website later.
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

function toBusiness(place: PlaceResult, city: City): Business & { placeId: string } {
  const name = place.displayName!.text;
  const phoneIntl = (place.internationalPhoneNumber ?? '').replace(/[^\d+]/g, '');
  return {
    placeId: place.id,
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY not set — add it to .env.local');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const getFlag = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const cityFilter = getFlag('cities')?.split(',').map((s) => s.trim());
  const maxPages = Math.min(Number(getFlag('pages') ?? 1), 3);
  const useCache = !args.includes('--no-cache');
  const merge = args.includes('--merge');

  const cities: Record<string, City> = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'),
  );
  const targets = Object.values(cities).filter(
    (c) => !cityFilter || cityFilter.includes(c.slug),
  );
  if (!targets.length) {
    console.error(`No cities matched: ${cityFilter?.join(', ')}`);
    process.exit(1);
  }

  console.log(`Fetching businesses for ${targets.length} cities (max ${maxPages} page(s) each)...\n`);

  const seen = new Set<string>();
  const results: Business[] = [];

  for (const city of targets) {
    const query = `mobile tire repair in ${city.name}, ${city.stateCode}`;
    let pageToken: string | undefined;
    let cityCount = 0;

    for (let page = 0; page < maxPages; page++) {
      const cacheKey = `${city.slug}-${city.stateCode.toLowerCase()}-p${page + 1}`;
      let data: SearchResponse;
      try {
        data = await searchTextPage(query, cacheKey, useCache, pageToken);
      } catch (err) {
        console.error(`  ✗ ${city.name}: ${(err as Error).message}`);
        break;
      }

      for (const place of data.places ?? []) {
        if (seen.has(place.id) || !isRelevant(place) || !place.displayName) continue;
        seen.add(place.id);
        results.push(toBusiness(place, city));
        cityCount++;
      }

      pageToken = data.nextPageToken;
      if (!pageToken) break;
      // Page tokens need a moment before they become valid.
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log(`  ✓ ${city.name}, ${city.stateCode}: ${cityCount} businesses`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nWrote ${results.length} businesses → ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`API calls: ${apiCalls} (free tier: 1,000/month) · cache hits: ${cacheHits}`);

  if (merge) {
    const existing: Business[] = JSON.parse(fs.readFileSync(BUSINESSES_FILE, 'utf8'));
    // Fetched (real) data wins over existing entries with the same slug.
    const fetchedSlugs = new Set(results.map((b) => b.slug));
    const kept = existing.filter((b) => !fetchedSlugs.has(b.slug));
    const mergedList = [...kept, ...results];
    fs.writeFileSync(BUSINESSES_FILE, JSON.stringify(mergedList, null, 2) + '\n');
    console.log(`Merged into ${path.relative(process.cwd(), BUSINESSES_FILE)} (${mergedList.length} total). Review the diff, then run: npx tsx scripts/seed.ts`);
  } else {
    console.log('Review the file, then re-run with --merge to update data/businesses.json.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
