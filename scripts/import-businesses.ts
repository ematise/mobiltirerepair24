/**
 * Import businesses from JSON files into MongoDB via upsert (non-destructive).
 * Existing records with the same slug are updated; others are inserted.
 *
 * Usage:
 *   npm run import:businesses
 *   npm run import:businesses -- --file businesses.fetched.json
 *   npm run import:businesses -- --all
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { ensureDbIndexes } from '../lib/db';
import { ensureBusinessLocation, upsertBusiness, type Business } from '../lib/data';

dotenv.config({ path: ['.env.local', '.env'] });

const DATA_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_FILES = ['businesses.json', 'businesses.fetched.json'];

async function importFile(file: string): Promise<{ created: number; updated: number; total: number }> {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`${file} not found in data/`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Business[];
  if (!Array.isArray(raw)) {
    throw new Error(`${file} must contain a JSON array`);
  }

  let created = 0;
  let updated = 0;

  for (const business of raw) {
    if (!business.slug || !business.name) {
      console.warn(`  — skipping record without slug/name in ${file}`);
      continue;
    }
    await ensureBusinessLocation(business);
    const result = await upsertBusiness(business);
    if (result.created) created++;
    else updated++;
  }

  return { created, updated, total: raw.length };
}

async function main() {
  const args = process.argv.slice(2);
  const importAll = args.includes('--all');
  const fileFlag = args.indexOf('--file');
  const files = importAll
    ? DEFAULT_FILES
    : fileFlag >= 0
      ? [args[fileFlag + 1]]
      : DEFAULT_FILES;

  if (!files.every(Boolean)) {
    throw new Error('Usage: npm run import:businesses [-- --file businesses.fetched.json | --all]');
  }

  await ensureDbIndexes();

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const file of files) {
    console.log(`\nImporting ${file}...`);
    const { created, updated, total } = await importFile(file);
    console.log(`✓ ${file}: ${total} records (${created} created, ${updated} updated)`);
    totalCreated += created;
    totalUpdated += updated;
  }

  console.log(`\n✅ Done. ${totalCreated} created, ${totalUpdated} updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
