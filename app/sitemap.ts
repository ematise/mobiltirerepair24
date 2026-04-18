import type { MetadataRoute } from 'next';
import {
  getAllStates,
  getAllCities,
  getAllBusinesses,
  isCityIndexable,
} from '@/lib/data';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [states, cities, businesses] = await Promise.all([
    getAllStates(),
    getAllCities(),
    getAllBusinesses(),
  ]);

  const urls: MetadataRoute.Sitemap = [];

  urls.push({ url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 });

  for (const state of states) {
    urls.push({ url: `${SITE_URL}/${state.slug}/`, changeFrequency: 'weekly', priority: 0.8 });
  }

  for (const city of cities) {
    if (!(await isCityIndexable(city.slug, city.state))) continue;
    urls.push({
      url: `${SITE_URL}/${city.state}/${city.slug}/`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const biz of businesses) {
    urls.push({
      url: `${SITE_URL}/business/${biz.slug}/`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return urls;
}
