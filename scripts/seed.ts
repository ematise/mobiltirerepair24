/**
 * Seed script — migrates JSON data files to MongoDB Atlas
 * Run with: npx tsx scripts/seed.ts
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import businesses from '../data/businesses.json';
import cities from '../data/cities.json';
import services from '../data/services.json';
import states from '../data/states.json';

const uri = process.env.MONGODB_URI!;
const DB_NAME = 'mobiltirerepair24';

async function seed() {
  if (!uri) throw new Error('MONGODB_URI not set — add it to .env.local');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db(DB_NAME);

    // ── Businesses ────────────────────────────────────────────────
    const bizCol = db.collection('businesses');
    await bizCol.dropIndexes().catch(() => {});
    await bizCol.deleteMany({});
    await bizCol.insertMany(businesses);
    await bizCol.createIndex({ slug: 1 }, { unique: true });
    await bizCol.createIndex({ city: 1, state: 1 });
    console.log(`✓ Inserted ${businesses.length} businesses`);

    // ── Cities ────────────────────────────────────────────────────
    const cityCol = db.collection('cities');
    await cityCol.dropIndexes().catch(() => {});
    await cityCol.deleteMany({});
    const cityDocs = Object.values(cities);
    await cityCol.insertMany(cityDocs);
    await cityCol.createIndex({ slug: 1 }, { unique: true });
    await cityCol.createIndex({ state: 1 });
    console.log(`✓ Inserted ${cityDocs.length} cities`);

    // ── States ────────────────────────────────────────────────────
    const stateCol = db.collection('states');
    await stateCol.dropIndexes().catch(() => {});
    await stateCol.deleteMany({});
    const stateDocs = Object.values(states);
    await stateCol.insertMany(stateDocs);
    await stateCol.createIndex({ slug: 1 }, { unique: true });
    console.log(`✓ Inserted ${stateDocs.length} states`);

    // ── Services ──────────────────────────────────────────────────
    const svcCol = db.collection('services');
    await svcCol.dropIndexes().catch(() => {});
    await svcCol.deleteMany({});
    const svcDocs = Object.values(services);
    await svcCol.insertMany(svcDocs);
    await svcCol.createIndex({ slug: 1 }, { unique: true });
    console.log(`✓ Inserted ${svcDocs.length} services`);

    console.log('\n✅ Seed complete.');
    console.log('\nNext step — create Atlas Search indexes in the Atlas UI:');
    console.log('  Collection: businesses  → see scripts/atlas-search-index.json');
    console.log('  Collection: cities      → see scripts/atlas-search-index.json');
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
