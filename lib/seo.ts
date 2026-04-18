import type { Metadata } from 'next';
import type { Business, City, Service, State } from './data';
import { fillTemplate } from './data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';
const SITE_NAME = 'MobileTireRepair24';

export function cityMetadata(city: City, state: State): Metadata {
  const title = `Mobile Tire Repair in ${city.name}, ${state.code} | ${SITE_NAME}`;
  const description = `Find top-rated mobile tire repair services in ${city.name}, ${state.code}. Fast on-site service — technicians come to you wherever you are.`;
  const url = `${SITE_URL}/${state.slug}/${city.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
  };
}

export function serviceCityMetadata(
  service: Service,
  city: City,
  state: State
): Metadata {
  const title = fillTemplate(service.metaTitleTemplate, city, state);
  const description = fillTemplate(service.metaDescTemplate, city, state);
  const url = `${SITE_URL}/${state.slug}/${city.slug}/${service.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
  };
}

export function businessMetadata(
  biz: Business,
  city: City,
  state: State
): Metadata {
  const title = `${biz.name} | ${city.name}, ${state.code} Mobile Tire Repair`;
  const description = `${biz.name} offers mobile tire repair in ${city.name}, ${state.code}. Call ${biz.phoneDisplay} for fast on-site service.`;
  const url = `${SITE_URL}/business/${biz.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
  };
}

export function stateMetadata(state: State): Metadata {
  const title = `Mobile Tire Repair in ${state.name} | ${SITE_NAME}`;
  const description = `Find mobile tire repair services across ${state.name}. Browse cities and local providers near you.`;
  const url = `${SITE_URL}/${state.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
  };
}

export function noindexMetadata(): Metadata {
  return { robots: { index: false, follow: true } };
}
