import type { Business, City, Service, State } from './data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com';
const SITE_NAME = 'MobileTireRepair24';

const DAY_NAMES: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function buildLocalBusinessSchema(biz: Business, city: City) {
  const profileUrl = `${SITE_URL}/business/${biz.slug}/`;

  const openingHours = biz.hours
    ? Object.entries(biz.hours)
        .filter(([, v]) => !v.closed && v.open && v.close)
        .map(([day, v]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: DAY_NAMES[day.toLowerCase()] ?? day,
          opens: v.open,
          closes: v.close,
        }))
    : undefined;

  const prices = (biz.pricing ?? []).flatMap((p) => [p.minPrice, p.maxPrice]);
  const priceRange =
    prices.length > 0 ? `$${Math.min(...prices)} - $${Math.max(...prices)}` : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${profileUrl}#business`,
    name: biz.name,
    url: biz.website ?? profileUrl,
    telephone: biz.phone,
    description: biz.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: biz.address,
      addressLocality: city.name,
      addressRegion: biz.stateCode,
      ...(biz.zipCode && { postalCode: biz.zipCode }),
      addressCountry: 'US',
    },
    ...(city.lat !== 0 &&
      city.lng !== 0 && {
        geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
      }),
    ...(biz.photos && biz.photos.length > 0 && { image: biz.photos }),
    ...(openingHours && openingHours.length > 0 && {
      openingHoursSpecification: openingHours,
    }),
    ...(priceRange && { priceRange }),
    ...(biz.website && { sameAs: [biz.website] }),
    areaServed: biz.areasServed.map((area) => ({ '@type': 'City', name: area })),
    ...(biz.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(biz.rating),
        reviewCount: String(biz.reviewCount),
        bestRating: '5',
      },
    }),
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

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
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
