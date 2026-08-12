/**
 * Repair misencoded 24/7 hours from an earlier Google Places import bug.
 *
 * Google encodes always-open as a single period with open Sunday 00:00 and no
 * close. The old mapper stored that as Sunday-only 00:00–23:59 and Closed
 * Mon–Sat. This script rewrites those records to Open 24 hours every day.
 *
 * Usage:
 *   npx tsx scripts/fix-hours.ts --file businesses.fetched.json
 *   npx tsx scripts/fix-hours.ts --file businesses.fetched.json --dry-run
 *   npx tsx scripts/fix-hours.ts --db
 *   npx tsx scripts/fix-hours.ts --db --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  fixMisencodedHours,
  type BusinessHours,
} from '../lib/hours';
import { getAllBusinesses, updateBusiness, type Business } from '../lib/data';

dotenv.config({ path: ['.env.local', '.env'] });

const DATA_DIR = path.join(__dirname, '..', 'data');

function fixBusinessHours(business: Business): { business: Business; changed: boolean } {
  const fixed = fixMisencodedHours(business.hours as BusinessHours | undefined);
  const changed = JSON.stringify(fixed) !== JSON.stringify(business.hours);
  return {
    business: changed ? { ...business, hours: fixed } : business,
    changed,
  };
}

async function fixFile(file: string, dryRun: boolean): Promise<number> {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`${file} not found in data/`);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Business[];
  if (!Array.isArray(raw)) {
    throw new Error(`${file} must contain a JSON array`);
  }

  let fixedCount = 0;
  const next = raw.map((business) => {
    const { business: updated, changed } = fixBusinessHours(business);
    if (changed) fixedCount++;
    return updated;
  });

  console.log(`${file}: ${fixedCount} / ${raw.length} records need hours repair`);
  if (!dryRun && fixedCount > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`✓ wrote ${file}`);
  }
  return fixedCount;
}

async function fixDb(dryRun: boolean): Promise<number> {
  const businesses = await getAllBusinesses();
  let fixedCount = 0;

  for (const business of businesses) {
    const { business: updated, changed } = fixBusinessHours(business);
    if (!changed) continue;
    fixedCount++;
    if (!dryRun) {
      await updateBusiness(business.slug, { hours: updated.hours });
    }
  }

  console.log(`db: ${fixedCount} / ${businesses.length} records need hours repair`);
  if (!dryRun && fixedCount > 0) {
    console.log(`✓ updated ${fixedCount} MongoDB records`);
  }
  return fixedCount;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const useDb = args.includes('--db');
  const fileFlag = args.indexOf('--file');
  const file = fileFlag >= 0 ? args[fileFlag + 1] : undefined;

  if (!useDb && !file) {
    throw new Error(
      'Usage: npx tsx scripts/fix-hours.ts (--file businesses.fetched.json | --db) [--dry-run]',
    );
  }

  if (file) await fixFile(file, dryRun);
  if (useDb) await fixDb(dryRun);

  if (dryRun) console.log('(dry run — no changes written)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
