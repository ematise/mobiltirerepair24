import { MongoClient, type Db } from 'mongodb';
import { resolveMongoUri } from './mongodb-uri';

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
  // eslint-disable-next-line no-var
  var _mongoResolvedUri: string | undefined;
}

let client: MongoClient | null = null;
let resolvedUriPromise: Promise<string> | null = null;

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
} as const;

function getResolvedUri(): Promise<string> {
  if (!resolvedUriPromise) {
    resolvedUriPromise = (async () => {
      if (process.env.NODE_ENV === 'development' && global._mongoResolvedUri) {
        return global._mongoResolvedUri;
      }
      const resolved = await resolveMongoUri(getMongoUri());
      if (process.env.NODE_ENV === 'development') {
        global._mongoResolvedUri = resolved;
      }
      return resolved;
    })();
  }
  return resolvedUriPromise;
}

function createMongoClient(uri: string): MongoClient {
  return new MongoClient(uri, MONGO_OPTIONS);
}

export async function getDb(): Promise<Db> {
  const uri = await getResolvedUri();

  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClient) {
        global._mongoClient = createMongoClient(uri);
      }
      client = global._mongoClient;
    } else {
      client = createMongoClient(uri);
    }
  }

  await client.connect();
  return client.db(DB_NAME);
}

/** Verify MongoDB is reachable (used by fetch script preflight). */
export async function pingDb(): Promise<void> {
  const db = await getDb();
  await db.command({ ping: 1 });
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
