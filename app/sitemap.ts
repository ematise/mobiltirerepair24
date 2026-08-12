import type { MetadataRoute } from 'next';
import {
  getAllStates,
  getAllCities,
  getAllBusinessSlugs,
  getAllServices,
  getIndexableCityKeys,
  getIndexableServiceCityKeys,
  cityIndexKey,
  serviceCityIndexKey,
} from '@/lib/data';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';

// Always build from live MongoDB — avoids stale ISR/build snapshots on Vercel.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [states, cities, businessSlugs, services, indexableCities, indexableServiceCities] =
    await Promise.all([
      getAllStates(),
      getAllCities(),
      getAllBusinessSlugs(),
      getAllServices(),
      getIndexableCityKeys(),
      getIndexableServiceCityKeys(),
    ]);

  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
  ];

  for (const state of states) {
    urls.push({ url: `${SITE_URL}/${state.slug}/`, changeFrequency: 'weekly', priority: 0.8 });
  }

  for (const city of cities) {
    if (!indexableCities.has(cityIndexKey(city.slug, city.state))) continue;
    urls.push({
      url: `${SITE_URL}/${city.state}/${city.slug}/`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const city of cities) {
    for (const service of services) {
      if (
        !indexableServiceCities.has(
          serviceCityIndexKey(service.slug, city.slug, city.state)
        )
      ) {
        continue;
      }
      urls.push({
        url: `${SITE_URL}/${city.state}/${city.slug}/${service.slug}/`,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  for (const slug of businessSlugs) {
    urls.push({
      url: `${SITE_URL}/business/${slug}/`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return urls;
}
