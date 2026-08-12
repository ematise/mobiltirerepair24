import { getCitiesBySlugs, getCityBySlug, getCitiesByState, type City } from './data';
import { haversineKm } from './geo';

export async function getNearbyCities(
  citySlug: string,
  maxDistanceKm = 130,
  limit = 6
): Promise<City[]> {
  const origin = await getCityBySlug(citySlug);
  if (!origin) return [];

  // Use explicit nearbyCities list first
  if (origin.nearbyCities?.length >= 3) {
    const cities = await getCitiesBySlugs(origin.nearbyCities.slice(0, limit));
    return cities;
  }

  // Fall back to distance-based from same state
  const all = await getCitiesByState(origin.state);
  return all
    .filter((c) => c.slug !== citySlug)
    .map((c) => ({ ...c, _dist: haversineKm(origin.lat, origin.lng, c.lat, c.lng) }))
    .filter((c) => c._dist <= maxDistanceKm)
    .sort((a, b) => a._dist - b._dist)
    .slice(0, limit);
}
