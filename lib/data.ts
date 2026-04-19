import { getDb, COLLECTIONS } from './db';

export type Business = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  phoneDisplay: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  services: string[];
  areasServed: string[];
  description: string;
  rating: number;
  reviewCount: number;
  // Extended fields for comprehensive listing
  photos?: string[];
  hours?: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  pricing?: Array<{
    service: string;
    minPrice: number;
    maxPrice: number;
    note?: string;
  }>;
  certifications?: string[];
  vehicleTypes?: string[];
  responseTime?: string;
  serviceRadius?: string;
  website?: string;
  email?: string;
  zipCode?: string;
  acceptedPayment?: string[];
};

export type City = {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  intro: string;
  nearbyCities: string[];
};

export type Service = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  h1Template: string;
  metaTitleTemplate: string;
  metaDescTemplate: string;
  faqs: { q: string; a: string }[];
};

export type State = {
  slug: string;
  name: string;
  code: string;
  intro: string;
  cities: string[];
};

// Strip MongoDB _id from results
function clean<T>(doc: T & { _id?: unknown }): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc as Record<string, unknown>;
  void _id;
  return rest as T;
}

function cleanAll<T>(docs: (T & { _id?: unknown })[]): T[] {
  return docs.map(clean);
}

// ── Businesses ───────────────────────────────────────────────────────────────

export async function getAllBusinesses(): Promise<Business[]> {
  const db = await getDb();
  const docs = await db.collection(COLLECTIONS.businesses).find({}).toArray();
  return cleanAll<Business>(docs as never);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.businesses).findOne({ slug });
  return doc ? clean<Business>(doc as never) : null;
}

export async function getBusinessesByCity(
  citySlug: string,
  stateSlug: string
): Promise<Business[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.businesses)
    .find({ city: citySlug, state: stateSlug })
    .toArray();
  return cleanAll<Business>(docs as never);
}

export async function createBusiness(business: Business): Promise<Business> {
  const db = await getDb();
  await db.collection(COLLECTIONS.businesses).insertOne(business as never);
  return business;
}

export async function updateBusiness(slug: string, updates: Partial<Business>): Promise<Business | null> {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.businesses)
    .findOneAndUpdate({ slug }, { $set: updates }, { returnDocument: 'after' });
  return result ? clean<Business>(result as never) : null;
}

export async function deleteBusiness(slug: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.businesses).deleteOne({ slug });
  return result.deletedCount > 0;
}

export async function ensureBusinessLocation(business: Business): Promise<void> {
  const db = await getDb();

  function titleCase(slug: string) {
    return slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  const existingState = await getStateBySlug(business.state);
  if (!existingState) {
    const stateName = titleCase(business.state);
    await db.collection(COLLECTIONS.states).insertOne({
      slug: business.state,
      name: stateName,
      code: business.stateCode,
      intro: `Find mobile tire repair services across ${stateName}.`,
      cities: [business.city],
    });
  } else if (!existingState.cities.includes(business.city)) {
    await db.collection(COLLECTIONS.states).updateOne(
      { slug: business.state },
      { $addToSet: { cities: business.city } }
    );
  }

  const existingCity = await getCityBySlug(business.city);
  if (!existingCity) {
    const cityName = titleCase(business.city);
    await db.collection(COLLECTIONS.cities).insertOne({
      slug: business.city,
      name: cityName,
      state: business.state,
      stateCode: business.stateCode,
      lat: 0,
      lng: 0,
      intro: `Find mobile tire repair services in ${cityName}, ${business.stateCode}.`,
      nearbyCities: [],
    });
  }
}

// ── Cities ───────────────────────────────────────────────────────────────────

export async function getAllCities(): Promise<City[]> {
  const db = await getDb();
  const docs = await db.collection(COLLECTIONS.cities).find({}).toArray();
  return cleanAll<City>(docs as never);
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.cities).findOne({ slug });
  return doc ? clean<City>(doc as never) : null;
}

export async function getCitiesByState(stateSlug: string): Promise<City[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.cities)
    .find({ state: stateSlug })
    .toArray();
  return cleanAll<City>(docs as never);
}

export async function getCitiesBySlugs(slugs: string[]): Promise<City[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.cities)
    .find({ slug: { $in: slugs } })
    .toArray();
  // Preserve order of slugs
  const map = new Map(docs.map((d) => [d.slug, d]));
  return slugs
    .map((s) => map.get(s))
    .filter(Boolean)
    .map((d) => clean<City>(d as never));
}

export async function createCity(city: City): Promise<City> {
  const db = await getDb();
  await db.collection(COLLECTIONS.cities).insertOne(city as never);
  return city;
}

export async function updateCity(slug: string, updates: Partial<City>): Promise<City | null> {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.cities)
    .findOneAndUpdate({ slug }, { $set: updates }, { returnDocument: 'after' });
  return result ? clean<City>(result as never) : null;
}

export async function deleteCity(slug: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.cities).deleteOne({ slug });
  return result.deletedCount > 0;
}

// ── Services ─────────────────────────────────────────────────────────────────

export async function getAllServices(): Promise<Service[]> {
  const db = await getDb();
  const docs = await db.collection(COLLECTIONS.services).find({}).toArray();
  return cleanAll<Service>(docs as never);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.services).findOne({ slug });
  return doc ? clean<Service>(doc as never) : null;
}

// ── States ───────────────────────────────────────────────────────────────────

export async function getAllStates(): Promise<State[]> {
  const db = await getDb();
  const docs = await db.collection(COLLECTIONS.states).find({}).toArray();
  return cleanAll<State>(docs as never);
}

export async function getStateBySlug(slug: string): Promise<State | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTIONS.states).findOne({ slug });
  return doc ? clean<State>(doc as never) : null;
}

export async function createState(state: State): Promise<State> {
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.states).insertOne(state as never);
  return { ...state };
}

export async function updateState(slug: string, updates: Partial<State>): Promise<State | null> {
  const db = await getDb();
  const result = await db
    .collection(COLLECTIONS.states)
    .findOneAndUpdate({ slug }, { $set: updates }, { returnDocument: 'after' });
  return result ? clean<State>(result as never) : null;
}

export async function deleteState(slug: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.states).deleteOne({ slug });
  return result.deletedCount > 0;
}

// ── Indexation gates ─────────────────────────────────────────────────────────

export async function isCityIndexable(
  citySlug: string,
  stateSlug: string
): Promise<boolean> {
  const db = await getDb();
  const count = await db
    .collection(COLLECTIONS.businesses)
    .countDocuments({ city: citySlug, state: stateSlug });
  return count >= 1;
}

// ── Template interpolation ───────────────────────────────────────────────────

export function fillTemplate(
  template: string,
  city: City,
  state: State
): string {
  return template
    .replace(/{city}/g, city.name)
    .replace(/{stateCode}/g, state.code)
    .replace(/{state}/g, state.name);
}
