/**
 * fetch-businesses.ts — pulls mobile tire repair businesses from Google Places
 * and upserts them directly into MongoDB.
 *
 * Cities are read from the database (manage them in /admin/cities).
 * Empty cities are fetched first; each city is capped at 3 businesses.
 * Cities that already have 3+ are skipped to save Google API quota.
 * API responses are cached in the OS temp dir to avoid re-billing on re-runs.
 *
 * Usage:
 *   npm run fetch:businesses
 *   npx tsx scripts/fetch-businesses.ts --cities dallas,houston
 *   npx tsx scripts/fetch-businesses.ts --pages 2
 *   npx tsx scripts/fetch-businesses.ts --dry-run
 *   npx tsx scripts/fetch-businesses.ts --no-cache
 */
import dotenv from 'dotenv';
import { fetchBusinessesFromPlaces, checkFetchServices } from '../lib/places-fetch';
import { ensureDbIndexes } from '../lib/db';
import { withTimeout } from '../lib/fetch-with-timeout';

dotenv.config({ path: ['.env.local', '.env'] });

function statusLine(ok: boolean, message: string): string {
  return `  ${ok ? '✓' : '✗'} ${message}`;
}

async function main() {
  const args = process.argv.slice(2);
  const getFlag = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const citySlugs = getFlag('cities')?.split(',').map((s) => s.trim()).filter(Boolean);
  const maxPages = Number(getFlag('pages') ?? 1);
  const useCache = !args.includes('--no-cache');
  const dryRun = args.includes('--dry-run');

  console.log('Checking services...\n');
  const services = await checkFetchServices();
  console.log(statusLine(services.mongodb.ok, services.mongodb.message));
  console.log(statusLine(services.googlePlaces.ok, services.googlePlaces.message));
  console.log(statusLine(services.s3.ok, services.s3.message));

  if (!services.mongodb.ok) {
    console.error('\nMongoDB is required. Fix MONGODB_URI or network access, then retry.');
    process.exit(1);
  }

  if (!services.googlePlaces.ok) {
    console.error('\nGoogle Places API is required. Fix GOOGLE_MAPS_API_KEY, then retry.');
    process.exit(1);
  }

  if (!services.s3.ok) {
    console.warn('\n⚠ S3 is unavailable — fetch will continue but skip business photos.');
  }

  await withTimeout(ensureDbIndexes(), 15_000, 'Ensuring database indexes');

  console.log(
    dryRun
      ? '\nDry run — fetching without writing to database...\n'
      : '\nFetching businesses and upserting into MongoDB...\n',
  );

  const result = await fetchBusinessesFromPlaces({
    citySlugs,
    maxPages,
    useCache,
    dryRun,
    photosEnabled: services.s3.ok,
  });

  console.log(`\nCities processed: ${result.citiesProcessed}`);
  if (result.citiesSkipped > 0) {
    console.log(`Cities skipped (already have 3+): ${result.citiesSkipped}`);
  }
  console.log(`Businesses found: ${result.businessesFound}`);
  if (result.rejected > 0) {
    console.log(`Rejected (outside US / too far): ${result.rejected}`);
  }
  if (!dryRun) {
    console.log(
      `Created: ${result.created} · Updated: ${result.updated} · Photos added: ${result.photosAdded}`,
    );
  }
  console.log(`API calls: ${result.apiCalls} · cache hits: ${result.cacheHits}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
