/**
 * Seed script — ensures MongoDB has indexes and default service catalog.
 * All runtime data lives in MongoDB; manage states, cities, and businesses via /admin.
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * One-time migration from legacy JSON files (optional):
 *   npx tsx scripts/seed.ts --import-json
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { MongoClient, type Db } from 'mongodb';
import { ensureDbIndexes, COLLECTIONS } from '../lib/db';
import { DEFAULT_SERVICES } from '../lib/default-services';

dotenv.config({ path: ['.env.local', '.env'] });

const uri = process.env.MONGODB_URI!;
const DB_NAME = 'mobiltirerepair24';
const DATA_DIR = path.join(__dirname, '..', 'data');

async function seedServices(db: Db) {
  const svcCol = db.collection(COLLECTIONS.services);
  const count = await svcCol.countDocuments();

  if (count === 0) {
    await svcCol.insertMany(DEFAULT_SERVICES);
    console.log(`✓ Seeded ${DEFAULT_SERVICES.length} services`);
  } else {
    console.log(`✓ Services collection already has ${count} records — skipped`);
  }
}

async function importFromJson(db: Db) {
  const files = ['businesses.json', 'cities.json', 'states.json'] as const;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  — ${file} not found, skipping`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const collection = file.replace('.json', '') as keyof typeof COLLECTIONS;
    const colName = COLLECTIONS[collection as 'businesses' | 'cities' | 'states'];
    const docs = Array.isArray(raw) ? raw : Object.values(raw);

    const col = db.collection(colName);
    await col.deleteMany({});
    if (docs.length) await col.insertMany(docs);
    console.log(`✓ Imported ${docs.length} ${colName} from ${file}`);
  }
}

async function seed() {
  if (!uri) throw new Error('MONGODB_URI not set — add it to .env.local');

  const importJson = process.argv.includes('--import-json');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DB_NAME);
    await ensureDbIndexes();
    console.log('✓ Indexes ensured');

    await seedServices(db);

    if (importJson) {
      console.log('\nImporting legacy JSON files (one-time migration)...');
      await importFromJson(db);
    }

    console.log('\n✅ Seed complete.');
    console.log('Manage states, cities, and businesses at /admin');
    console.log('Fetch businesses: npm run fetch:businesses');
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
