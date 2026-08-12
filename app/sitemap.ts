import type { MetadataRoute } from 'next';
import {
  getAllStates,
  getAllCities,
  getAllBusinesses,
  getAllServices,
  isCityIndexable,
  isServiceCityIndexable,
} from '@/lib/data';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';

export const revalidate = 3600; // re-render at most hourly; admin edits go live without redeploys

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [states, cities, businesses, services] = await Promise.all([
    getAllStates(),
    getAllCities(),
    getAllBusinesses(),
    getAllServices(),
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

  for (const city of cities) {
    for (const service of services) {
      if (!(await isServiceCityIndexable(service.slug, city.slug, city.state))) continue;
      urls.push({
        url: `${SITE_URL}/${city.state}/${city.slug}/${service.slug}/`,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
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
