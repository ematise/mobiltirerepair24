# MobileTireRepair24 — Programmatic SEO Directory
## Technical Plan & Implementation Guide

---

## 1. Project Overview

**Goal:** A lean, server-rendered Next.js directory for US mobile tire repair businesses, optimized for Core Web Vitals, crawlability, and programmatic SEO at scale.

**Tech Stack:**
- Next.js 14 (App Router, all SSG/SSR — zero CSR for content)
- TypeScript
- Tailwind CSS (utility-only, no component libraries)
- JSON data files (MVP — no DB needed initially)
- next-sitemap (sitemap + robots.txt generation)
- Schema.org structured data (inline JSON-LD)

---

## 2. Folder Structure

```
mobiletirerepair24/
├── app/
│   ├── layout.tsx                    # Root layout (nav, footer)
│   ├── page.tsx                      # Homepage
│   ├── sitemap.ts                    # Dynamic sitemap
│   ├── robots.ts                     # robots.txt
│   │
│   ├── [state]/
│   │   ├── page.tsx                  # /texas/
│   │   └── [city]/
│   │       ├── page.tsx              # /texas/dallas/
│   │       └── [service]/
│   │           └── page.tsx          # /texas/dallas/mobile-tire-repair/
│   │
│   └── business/
│       └── [slug]/
│           └── page.tsx              # /business/joes-tire-dallas-tx/
│
├── components/
│   ├── Breadcrumb.tsx
│   ├── BusinessCard.tsx
│   ├── BusinessList.tsx
│   ├── CityLinks.tsx
│   ├── FAQSection.tsx
│   ├── SchemaOrg.tsx                 # JSON-LD injector
│   └── ServiceLinks.tsx
│
├── lib/
│   ├── data.ts                       # Data access functions
│   ├── seo.ts                        # Metadata helpers
│   ├── schema.ts                     # Schema.org builders
│   ├── slugify.ts                    # URL slug utilities
│   └── nearby.ts                     # Nearby cities logic
│
├── data/
│   ├── businesses.json               # All business records
│   ├── cities.json                   # City metadata + intros
│   ├── services.json                 # Service definitions
│   └── states.json                   # State metadata
│
├── public/
│   └── (static assets)
│
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Route Structure

| Route | Page Type | Indexed |
|-------|-----------|---------|
| `/` | Homepage | Yes |
| `/[state]/` | State page | Yes |
| `/[state]/[city]/` | City page | Yes (if ≥3 businesses) |
| `/[state]/[city]/[service]/` | Service+City page | Yes (if ≥3 businesses) |
| `/business/[slug]/` | Business page | Yes |

**Indexation gate:** Any city or service+city page with fewer than 3 businesses gets `noindex` + is excluded from sitemap.

---

## 4. Data Schema

### businesses.json
```json
[
  {
    "id": "b001",
    "name": "DFW Mobile Tire Pros",
    "slug": "dfw-mobile-tire-pros-dallas-tx",
    "phone": "+12145550001",
    "address": "Dallas, TX",
    "city": "dallas",
    "state": "texas",
    "stateCode": "TX",
    "services": ["mobile-tire-repair", "flat-tire-repair", "tire-installation"],
    "areasServed": ["Dallas", "Irving", "Garland", "Mesquite"],
    "description": "24/7 mobile tire repair serving the Dallas metro area.",
    "rating": 4.8,
    "reviewCount": 142
  }
]
```

### cities.json
```json
{
  "dallas": {
    "name": "Dallas",
    "state": "texas",
    "stateCode": "TX",
    "slug": "dallas",
    "lat": 32.7767,
    "lng": -96.7970,
    "intro": "Dallas drivers know how unpredictable Texas roads can be...",
    "nearbyCities": ["fort-worth", "irving", "garland", "plano", "arlington"]
  }
}
```

### services.json
```json
{
  "mobile-tire-repair": {
    "slug": "mobile-tire-repair",
    "name": "Mobile Tire Repair",
    "shortName": "Tire Repair",
    "description": "On-site tire repair anywhere in your city.",
    "h1Template": "Mobile Tire Repair in {city}, {stateCode}"
  }
}
```

---

## 5. Page Templates

### 5a. City Page — `/texas/dallas/`

```
H1: Mobile Tire Repair in Dallas, TX
─────────────────────────────────────
[Unique intro paragraph — city-specific, 2-3 sentences]

## Top Mobile Tire Repair Services in Dallas

[BusinessList → BusinessCard × N]

## Services Available in Dallas
[ServiceLinks → links to /texas/dallas/[service]/]

## Nearby Cities with Mobile Tire Services
[CityLinks → links to /texas/[nearby-city]/]

[Breadcrumbs: Home > Texas > Dallas]
[Schema: BreadcrumbList + ItemList]
```

### 5b. Service+City Page — `/texas/dallas/mobile-tire-repair/`

```
H1: Mobile Tire Repair in Dallas, TX
─────────────────────────────────────
[Locally-relevant intro paragraph]

## Businesses Offering Mobile Tire Repair in Dallas
[BusinessList filtered by service]

## Frequently Asked Questions
Q: How fast can a mobile tire repair tech reach me in Dallas?
Q: How much does mobile tire repair cost in Dallas, TX?
Q: Do mobile tire services work on highways in Dallas?

## Mobile Tire Repair Near Dallas
[CityLinks → same service, nearby cities]
  → "Mobile Tire Repair in Fort Worth, TX"
  → "Mobile Tire Repair in Irving, TX"

[Breadcrumbs: Home > Texas > Dallas > Mobile Tire Repair]
[Schema: BreadcrumbList + ItemList + FAQPage]
```

### 5c. Business Page — `/business/dfw-mobile-tire-pros-dallas-tx/`

```
H1: DFW Mobile Tire Pros — Dallas, TX
──────────────────────────────────────
[Business description]

📞 (214) 555-0001  ← click-to-call
📍 Dallas, TX

## Services Offered
- Mobile Tire Repair → /texas/dallas/mobile-tire-repair/
- Flat Tire Repair   → /texas/dallas/flat-tire-repair/
- Tire Installation  → /texas/dallas/tire-installation/

## Areas Served
Dallas · Irving · Garland · Mesquite

## More in Dallas
→ All Mobile Tire Services in Dallas  (/texas/dallas/)
→ Mobile Tire Repair in Dallas, TX    (/texas/dallas/mobile-tire-repair/)

[Breadcrumbs: Home > Texas > Dallas > DFW Mobile Tire Pros]
[Schema: LocalBusiness + BreadcrumbList]
```

---

## 6. Internal Linking Map

```
Homepage
  └── /[state]/           (all active states)
        └── /[state]/[city]/         (all indexed cities)
              ├── /[state]/[city]/[service]/    (all indexed service pages)
              └── Nearby city links

Business page
  ├── → /[state]/[city]/             (back to city)
  └── → /[state]/[city]/[service]/  (each service offered)

Service+City page
  └── → /[state]/[nearby-city]/[same-service]/  (nearby same-service)

All pages
  └── Breadcrumbs (Home > State > City > [Service])
```

**Anchor text rules:**
- City links: `"Mobile Tire Repair in Dallas, TX"` (not just "Dallas")
- Service links: `"Flat Tire Repair in Fort Worth"` (not generic "click here")
- Business links: business name as anchor
- Breadcrumbs: exact page name

---

## 7. Structured Data (JSON-LD)

### LocalBusiness (business pages)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "DFW Mobile Tire Pros",
  "telephone": "+12145550001",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dallas",
    "addressRegion": "TX",
    "addressCountry": "US"
  },
  "areaServed": ["Dallas", "Irving", "Garland"],
  "description": "...",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "142"
  }
}
```

### BreadcrumbList (all pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mobiletirerepair24.com/" },
    { "@type": "ListItem", "position": 2, "name": "Texas", "item": "https://mobiletirerepair24.com/texas/" },
    { "@type": "ListItem", "position": 3, "name": "Dallas", "item": "https://mobiletirerepair24.com/texas/dallas/" }
  ]
}
```

### ItemList (city + service pages)
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "https://mobiletirerepair24.com/business/dfw-mobile-tire-pros-dallas-tx/" }
  ]
}
```

### FAQPage (service+city pages)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How fast can a tech reach me in Dallas?",
      "acceptedAnswer": { "@type": "Answer", "text": "Most mobile tire techs in Dallas arrive within 30–60 minutes." }
    }
  ]
}
```

---

## 8. SEO Metadata Pattern

Every page uses `generateMetadata()` in Next.js App Router:

```ts
// /texas/dallas/mobile-tire-repair/
title: "Mobile Tire Repair in Dallas, TX | MobileTireRepair24"
description: "Find top-rated mobile tire repair services in Dallas, TX. Fast, on-site service — no tow truck needed."
canonical: "https://mobiletirerepair24.com/texas/dallas/mobile-tire-repair/"

// Business page
title: "DFW Mobile Tire Pros | Dallas, TX Mobile Tire Repair"
description: "DFW Mobile Tire Pros offers 24/7 mobile tire repair in Dallas, TX. Call (214) 555-0001 for fast on-site service."
```

---

## 9. Indexation Logic

```ts
// lib/data.ts
export function isCityIndexable(city: string, state: string): boolean {
  const businesses = getBusinessesByCity(city, state);
  return businesses.length >= 3;
}

export function isServiceCityIndexable(service: string, city: string, state: string): boolean {
  const businesses = getBusinessesByCityAndService(city, state, service);
  return businesses.length >= 3;
}
```

Pages that don't pass the threshold:
- Return `noindex` in metadata
- Are excluded from `sitemap.ts`
- Still render (for direct traffic) but won't be crawled

---

## 10. Core Web Vitals Strategy

| Metric | Approach |
|--------|----------|
| LCP | No hero images on text-first pages. Use `font-display: swap`. H1 renders immediately. |
| CLS | Fixed-height business cards. No lazy-loaded layout elements. |
| FID/INP | Zero interactive JS on content pages. Click-to-call is a plain `<a href="tel:...">`. |
| TTFB | All pages statically generated at build time (SSG). |

**Banned patterns:**
- No `useEffect` for content fetching
- No client components for primary content
- No UI libraries (MUI, Chakra, etc.)
- No client-side routing for page content

---

## 11. Nearby Cities Algorithm

```ts
// lib/nearby.ts
// Uses Haversine distance on lat/lng stored in cities.json
export function getNearbyCities(citySlug: string, maxDistance = 80, limit = 6): City[] {
  const origin = cities[citySlug];
  return Object.values(cities)
    .filter(c => c.state === origin.state && c.slug !== citySlug)
    .map(c => ({ ...c, distance: haversine(origin, c) }))
    .filter(c => c.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
```

---

## 12. Build & Sitemap

```ts
// app/sitemap.ts — dynamically generates all indexed URLs
export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [];

  // City pages
  for (const city of getAllCities()) {
    if (isCityIndexable(city.slug, city.state)) {
      urls.push({ url: `/${city.state}/${city.slug}/`, changeFrequency: 'weekly', priority: 0.8 });
    }
  }

  // Service+City pages
  for (const service of getAllServices()) {
    for (const city of getAllCities()) {
      if (isServiceCityIndexable(service.slug, city.slug, city.state)) {
        urls.push({ url: `/${city.state}/${city.slug}/${service.slug}/`, priority: 0.9 });
      }
    }
  }

  // Business pages
  for (const biz of getAllBusinesses()) {
    urls.push({ url: `/business/${biz.slug}/`, priority: 0.7 });
  }

  return urls;
}
```

---

## 13. MVP Execution Order

### Phase 1 — Foundation (Day 1)
- [ ] `npx create-next-app@latest` with TypeScript + Tailwind
- [ ] Build data files: 3 states, 5 cities each, 5 businesses each
- [ ] Build `lib/data.ts` with all query functions
- [ ] Build `lib/schema.ts` with JSON-LD builders
- [ ] Root layout with breadcrumb-aware nav and footer

### Phase 2 — Core Pages (Day 2)
- [ ] City page (`/[state]/[city]/`)
- [ ] Service+City page (`/[state]/[city]/[service]/`)
- [ ] Business page (`/business/[slug]/`)
- [ ] State page (`/[state]/`)
- [ ] Homepage

### Phase 3 — SEO Layer (Day 3)
- [ ] `generateMetadata()` on every page
- [ ] All structured data (LocalBusiness, BreadcrumbList, ItemList, FAQPage)
- [ ] Sitemap + robots.txt
- [ ] Indexation gating (noindex for thin pages)
- [ ] Canonical tags

### Phase 4 — Internal Linking (Day 4)
- [ ] Breadcrumb component on all pages
- [ ] Nearby cities component with keyword-rich anchors
- [ ] Service links on city pages
- [ ] Business → city + service backlinks
- [ ] Footer with state/city index links

### Phase 5 — Performance Audit (Day 5)
- [ ] Run Lighthouse on all 3 page types
- [ ] Check CLS with no layout shifts
- [ ] Validate all JSON-LD with Google Rich Results Test
- [ ] Crawl with Screaming Frog or similar
- [ ] Check all internal links resolve

---

## 14. Sample Data Snapshot

### States covered (MVP)
Texas, Florida, California

### Cities (MVP — 5 per state)
**Texas:** Dallas, Houston, Austin, San Antonio, Fort Worth
**Florida:** Miami, Orlando, Tampa, Jacksonville, Fort Lauderdale
**California:** Los Angeles, San Diego, San Jose, Sacramento, Fresno

### Services (MVP — 3)
- `mobile-tire-repair`
- `flat-tire-repair`
- `tire-installation`

### Businesses per city: 4–6 (ensuring all city pages are indexable)

---

## 15. What We Deliberately Exclude (MVP)

- User authentication / accounts
- Admin dashboard
- Search functionality (JS-dependent)
- Reviews system
- Map embeds (JavaScript-heavy, CLS risk)
- Payment processing
- Email / contact forms
- Filtering / sorting (JS-dependent)

These can be layered on post-MVP without affecting SEO foundation.
