import { getCitiesBySlugs, getCityBySlug, getCitiesByState, type City } from './data';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
