# SEO_PLAN.md — Technical SEO Execution Plan for MobileTireRepair24

> **Status:** NOT YET EXECUTED. This document is the single source of truth for SEO work.
> It supersedes the SEO-related sections of `PLAN.md` (which describes the original build and is partially outdated).

---

## How to use this document (instructions for the executing agent)

1. **Execute phases in order** (Phase 1 → Phase 8). Phases are ordered by SEO impact and dependency. Tasks within a phase are independent unless stated otherwise.
2. **One commit per task**, message format: `seo: <task id> <short description>` (e.g. `seo: 2.2 add service-city route`).
3. After each phase, run the **verification steps** at the bottom of this document before moving on.
4. Mark tasks done by changing `- [ ]` to `- [x]` in the checklist of each task **in this file** and include that edit in the task's commit.
5. **Do not** redesign UI, rename existing routes, change the data model beyond what is specified, or add dependencies. Everything in this plan works with the packages already in `package.json`.
6. If a code snippet in this plan conflicts with the current state of a file (e.g. the file changed since this plan was written), preserve the *intent* of the task and adapt the snippet minimally.

### Critical facts about this codebase (read before writing any code)

- **Next.js 16.2.2, App Router, Turbopack by default.** This version has breaking changes vs. older Next.js. Docs are bundled at `node_modules/next/dist/docs/`. Relevant guides:
  - `01-app/01-getting-started/14-metadata-and-og-images.md`
  - `01-app/03-api-reference/03-file-conventions/01-metadata/{sitemap,robots,opengraph-image,manifest}.md`
  - `01-app/02-guides/incremental-static-regeneration.md`
  - `01-app/02-guides/upgrading/version-16.md` (breaking changes)
- **`params` is always a `Promise`** in pages, `generateMetadata`, and OG image functions. Always `const { slug } = await params;`. Existing pages already follow this pattern — copy it.
- **In `opengraph-image.tsx` files, the default-exported `Image` function also receives `params` as a `Promise`** (Next 16 breaking change).
- **`next lint` does not exist** in Next 16 and there is no ESLint config in this repo. Type-check with `npx tsc --noEmit` instead.
- **URLs use trailing slashes everywhere** (internal links, canonicals, sitemap, schema). Keep this convention in all new code.
- **Data comes from MongoDB at build/request time** (`lib/db.ts`, `lib/data.ts`). Collections: `businesses`, `cities`, `states`, `services`, `reviews`. `npm run build` requires a reachable `MONGODB_URI`.
- **Site URL** comes from `process.env.NEXT_PUBLIC_SITE_URL` with fallback `https://mobiletirerepair24.com` (see `lib/seo.ts`, `lib/schema.ts`, `app/sitemap.ts`, `app/robots.ts`).
- **Entity model:** `State { slug, name, code, intro, cities[] }` → `City { slug, name, state, stateCode, lat, lng, intro, nearbyCities[] }` → `Business { slug, name, phone, city, state, services[], areasServed[], description, rating, reviewCount, photos?, hours?, pricing?, website?, zipCode?, ... }`. `Service { slug, name, shortName, description, h1Template, metaTitleTemplate, metaDescTemplate, faqs[] }` with `{city}` / `{state}` / `{stateCode}` placeholders filled by `fillTemplate()` in `lib/data.ts`.
- **Public routes today:** `/` , `/[state]/` , `/[state]/[city]/` , `/business/[slug]/` , plus `app/sitemap.ts` and `app/robots.ts`. Admin lives under `/admin` (JWT-protected via `middleware.ts`); API under `/api`.

---

## Current-state audit (why each phase exists)

| Area | State | Gap |
|---|---|---|
| Titles/descriptions/canonicals | Good on state/city/business via `lib/seo.ts` | Homepage has no canonical or page-level metadata; no Twitter cards |
| Service × city pages | Helpers exist (`serviceCityMetadata`, `ServiceLinks`, `FAQSection`, `buildFAQSchema`, `services` collection with FAQ content) | **Route `app/[state]/[city]/[service]/page.tsx` does not exist** — the largest keyword surface of the site is missing |
| robots.txt | Exists | Does not disallow `/admin/` or `/api/` |
| Trailing slashes | All links/canonicals emit `/foo/` | `trailingSlash` not set in `next.config.ts` → Next serves `/foo` and redirects nothing; duplicate-URL risk |
| Sitemap | Home + states + indexable cities + businesses | No service-city URLs |
| JSON-LD | BreadcrumbList, ItemList, basic LocalBusiness | LocalBusiness missing `@id`, `image`, `geo`, street address, opening hours, priceRange; no WebSite/Organization; FAQ builder unused |
| OG images | None | No `opengraph-image` anywhere; social shares render bare |
| Freshness | Pure SSG, no ISR | New/edited businesses invisible until a full redeploy |
| Fonts | Google Fonts via CSS `@import` in `app/globals.css` | Render-blocking, third-party request, CLS risk — should be `next/font` |
| Images | Raw `<img>` in `PhotoGallery`, CSS background in `BusinessCard` | No optimization/lazy-loading/CLS protection from `next/image` |
| Indexation gate | `isCityIndexable` = ≥ 1 business | `PLAN.md` says ≥ 3. **Decision: keep threshold at 1 for now** (data is sparse: ~46 businesses / 40 cities; a threshold of 3 would deindex most of the site). Centralize as a constant so it can be raised later |

---

## Phase 1 — URL & crawl hygiene (P0, small diffs, do first)

### Task 1.1 — Enforce trailing slashes at the framework level

- [x] Done

**File:** `next.config.ts`

All canonicals, internal links, sitemap entries, and schema URLs already use trailing slashes. Make Next.js 301-redirect the non-slash variants so only one URL form exists.

Add `trailingSlash: true` to the config object:

```ts
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};
```

**Acceptance:** `npm run build` succeeds; requesting `/texas` returns a 308/301 redirect to `/texas/` (verify with `curl -sI http://localhost:3000/texas` against `next start`).

### Task 1.2 — Block admin and API from crawlers

- [x] Done

**File:** `app/robots.ts`

Replace the `rules` array with:

```ts
rules: [
  {
    userAgent: '*',
    allow: '/',
    disallow: ['/admin/', '/api/'],
  },
],
```

Keep the existing `sitemap` field.

**Acceptance:** `curl http://localhost:3000/robots.txt` shows both `Disallow: /admin/` and `Disallow: /api/` plus the sitemap line.

### Task 1.3 — Homepage metadata with canonical

- [x] Done

**Files:** `lib/seo.ts`, `app/page.tsx`

1. Add to `lib/seo.ts`:

```ts
export function homeMetadata(): Metadata {
  const title = 'MobileTireRepair24 — Find Mobile Tire Repair Near You';
  const description =
    'Find top-rated 24/7 mobile tire repair near you. Compare local technicians who come to your home, office, or roadside — anywhere in the US.';
  const url = `${SITE_URL}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
  };
}
```

2. In `app/page.tsx`, add at module level (imports at top of file):

```ts
import { homeMetadata } from '@/lib/seo';

export const metadata = homeMetadata();
```

**Acceptance:** View source of `/` shows `<link rel="canonical" href="https://mobiletirerepair24.com/"/>` and the new title/description.

### Task 1.4 — Twitter cards on every page

- [x] Done

**File:** `lib/seo.ts`

Every metadata helper (`homeMetadata`, `cityMetadata`, `serviceCityMetadata`, `businessMetadata`, `stateMetadata`) currently returns `{ title, description, alternates, openGraph }`. Add a `twitter` key to each of them:

```ts
twitter: { card: 'summary_large_image', title, description },
```

(The Twitter image itself comes for free from the OG image files added in Phase 4 — do not set `twitter.images` manually.)

**Acceptance:** View source of any city page shows `<meta name="twitter:card" content="summary_large_image"/>`.

---

## Phase 2 — Service × City pages (P0 — the biggest ranking-surface win)

Everything needed already exists except the route itself: `lib/seo.ts` has `serviceCityMetadata()`, `lib/schema.ts` has `serviceCityBreadcrumbs()` + `buildFAQSchema()`, `components/ServiceLinks.tsx` and `components/FAQSection.tsx` are built but unused, and the `services` Mongo collection (seeded from `data/services.json`) carries per-service title/description/H1 templates and FAQ content with `{city}` placeholders.

### Task 2.1 — Data-layer support

- [ ] Done

**File:** `lib/data.ts`

1. Near the top of the "Indexation gates" section, add a named constant and use it in `isCityIndexable` (replace the literal `1`):

```ts
/** Minimum businesses required for a city or service-city page to be indexable.
 *  Raise to 3 once listing density improves (see SEO_PLAN.md). */
export const MIN_BUSINESSES_TO_INDEX = 1;
```

2. Add these functions (Businesses section for the query, Indexation gates section for the gate):

```ts
export async function getBusinessesByCityAndService(
  citySlug: string,
  stateSlug: string,
  serviceSlug: string
): Promise<Business[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.businesses)
    .find({ city: citySlug, state: stateSlug, services: serviceSlug })
    .toArray();
  return cleanAllBusinesses(docs as never);
}

export async function isServiceCityIndexable(
  serviceSlug: string,
  citySlug: string,
  stateSlug: string
): Promise<boolean> {
  const db = await getDb();
  const count = await db
    .collection(COLLECTIONS.businesses)
    .countDocuments({ city: citySlug, state: stateSlug, services: serviceSlug });
  return count >= MIN_BUSINESSES_TO_INDEX;
}
```

**Acceptance:** `npx tsc --noEmit` passes.

### Task 2.2 — The route: `app/[state]/[city]/[service]/page.tsx`

- [ ] Done

**File (new):** `app/[state]/[city]/[service]/page.tsx`

Create with this content (it mirrors the structure and conventions of `app/[state]/[city]/page.tsx`):

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getAllCities,
  getAllServices,
  getStateBySlug,
  getCityBySlug,
  getServiceBySlug,
  getBusinessesByCityAndService,
  isServiceCityIndexable,
  fillTemplate,
} from '@/lib/data';
import { serviceCityMetadata, noindexMetadata } from '@/lib/seo';
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
  buildFAQSchema,
  serviceCityBreadcrumbs,
} from '@/lib/schema';
import { getNearbyCities } from '@/lib/nearby';
import Breadcrumb from '@/components/Breadcrumb';
import BusinessList from '@/components/BusinessList';
import FAQSection from '@/components/FAQSection';
import SchemaOrg from '@/components/SchemaOrg';

type Props = {
  params: Promise<{ state: string; city: string; service: string }>;
};

export async function generateStaticParams() {
  const [cities, services] = await Promise.all([
    getAllCities(),
    getAllServices(),
  ]);
  return cities.flatMap((c) =>
    services.map((s) => ({ state: c.state, city: c.slug, service: s.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, service: serviceSlug } = await params;
  const [state, city, service] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug),
  ]);
  if (!state || !city || !service) return {};
  if (!(await isServiceCityIndexable(serviceSlug, citySlug, stateSlug))) {
    return noindexMetadata();
  }
  return serviceCityMetadata(service, city, state);
}

export default async function ServiceCityPage({ params }: Props) {
  const { state: stateSlug, city: citySlug, service: serviceSlug } = await params;
  const [state, city, service] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug),
  ]);
  if (!state || !city || !service) notFound();

  const [businesses, nearby] = await Promise.all([
    getBusinessesByCityAndService(citySlug, stateSlug, serviceSlug),
    getNearbyCities(citySlug),
  ]);

  const faqs = service.faqs.map((f) => ({
    q: fillTemplate(f.q, city, state),
    a: fillTemplate(f.a, city, state),
  }));

  const crumbs = serviceCityBreadcrumbs(city, state, service);

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />
      <SchemaOrg
        data={buildItemListSchema(businesses.map((b) => `/business/${b.slug}/`))}
      />
      {faqs.length > 0 && <SchemaOrg data={buildFAQSchema(faqs)} />}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={crumbs} />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          {fillTemplate(service.h1Template, city, state)}
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          {service.description} Available now in {city.name}, {state.code}.
        </p>

        <div className="flex flex-col gap-12">
          <BusinessList
            businesses={businesses}
            heading={`Businesses Offering ${service.name} in ${city.name}`}
          />

          {faqs.length > 0 && <FAQSection faqs={faqs} />}

          {nearby.length > 0 && (
            <section aria-labelledby="nearby-service-heading">
              <h2
                id="nearby-service-heading"
                className="text-xl font-semibold text-slate-900 mb-4"
              >
                {service.name} Near {city.name}
              </h2>
              <ul className="flex flex-col gap-2" role="list">
                {nearby.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.state}/${c.slug}/${service.slug}/`}
                      className="text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium"
                    >
                      {service.name} in {c.name}, {c.stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
```

Notes for the executor:

- `BusinessList` returns `null` for an empty array, so a 0-business combo renders H1 + FAQs + nearby links only. That is intended: it stays `noindex` via the gate. Do **not** call `notFound()` for 0 businesses — nearby-city links may point here and a soft page with FAQ content is better than a 404.
- `getNearbyCities(citySlug)` in `lib/nearby.ts` is async and returns `Promise<City[]>` — the snippet above already calls it correctly.

**Acceptance:** `npx tsc --noEmit` passes; with the dev server + seeded DB, `/texas/dallas/mobile-tire-repair/` renders H1, businesses, FAQs, nearby links, and three `<script type="application/ld+json">` blocks; a thin combo (0 businesses) renders with `<meta name="robots" content="noindex, follow"/>`.

### Task 2.3 — Link service pages from city pages

- [ ] Done

**File:** `app/[state]/[city]/page.tsx`

1. Import `getAllServices` from `@/lib/data` and `ServiceLinks` from `@/components/ServiceLinks`.
2. In the page component, fetch services alongside the existing parallel fetches, then keep only services offered by at least one business in this city:

```ts
const services = await getAllServices();
const offeredServices = services.filter((svc) =>
  businesses.some((b) => b.services.includes(svc.slug))
);
```

3. Render inside the existing `flex flex-col gap-12` container, between `BusinessList` and the nearby-cities block:

```tsx
{offeredServices.length > 0 && (
  <ServiceLinks
    services={offeredServices}
    citySlug={citySlug}
    stateSlug={stateSlug}
    heading={`Services Available in ${city.name}`}
  />
)}
```

**Acceptance:** City pages with businesses show a "Services Available in …" section linking to `/{state}/{city}/{service}/` URLs.

### Task 2.4 — Link service pages from business pages

- [ ] Done

**File:** `app/business/[slug]/page.tsx`

1. Import `getAllServices` from `@/lib/data` and `ServiceLinks` from `@/components/ServiceLinks`.
2. Fetch all services in the existing `Promise.all`, then compute:

```ts
const offeredServices = allServices.filter((s) => biz.services.includes(s.slug));
```

3. Directly after the existing `<ServiceSection services={biz.services} />`, render:

```tsx
{offeredServices.length > 0 && (
  <ServiceLinks
    services={offeredServices}
    citySlug={biz.city}
    stateSlug={biz.state}
    heading={`Find These Services in ${city.name}`}
  />
)}
```

**Acceptance:** Business pages link each offered service to its service-city page with the service name as anchor text.

### Task 2.5 — Add service-city URLs to the sitemap

- [ ] Done

**File:** `app/sitemap.ts`

1. Extend imports with `getAllServices` and `isServiceCityIndexable`.
2. Fetch services in the existing `Promise.all`.
3. After the city loop, add:

```ts
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
```

(City count × service count is ~120 combos today; sequential `countDocuments` calls are acceptable. Do not prematurely optimize.)

**Acceptance:** `curl http://localhost:3000/sitemap.xml` contains service-city URLs only for combos with ≥ `MIN_BUSINESSES_TO_INDEX` businesses.

---

## Phase 3 — Structured data enrichment (P1)

### Task 3.1 — Rich `LocalBusiness` (→ `AutoRepair`) schema

- [ ] Done

**Files:** `lib/schema.ts`, `app/business/[slug]/page.tsx`

Replace `buildLocalBusinessSchema` with a version that accepts the city (for geo) and emits every rich-result-eligible field the data supports. New signature: `buildLocalBusinessSchema(biz: Business, city: City)`.

```ts
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
```

Then in `app/business/[slug]/page.tsx`, update the call site to `buildLocalBusinessSchema(biz, city)`. (`city` is already fetched there. Because `notFound()` narrows after the `Promise.all`, the call happens after the `if (!city || !state) notFound();` guard — keep it that way so `city` is non-null.)

**Acceptance:** `npx tsc --noEmit` passes; a business page's JSON-LD contains `"@type":"AutoRepair"`, `@id`, address with street/locality/region, and (when the data exists) `geo`, `image`, `openingHoursSpecification`, `priceRange`.

### Task 3.2 — `WebSite` + `Organization` schema on the homepage

- [ ] Done

**Files:** `lib/schema.ts`, `app/page.tsx`

1. Add to `lib/schema.ts`:

```ts
const SITE_NAME = 'MobileTireRepair24';

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
```

2. In `app/page.tsx`, import `SchemaOrg` and both builders, and render at the top of the returned JSX:

```tsx
<SchemaOrg data={buildWebSiteSchema()} />
<SchemaOrg data={buildOrganizationSchema()} />
```

**Acceptance:** Homepage source contains two additional JSON-LD scripts with `"@type":"WebSite"` and `"@type":"Organization"`.

---

## Phase 4 — Open Graph images (P1)

Next.js file convention: an `opengraph-image.tsx` in a route segment auto-injects `og:image` (and is used as the Twitter image fallback) for that segment. **Next 16:** the default-exported function receives `params` as a `Promise` — always `await` it.

### Task 4.1 — Site-default OG image

- [ ] Done

**File (new):** `app/opengraph-image.tsx`

```tsx
import { ImageResponse } from 'next/og';

export const alt = 'MobileTireRepair24 — Find Mobile Tire Repair Near You';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, display: 'flex' }}>
          MobileTireRepair<span style={{ color: '#60A5FA' }}>24</span>
        </div>
        <div style={{ fontSize: 32, color: '#CBD5E1', marginTop: 24 }}>
          Find Mobile Tire Repair Near You — Anywhere in the US
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### Task 4.2 — Dynamic OG images for city and business pages

- [ ] Done

**Files (new):** `app/[state]/[city]/opengraph-image.tsx`, `app/business/[slug]/opengraph-image.tsx`

City version:

```tsx
import { ImageResponse } from 'next/og';
import { getCityBySlug, getStateBySlug } from '@/lib/data';

export const alt = 'Mobile Tire Repair';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateSlug, city: citySlug } = await params;
  const [state, city] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
  ]);
  const heading = city && state ? `Mobile Tire Repair in ${city.name}, ${state.code}` : 'Mobile Tire Repair';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: 'white',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 30, color: '#60A5FA', fontWeight: 700 }}>
          MobileTireRepair24
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, lineHeight: 1.15 }}>
          {heading}
        </div>
        <div style={{ fontSize: 28, color: '#CBD5E1', marginTop: 24 }}>
          Fast on-site service — technicians come to you.
        </div>
      </div>
    ),
    { ...size }
  );
}
```

Business version: same file structure with `params: Promise<{ slug: string }>`, fetch via `getBusinessBySlug(slug)`, heading `biz.name`, subline `` `Mobile Tire Repair in ${biz.address}` `` (fall back to generic strings if the business is not found — never throw inside the image function).

Optionally add `app/[state]/opengraph-image.tsx` following the same pattern with `Mobile Tire Repair in ${state.name}`.

**Acceptance:** View source of `/`, a city page, and a business page each show an `og:image` meta tag pointing at an `opengraph-image` URL; `curl -sI` on that URL returns `content-type: image/png`.

---

## Phase 5 — Freshness: ISR so DB edits go live without redeploys (P1)

### Task 5.1 — Time-based revalidation on all public pages

- [ ] Done

**Files:** `app/page.tsx`, `app/[state]/page.tsx`, `app/[state]/[city]/page.tsx`, `app/[state]/[city]/[service]/page.tsx`, `app/business/[slug]/page.tsx`, `app/sitemap.ts`

Add to each file at module level (top, after imports):

```ts
export const revalidate = 3600; // re-render at most hourly; admin edits go live without redeploys
```

This keeps pages statically served but re-renders them in the background at most once per hour, so admin CRUD (which writes straight to Mongo) reaches production without a rebuild. Dynamic params not returned by `generateStaticParams` (e.g. a business added after deploy) render on first request and are then cached — this is the default `dynamicParams = true` behavior; do not change it.

**Acceptance:** `npm run build` output marks the public routes as ISR (revalidate 1h) rather than fully static.

### Task 5.2 (optional, only if Task 5.1 verified) — Instant revalidation on admin writes

- [ ] Done

**Files:** the admin CRUD route handlers under `app/api/admin/businesses/`, `app/api/admin/cities/`, `app/api/admin/states/` (locate the POST/PUT/PATCH/DELETE handlers with `rg "deleteBusiness|upsertBusiness|updateBusiness|createBusiness" app/api/admin`)

After each successful mutation, add:

```ts
import { revalidatePath } from 'next/cache';
// after the successful DB write:
revalidatePath('/', 'layout');
```

`revalidatePath('/', 'layout')` invalidates every route in one call — coarse but correct for a site this size, and much simpler than computing the affected state/city/service/business path set. Do not attempt fine-grained path invalidation.

**Acceptance:** With `next start`, editing a business via the admin UI is visible on its public page on the next request (no rebuild).

---

## Phase 6 — Core Web Vitals (P2)

### Task 6.1 — Self-hosted fonts via `next/font`

- [ ] Done

**Files:** `app/layout.tsx`, `app/globals.css`

1. In `app/layout.tsx`:

```ts
import { EB_Garamond, Lato } from 'next/font/google';

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
});
```

and change the `<html>` tag to:

```tsx
<html lang="en" className={`${garamond.variable} ${lato.variable}`} suppressHydrationWarning>
```

2. In `app/globals.css`:
   - **Delete** line 1 (the `@import url('https://fonts.googleapis.com/...')`).
   - Change `body { font-family: 'Lato', system-ui, sans-serif; ... }` to `font-family: var(--font-body), system-ui, sans-serif;`
   - Change the heading rule to `font-family: var(--font-heading), Georgia, serif;`

**Acceptance:** No request to `fonts.googleapis.com` in the network tab; headings still render in a serif face, body in a sans face.

### Task 6.2 — `next/image` for public listing photos

- [ ] Done

**Files:** `components/listing/PhotoGallery.tsx`, `components/BusinessCard.tsx`

`next.config.ts` already whitelists the S3/Unsplash hosts in `images.remotePatterns` — no config change needed.

1. **PhotoGallery** (client component — `next/image` works in client components): replace both raw `<img>` tags with `next/image` using `fill` inside the existing relatively-positioned containers:
   - Main image container already has `relative ... aspect-video`: `<Image src={photos[currentIndex]} alt={...} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority={currentIndex === 0} />`
   - Thumbnails: the `<button>` wrapper is `w-16 h-16` — add `relative` to its className and use `<Image src={photo} alt={...} fill className="object-cover" sizes="64px" />`.
2. **BusinessCard**: replace the CSS `backgroundImage` div with:

```tsx
{biz.photos?.[0] && (
  <div className="hidden md:block w-36 h-36 shrink-0 rounded-lg overflow-hidden relative">
    <Image
      src={biz.photos[0]}
      alt={`${biz.name} photo`}
      fill
      className="object-cover"
      sizes="144px"
    />
  </div>
)}
```

Import `Image from 'next/image'` in both files.

**Note (Next 16):** `images.qualities` defaults to `[75]` and local IPs are blocked for optimization — both fine here; do not add config for them.

**Acceptance:** `npx tsc --noEmit` passes; photos render identically; `<img>` tags in these components now have `srcset` generated by Next.

---

## Phase 7 — Site hygiene (P2)

### Task 7.1 — Web app manifest

- [ ] Done

**File (new):** `app/manifest.ts`

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MobileTireRepair24',
    short_name: 'TireRepair24',
    description:
      'The #1 directory for mobile tire repair services across the United States.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F172A',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
```

**Acceptance:** `curl http://localhost:3000/manifest.webmanifest` returns the JSON and the homepage `<head>` links to it.

### Task 7.2 — Custom 404 with recovery links

- [ ] Done

**File (new):** `app/not-found.tsx`

Server component. Render an H1 ("Page Not Found"), one sentence of copy, a link to `/`, and the list of states (reuse `getAllStates()` from `@/lib/data`, linking each to `/${state.slug}/` with `Mobile Tire Repair in ${state.name}` as anchor text). Style consistently with existing pages (`max-w-4xl mx-auto px-4 py-10`). Next.js automatically serves this with a real HTTP 404 status.

**Acceptance:** `curl -sI http://localhost:3000/does-not-exist/` returns `404` and the body contains state links.

### Task 7.3 — Rename deprecated `middleware.ts` to `proxy.ts`

- [ ] Done

**Files:** `middleware.ts` → `proxy.ts`

Next 16 deprecates the `middleware` file convention in favor of `proxy` (see `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, section "`middleware` to `proxy`"). The `proxy` runtime is Node.js (edge is not supported) — this codebase only guards `/admin` and `/api/admin` with a JWT check, which runs fine on Node.

1. `git mv middleware.ts proxy.ts`
2. Inside the file, rename the exported function `middleware` to `proxy` (keep the `config` export with its `matcher` untouched).
3. Verify no other file imports from `@/middleware` (`rg "from '@/middleware'" .` should return nothing).

**Acceptance:** `npm run build` succeeds with no deprecation warning about `middleware`; `/admin` still redirects to `/admin/login` when unauthenticated.

---

## Phase 8 — Content & linking rules (ongoing, apply to any future page work)

These are conventions, not one-shot tasks. Apply them whenever touching templates or adding data:

1. **Anchor text is always keyword-rich:** city links say `Mobile Tire Repair in Dallas, TX` (never bare "Dallas"); service links say `Flat Tire Repair in Fort Worth`; business links use the business name.
2. **Every indexable page needs unique intro copy.** City/state intros come from the `intro` field in Mongo; when adding cities via admin or scripts, never leave the auto-generated fallback intro (`ensureBusinessLocation` in `lib/data.ts` writes a generic one) on an indexable page — replace it with 2–3 unique, locally specific sentences.
3. **One H1 per page**, exactly matching the title's primary keyword phrase.
4. **The indexation gate is the single constant `MIN_BUSINESSES_TO_INDEX`** in `lib/data.ts`. When listing density improves (most cities have 3+ businesses), raise it to `3` — one-line change; sitemap + noindex behavior follows automatically.
5. **Never link to a page that would 404**; service links must be filtered to services actually offered (Tasks 2.3/2.4 establish the pattern).
6. **Canonical host:** www→apex and http→https redirects must be configured at the hosting/DNS layer (they cannot be expressed in `next.config.ts` without knowing the host header setup). Verify after deploy: `curl -sI http://www.mobiletirerepair24.com` should 301 to `https://mobiletirerepair24.com/`.

---

## Verification

### Environment setup (needed once, before Phase 1 verification)

`npm run build` and the dev server need MongoDB:

```bash
npm install
docker run -d --name mtr-mongo -p 27017:27017 mongo:7   # or any reachable Mongo
export MONGODB_URI="mongodb://localhost:27017"
npm run seed                                             # imports data/*.json
```

If Docker/Mongo is unavailable in the execution environment, fall back to `npx tsc --noEmit` for every task and state clearly in the final report that runtime verification was skipped.

### After every phase

```bash
npx tsc --noEmit          # must pass with zero errors
npm run build             # must succeed (requires MONGODB_URI)
```

### Final checklist (run against `npm run start` with seeded DB)

| Check | Command / method | Expected |
|---|---|---|
| Trailing-slash redirect | `curl -sI localhost:3000/texas` | 301/308 → `/texas/` |
| robots | `curl localhost:3000/robots.txt` | allow `/`, disallow `/admin/` + `/api/`, sitemap line |
| Sitemap | `curl localhost:3000/sitemap.xml` | home, states, indexable cities, service-city combos, businesses — all absolute URLs with trailing slashes |
| Canonicals | view-source on `/`, state, city, service, business pages | exactly one `rel="canonical"`, trailing slash, matches the page URL |
| Noindex gating | view-source on a 0-business city and 0-business service-city page | `noindex, follow` meta; URL absent from sitemap |
| JSON-LD validity | copy each page's JSON-LD into a JSON parser (`node -e 'JSON.parse(...)'`) | parses; business page has `AutoRepair` with address/geo/hours; service page has `FAQPage`; homepage has `WebSite` + `Organization` |
| OG images | `curl -sI` each `og:image` URL from page source | `200`, `image/png` |
| Twitter card | view-source any page | `twitter:card = summary_large_image` |
| 404 | `curl -sI localhost:3000/nope/` | `404` with recovery links |
| Fonts | page source | no `fonts.googleapis.com` reference |
| ISR | `npm run build` output | public routes show 1h revalidate |
| Admin still works | log in at `/admin/login`, edit a business | edit visible on public page (Task 5.2) |

### Out of scope — do NOT do any of the following

- Do not add dependencies (`next-sitemap`, `next-seo`, schema libraries — the built-in file conventions cover everything).
- Do not convert public pages to client components or add client-side data fetching for content.
- Do not change URL structures of existing routes or business slugs (would orphan any earned links).
- Do not fabricate `lastModified` dates in the sitemap; add them only if/when real `updatedAt` timestamps exist on the documents.
- Do not add `SearchAction`/Sitelinks-searchbox schema — there is no crawlable search results page (`/api/search` is a JSON endpoint).
- Do not enable `cacheComponents` / PPR — out of scope for this pass.
- Do not touch `/admin` UI or auth beyond Task 5.2 and 7.3.
