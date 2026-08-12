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
import { fetchBusinessesFromPlaces } from '../lib/places-fetch';
import { ensureDbIndexes } from '../lib/db';

dotenv.config({ path: ['.env.local', '.env'] });

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

  await ensureDbIndexes();

  console.log(
    dryRun
      ? 'Dry run — fetching without writing to database...\n'
      : 'Fetching businesses and upserting into MongoDB...\n',
  );

  const result = await fetchBusinessesFromPlaces({
    citySlugs,
    maxPages,
    useCache,
    dryRun,
  });

  for (const row of result.cityResults) {
    if (row.skipped) continue;
    console.log(`  ✓ ${row.city}, ${row.stateCode}: ${row.count} businesses`);
  }

  console.log(`\nCities processed: ${result.citiesProcessed}`);
  if (result.citiesSkipped > 0) {
    console.log(`Cities skipped (already have 3+): ${result.citiesSkipped}`);
  }
  console.log(`Businesses found: ${result.businessesFound}`);
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
