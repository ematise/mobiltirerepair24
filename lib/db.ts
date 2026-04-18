import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const DB_NAME = 'mobiltirerepair24';

if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

// Singleton pattern for Next.js — reuse connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

export async function getDb(): Promise<Db> {
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
