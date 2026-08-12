import { MongoClient, type Db } from 'mongodb';

const DB_NAME = 'mobiltirerepair24';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  return uri;
}

// Singleton pattern for Next.js — reuse connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  const uri = getMongoUri();

  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClient) {
        global._mongoClient = new MongoClient(uri);
      }
      client = global._mongoClient;
    } else {
      client = new MongoClient(uri);
    }
  }

  await client.connect();
  return client.db(DB_NAME);
}

export const COLLECTIONS = {
  businesses: 'businesses',
  cities: 'cities',
  states: 'states',
  services: 'services',
  reviews: 'reviews',
} as const;

/** Ensure MongoDB indexes exist. Safe to call on every seed/fetch. */
export async function ensureDbIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTIONS.businesses).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTIONS.businesses).createIndex({ city: 1, state: 1 });
  await db.collection(COLLECTIONS.cities).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTIONS.cities).createIndex({ state: 1 });
  await db.collection(COLLECTIONS.states).createIndex({ slug: 1 }, { unique: true });
  await db.collection(COLLECTIONS.services).createIndex({ slug: 1 }, { unique: true });
}
