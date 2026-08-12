import fs from 'node:fs';
import path from 'node:path';
import { getDb, COLLECTIONS } from './db';

export type GeographySeedResult = {
  states: number;
  cities: number;
};

function loadDocs(fileName: 'states.json' | 'cities.json'): Array<{ slug: string }> {
  const filePath = path.join(process.cwd(), 'data', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing data file: ${fileName}`);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const docs = (Array.isArray(raw) ? raw : Object.values(raw)) as Array<{ slug: string }>;
  return docs.filter((doc) => Boolean(doc?.slug));
}

/**
 * Upsert states and cities from data/*.json without touching businesses.
 */
export async function upsertGeographyFromJson(): Promise<GeographySeedResult> {
  const db = await getDb();
  const result: GeographySeedResult = { states: 0, cities: 0 };

  const states = loadDocs('states.json');
  const stateCol = db.collection(COLLECTIONS.states);
  for (const doc of states) {
    await stateCol.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true });
    result.states += 1;
  }

  const cities = loadDocs('cities.json');
  const cityCol = db.collection(COLLECTIONS.cities);
  for (const doc of cities) {
    await cityCol.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true });
    result.cities += 1;
  }

  return result;
}
