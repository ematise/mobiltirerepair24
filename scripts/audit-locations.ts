/**
 * audit-locations.ts — find listings outside the US or too far from their city.
 *
 * Uses the same rules as the Google Places importer (lib/us-location.ts).
 * Dry run by default; pass --delete to remove offenders from MongoDB.
 *
 * Usage:
 *   npm run audit:locations
 *   npx tsx scripts/audit-locations.ts --delete
 */
import dotenv from 'dotenv';
import {
  getAllBusinesses,
  getCityBySlug,
  deleteBusiness,
  type Business,
} from '../lib/data';
import {
  validateLegacyListingWithoutCoords,
  validateUsPlace,
} from '../lib/us-location';

dotenv.config({ path: ['.env.local', '.env'] });

type AuditIssue = {
  slug: string;
  name: string;
  address: string;
  city: string;
  stateCode: string;
  reason: string;
  category: 'invalid' | 'needs-review';
};

function auditBusiness(business: Business, city: Awaited<ReturnType<typeof getCityBySlug>>): AuditIssue | null {
  if (!city) {
    return {
      slug: business.slug,
      name: business.name,
      address: business.address,
      city: business.city,
      stateCode: business.stateCode,
      reason: `city slug "${business.city}" not found in database`,
      category: 'needs-review',
    };
  }

  const targetCity = {
    name: city.name,
    slug: city.slug,
    stateCode: city.stateCode,
    lat: city.lat,
    lng: city.lng,
  };

  if (business.lat !== undefined && business.lng !== undefined) {
    const result = validateUsPlace({
      lat: business.lat,
      lng: business.lng,
      address: business.address,
      city: targetCity,
    });
    if (!result.ok) {
      return {
        slug: business.slug,
        name: business.name,
        address: business.address,
        city: city.name,
        stateCode: city.stateCode,
        reason: result.reason,
        category: 'invalid',
      };
    }
    return null;
  }

  const legacy = validateLegacyListingWithoutCoords({
    address: business.address,
    city: targetCity,
  });
  if (!legacy.ok) {
    return {
      slug: business.slug,
      name: business.name,
      address: business.address,
      city: city.name,
      stateCode: city.stateCode,
      reason: legacy.reason,
      category: 'invalid',
    };
  }

  return null;
}

function printIssues(title: string, issues: AuditIssue[]): void {
  if (!issues.length) return;
  console.log(`\n${title} (${issues.length})`);
  console.log('─'.repeat(60));
  for (const issue of issues) {
    console.log(`  ${issue.name}`);
    console.log(`    slug: ${issue.slug}`);
    console.log(`    city: ${issue.city}, ${issue.stateCode}`);
    console.log(`    address: ${issue.address}`);
    console.log(`    reason: ${issue.reason}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');

  const businesses = await getAllBusinesses();
  console.log(`Auditing ${businesses.length} listings...`);

  const invalid: AuditIssue[] = [];
  const needsReview: AuditIssue[] = [];

  for (const business of businesses) {
    const city = await getCityBySlug(business.city);
    const issue = auditBusiness(business, city);
    if (!issue) continue;
    if (issue.category === 'invalid') invalid.push(issue);
    else needsReview.push(issue);
  }

  printIssues('Invalid (would delete with --delete)', invalid);
  printIssues('Needs manual review', needsReview);

  if (!invalid.length && !needsReview.length) {
    console.log('\n✓ All listings passed US location checks.');
    return;
  }

  console.log(`\nSummary: ${invalid.length} invalid · ${needsReview.length} need manual review`);

  if (!shouldDelete) {
    console.log('\n(dry run — no changes written; pass --delete to remove invalid listings)');
    return;
  }

  if (!invalid.length) {
    console.log('\nNothing to delete in the invalid set.');
    return;
  }

  let deleted = 0;
  for (const issue of invalid) {
    const ok = await deleteBusiness(issue.slug);
    if (ok) {
      deleted++;
      console.log(`  ✓ deleted ${issue.slug}`);
    } else {
      console.warn(`  ✗ failed to delete ${issue.slug}`);
    }
  }

  console.log(`\n✓ deleted ${deleted} listing(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
