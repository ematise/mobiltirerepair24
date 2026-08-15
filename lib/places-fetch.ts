import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { slugify } from './slugify';
import { mapGoogleOpeningHours, type GoogleOpeningHours } from './hours';
import { reHostPhotosToS3, isS3Configured, checkS3Available } from './s3';
import { fetchWithTimeout, withTimeout } from './fetch-with-timeout';
import { pingDb } from './db';
import {
  getAllCities,
  getBusinessCountsByCity,
  getBusinessesByCity,
  getBusinessPhotos,
  getManualReviewAggregate,
  combineRatingWithReviews,
  upsertBusiness,
  ensureBusinessLocation,
  type Business,
  type City,
} from './data';
import {
  cityBoundingBox,
  US_WIDE_RECTANGLE,
  validateUsPlace,
  type LocationRectangle,
} from './us-location';

// ── Places API (New) response types ───────────────────────────────────────────

type PlacePhoto = {
  name: string;
  widthPx?: number;
  heightPx?: number;
};

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
  regularOpeningHours?: GoogleOpeningHours;
  photos?: PlacePhoto[];
  location?: { latitude: number; longitude: number };
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
  'places.photos',
  'places.location',
  'nextPageToken',
].join(',');

/** Target coverage per city. Extra Google results are discarded to save photo API calls. */
const MAX_BUSINESSES_PER_CITY = 3;

const PLACES_SEARCH_TIMEOUT_MS = 30_000;
const PLACES_PHOTO_TIMEOUT_MS = 20_000;

export type ServiceCheckResult = {
  ok: boolean;
  message: string;
};

export type FetchServiceChecks = {
  mongodb: ServiceCheckResult;
  googlePlaces: ServiceCheckResult;
  s3: ServiceCheckResult & { configured: boolean };
};

/** Preflight checks for MongoDB, Google Places, and S3 before a long fetch run. */
export async function checkFetchServices(): Promise<FetchServiceChecks> {
  const mongodb = await (async (): Promise<ServiceCheckResult> => {
    if (!process.env.MONGODB_URI) {
      return { ok: false, message: 'MONGODB_URI is not set' };
    }
    try {
      await withTimeout(pingDb(), 10_000, 'MongoDB connection');
      return { ok: true, message: 'MongoDB is reachable' };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  })();

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const googlePlaces = await (async (): Promise<ServiceCheckResult> => {
    if (!apiKey) {
      return { ok: false, message: 'GOOGLE_MAPS_API_KEY is not set' };
    }
    try {
      const res = await fetchWithTimeout(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id',
          },
          body: JSON.stringify({ textQuery: 'mobile tire repair', pageSize: 1 }),
        },
        PLACES_SEARCH_TIMEOUT_MS,
      );
      if (res.status === 401 || res.status === 403) {
        const body = await res.text();
        return { ok: false, message: `Google Places API auth failed (${res.status}): ${body}` };
      }
      if (!res.ok && res.status >= 500) {
        return { ok: false, message: `Google Places API error (${res.status})` };
      }
      return { ok: true, message: 'Google Places API is reachable' };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  })();

  const s3Status = await checkS3Available();
  const s3: FetchServiceChecks['s3'] = {
    ok: s3Status.ok,
    configured: s3Status.configured,
    message: s3Status.message,
  };

  return { mongodb, googlePlaces, s3 };
}

export type FetchBusinessesOptions = {
  citySlugs?: string[];
  maxPages?: number;
  useCache?: boolean;
  dryRun?: boolean;
  /** When false, skip photo downloads/uploads (e.g. S3 unavailable). */
  photosEnabled?: boolean;
};

export type FetchBusinessesResult = {
  citiesProcessed: number;
  citiesSkipped: number;
  businessesFound: number;
  rejected: number;
  created: number;
  updated: number;
  photosAdded: number;
  apiCalls: number;
  cacheHits: number;
  cityResults: Array<{
    city: string;
    stateCode: string;
    count: number;
    rejected?: number;
    skipped?: boolean;
  }>;
};

function getCacheDir(): string {
  return path.join(os.tmpdir(), 'mobiltirerepair24-places-cache');
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
  const hours = mapGoogleOpeningHours(place.regularOpeningHours);
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
    baseRating: place.rating ?? 0,
    baseReviewCount: place.userRatingCount ?? 0,
    ...(place.websiteUri ? { website: place.websiteUri } : {}),
    ...(hours ? { hours } : {}),
    ...(place.location
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : {}),
  };
}

async function searchTextPage(
  apiKey: string,
  query: string,
  cacheKey: string,
  useCache: boolean,
  stats: { apiCalls: number; cacheHits: number },
  locationRestriction: LocationRectangle,
  pageToken?: string,
): Promise<SearchResponse> {
  const cacheDir = getCacheDir();
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (useCache && fs.existsSync(cacheFile)) {
    stats.cacheHits++;
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const res = await fetchWithTimeout(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        regionCode: 'US',
        locationRestriction: { rectangle: locationRestriction },
        ...(pageToken ? { pageToken } : {}),
      }),
    },
    PLACES_SEARCH_TIMEOUT_MS,
  );
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

/** Resolve a Places photo resource name to a short-lived image URI. */
async function fetchPlacePhotoUri(
  apiKey: string,
  photoName: string,
  stats: { apiCalls: number },
): Promise<string | null> {
  const params = new URLSearchParams({
    maxWidthPx: '1024',
    skipHttpRedirect: 'true',
    key: apiKey,
  });
  const res = await fetchWithTimeout(
    `https://places.googleapis.com/v1/${photoName}/media?${params}`,
    undefined,
    PLACES_PHOTO_TIMEOUT_MS,
  );
  stats.apiCalls++;

  if (!res.ok) {
    console.error(`Place photo ${res.status} for ${photoName}: ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as { photoUri?: string };
  return json.photoUri ?? null;
}

/**
 * Attach one Google Places photo to the business (re-hosted on S3) when the
 * listing has no photos yet. Skips silently if S3 is not configured.
 */
async function attachListingPhoto(
  apiKey: string,
  place: PlaceResult,
  business: Business,
  stats: { apiCalls: number },
  s3Available: boolean,
): Promise<boolean> {
  const photoName = place.photos?.[0]?.name;
  if (!photoName || !s3Available) return false;

  const photoUri = await fetchPlacePhotoUri(apiKey, photoName, stats);
  if (!photoUri) return false;

  try {
    const hosted = await reHostPhotosToS3([photoUri], business.slug);
    // Only keep durable S3 URLs — never persist short-lived Google photo URIs.
    const s3Photos = hosted.filter((url) => url.includes('.s3.amazonaws.com/'));
    if (!s3Photos.length) return false;
    business.photos = s3Photos;
    return true;
  } catch (err) {
    console.error(`Failed to host photo for ${business.slug}:`, err);
    return false;
  }
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
    photosEnabled = isS3Configured(),
  } = options;

  const pages = Math.min(Math.max(maxPages, 1), 3);
  console.log(`Loading ${citySlugs?.length ? 'selected' : 'all'} cities from MongoDB...`);
  const allCities = await withTimeout(getAllCities(), 15_000, 'Loading cities');
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

  // Prefer cities with no (or fewer) businesses so sparse coverage fills first.
  const businessCounts = await withTimeout(getBusinessCountsByCity(), 15_000, 'Loading business counts');
  targets.sort((a, b) => {
    const countA = businessCounts.get(`${a.slug}:${a.state}`) ?? 0;
    const countB = businessCounts.get(`${b.slug}:${b.state}`) ?? 0;
    if (countA !== countB) return countA - countB;
    // Stable-ish tiebreak: name then state
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.stateCode.localeCompare(b.stateCode);
  });

  if (!dryRun && !photosEnabled) {
    console.warn('Photos disabled — business listings will be saved without images');
  }

  console.log(`Scanning ${targets.length} cities...\n`);

  const stats = { apiCalls: 0, cacheHits: 0 };
  const seen = new Set<string>();
  const cityResults: FetchBusinessesResult['cityResults'] = [];
  let created = 0;
  let updated = 0;
  let photosAdded = 0;
  let businessesFound = 0;
  let rejected = 0;
  let citiesProcessed = 0;
  let citiesSkipped = 0;
  let citiesFailed = 0;

  for (const city of targets) {
    const existingCount = businessCounts.get(`${city.slug}:${city.state}`) ?? 0;
    let needsPhotoBackfill = false;
    if (existingCount >= MAX_BUSINESSES_PER_CITY) {
      const listed = await withTimeout(
        getBusinessesByCity(city.slug, city.state),
        10_000,
        `Loading businesses for ${city.name}`,
      );
      needsPhotoBackfill = listed.some((b) => !b.photos?.length);
      if (!needsPhotoBackfill) {
        citiesSkipped++;
        cityResults.push({
          city: city.name,
          stateCode: city.stateCode,
          count: 0,
          skipped: true,
        });
        continue;
      }
    }

    const needed = Math.max(0, MAX_BUSINESSES_PER_CITY - existingCount);
    const query = `mobile tire repair in ${city.name}, ${city.stateCode}`;
    const cityBounds = cityBoundingBox(city);
    const locationRestriction = cityBounds ?? US_WIDE_RECTANGLE;
    if (!cityBounds) {
      console.warn(
        `  ⚠ ${city.name}, ${city.stateCode} has no coordinates — using US-wide search bounds; fix in /admin/cities`,
      );
    }
    let pageToken: string | undefined;
    let cityCount = 0;
    let cityUpdated = 0;
    let cityPhotos = 0;
    let cityRejected = 0;
    citiesProcessed++;

    const taskLabel = needsPhotoBackfill
      ? 'photo backfill'
      : needed > 0
        ? `need ${needed} more`
        : 'fetch';
    process.stdout.write(`→ ${city.name}, ${city.stateCode} (${taskLabel})... `);

    let cityFailed = false;
    for (let page = 0; page < pages; page++) {
      // Cache key versioned so older unbounded / non-US-filtered responses are not reused.
      const cacheKey = `${city.slug}-${city.stateCode.toLowerCase()}-p${page + 1}-us-v2`;
      let data: SearchResponse;
      try {
        data = await searchTextPage(
          apiKey,
          query,
          cacheKey,
          useCache,
          stats,
          locationRestriction,
          pageToken,
        );
      } catch (err) {
        console.log(`failed`);
        console.warn(`  ⚠ Places search failed: ${(err as Error).message}`);
        cityFailed = true;
        citiesFailed++;
        break;
      }

      for (const place of data.places ?? []) {
        if (seen.has(place.id) || !isRelevant(place) || !place.displayName) continue;

        const locationCheck = validateUsPlace({
          lat: place.location?.latitude,
          lng: place.location?.longitude,
          address: place.formattedAddress,
          city,
        });
        if (!locationCheck.ok) {
          rejected++;
          cityRejected++;
          const label = place.displayName.text;
          const addr = place.formattedAddress ?? 'no address';
          console.warn(`  ⚠ skipped ${label} — ${locationCheck.reason} (${addr})`);
          continue;
        }
        if (locationCheck.warning) {
          console.warn(`  ℹ ${place.displayName.text} — ${locationCheck.warning}`);
        }

        const business = toBusiness(place, city);
        const existingPhotos = await withTimeout(
          getBusinessPhotos(business.slug),
          10_000,
          `Loading photos for ${business.slug}`,
        );
        const alreadyExists = existingPhotos !== undefined;

        if (alreadyExists) {
          seen.add(place.id);
          if (!dryRun) {
            const needsPhoto = existingPhotos.length === 0;
            if (needsPhoto && (await attachListingPhoto(apiKey, place, business, stats, photosEnabled))) {
              photosAdded++;
              cityPhotos++;
            }
            // Refresh the Google baseline, but re-blend it with any manually
            // submitted reviews rather than overwriting `rating`/`reviewCount`
            // outright — otherwise a re-fetch would silently erase them.
            const manualReviews = await getManualReviewAggregate(business.slug);
            const combined = combineRatingWithReviews(
              business.baseRating ?? 0,
              business.baseReviewCount ?? 0,
              manualReviews,
            );
            business.rating = combined.rating;
            business.reviewCount = combined.reviewCount;
            await upsertBusiness(business);
            updated++;
            cityUpdated++;
          }
          continue;
        }

        if (cityCount >= needed) continue;

        seen.add(place.id);
        businessesFound++;
        cityCount++;

        if (!dryRun) {
          await ensureBusinessLocation(business);
          if (await attachListingPhoto(apiKey, place, business, stats, photosEnabled)) {
            photosAdded++;
            cityPhotos++;
          }
          await upsertBusiness(business);
          created++;
        }
      }

      if (cityCount >= needed) break;

      pageToken = data.nextPageToken;
      if (!pageToken) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (cityFailed) {
      cityResults.push({ city: city.name, stateCode: city.stateCode, count: 0, rejected: cityRejected });
      continue;
    }

    const parts = [`${cityCount} new`];
    if (cityUpdated > 0) parts.push(`${cityUpdated} updated`);
    if (cityPhotos > 0) parts.push(`${cityPhotos} photos`);
    if (cityRejected > 0) parts.push(`${cityRejected} rejected`);
    console.log(`done (${parts.join(', ')})`);

    cityResults.push({
      city: city.name,
      stateCode: city.stateCode,
      count: cityCount,
      rejected: cityRejected,
    });
  }

  if (citiesFailed > 0) {
    console.warn(`\n⚠ ${citiesFailed} cit${citiesFailed === 1 ? 'y' : 'ies'} failed due to Places API errors`);
  }

  return {
    citiesProcessed,
    citiesSkipped,
    businessesFound,
    rejected,
    created,
    updated,
    photosAdded,
    apiCalls: stats.apiCalls,
    cacheHits: stats.cacheHits,
    cityResults,
  };
}
