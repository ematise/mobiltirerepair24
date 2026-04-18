import type { Business, City, Service, State } from './data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';

export function buildLocalBusinessSchema(biz: Business) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.name,
    telephone: biz.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: biz.city
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      addressRegion: biz.stateCode,
      addressCountry: 'US',
    },
    areaServed: biz.areasServed.map((area) => ({
      '@type': 'City',
      name: area,
    })),
    description: biz.description,
    ...(biz.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(biz.rating),
        reviewCount: String(biz.reviewCount),
        bestRating: '5',
      },
    }),
    url: `${SITE_URL}/business/${biz.slug}/`,
  };
}

type BreadcrumbItem = { name: string; url: string };

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function buildItemListSchema(urls: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: urls.map((url, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${url}`,
    })),
  };
}

export function buildFAQSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export function cityBreadcrumbs(city: City, state: State): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: state.name, url: `/${state.slug}/` },
    { name: city.name, url: `/${state.slug}/${city.slug}/` },
  ];
}

export function serviceCityBreadcrumbs(
  city: City,
  state: State,
  service: Service
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: state.name, url: `/${state.slug}/` },
    { name: city.name, url: `/${state.slug}/${city.slug}/` },
    {
      name: service.name,
      url: `/${state.slug}/${city.slug}/${service.slug}/`,
    },
  ];
}

export function businessBreadcrumbs(
  biz: Business,
  city: City,
  state: State
): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: state.name, url: `/${state.slug}/` },
    { name: city.name, url: `/${state.slug}/${city.slug}/` },
    { name: biz.name, url: `/business/${biz.slug}/` },
  ];
}
