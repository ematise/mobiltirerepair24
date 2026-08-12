# Mobile UI/UX Plan — Homepage & "Find Tire Repair Near Me"

> **Audience:** This plan is written to be executed by an AI coding agent. Follow it phase by
> phase, in order. Each phase is self-contained, lists the exact files to create or change,
> and ends with acceptance criteria. Do not skip the acceptance criteria.

---

## 0. Ground rules (read before writing any code)

1. **Read the Next.js docs bundled in this repo first.** This project runs Next.js 16.2.2 whose
   APIs differ from older versions. Before writing code, read at minimum:
   - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
   - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
   - `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
2. **Do NOT enable `cacheComponents`** in `next.config.ts`. This codebase uses the previous
   caching model (`export const revalidate = 3600` per page). Keep that pattern.
3. **Keep all SEO content server-rendered.** The homepage's state/city links, stats, FAQs, and
   business sections must render on the server. Client components (`'use client'`) are allowed
   only for interactive islands (geolocation finder, search). Never move the state/city link
   grid into a client component.
4. **Follow the design system**: `design-system/mobiltirerepair24/MASTER.md`. Key hard rules:
   - Icons come from `lucide-react` (already a dependency) — never emojis.
   - Every clickable element gets `cursor-pointer`, a visible focus state
     (`focus:outline-none focus-visible:ring-2 ...`), and a 150–300ms transition.
   - Text contrast ≥ 4.5:1. No layout-shifting hovers. Respect `prefers-reduced-motion`.
   - Palette: primary `#0F172A` (slate-900), CTA `#0369A1` (sky-700/blue-700 range),
     background `#F8FAFC` (slate-50). Headings use the existing font variables.
5. **Internal links always end with a trailing slash** (`trailingSlash: true` in
   `next.config.ts`). Example: `/texas/dallas/`, `/business/some-slug/`.
6. **Data lives in MongoDB**, accessed via `lib/data.ts` / `lib/db.ts` (`MONGODB_URI` env var).
   The JSON files in `data/` are only seed data. Add new query helpers to `lib/data.ts`.
7. **Key data facts you must design around:**
   - `Business` records have **no lat/lng coordinates**. `City` records DO have `lat`/`lng`
     (see `lib/data.ts` types). Distance to a business = distance to its city's coordinates.
   - Some cities created automatically by `ensureBusinessLocation()` have `lat: 0, lng: 0`.
     Treat `lat === 0 && lng === 0` as "no coordinates" and exclude from distance math.
   - `Business.hours` is optional, shaped `{ monday: { open: "08:00", close: "22:00", closed?: true }, ... }`
     with lowercase day names (see `lib/hours.ts`). 24/7 is encoded as `open: "00:00", close: "23:59"` —
     use the existing `isOpen24Hours()` helper from `lib/hours.ts`.
   - There is **no timezone field anywhere**. Phase 1 adds a state-code → IANA timezone map.
8. **Verification command:** `npm run build` must pass after every phase. It needs `MONGODB_URI`;
   if the database is unreachable in your environment, at minimum run
   `npx tsc --noEmit` and `npx next lint` (if configured) and say so in your summary.

---

## 1. Goal & UX summary

**Primary goal:** A visitor on a phone with a flat tire should get from landing on `/` to
calling the best open business near them in under 15 seconds.

**Homepage conversion flow (mobile-first):**

```
Hero: "Find the Best Mobile Tire Repair Near Me"
  └─ [ Find Tire Repair Near Me ]  ← primary CTA, uses browser geolocation
       └─ Results panel appears inline under the CTA:
            top 5 businesses sorted by (open now first, then distance),
            each with distance, open/closed + hours label, rating, and a CALL button
            + "See all providers in {nearest city} →" link
  └─ Search bar (secondary path) + popular city chips (no-JS/denied-permission path)
```

Below the hero, sections that build trust and keep users browsing:
How it works → live stats → top-rated businesses → services explained → browse by state
(accordion on mobile) → FAQ. A sticky bottom call-to-action bar appears on mobile after the
user scrolls past the hero.

---

## 2. Phase 1 — Shared libraries (geo, timezone, open-now)

### 2.1 `lib/geo.ts` (new file)

Move the haversine math to a shared module and add a miles variant:

```ts
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * 0.621371;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0) // 0,0 is our "missing coordinates" sentinel
  );
}
```

Then update `lib/nearby.ts` to import `haversineKm` from `./geo` and delete its local copy.
Do not change `getNearbyCities` behavior.

### 2.2 `lib/timezones.ts` (new file)

State-code → IANA timezone map for every state currently in the directory, plus a safe
default. This is intentionally approximate (a state can span two timezones); it is good
enough for an "open now" hint and can be refined later with a per-city override.

```ts
const STATE_TIMEZONES: Record<string, string> = {
  TX: 'America/Chicago',
  FL: 'America/New_York',
  CA: 'America/Los_Angeles',
  AZ: 'America/Phoenix',
  GA: 'America/New_York',
  NY: 'America/New_York',
  IL: 'America/Chicago',
  NC: 'America/New_York',
};

export function timezoneForStateCode(stateCode: string): string {
  return STATE_TIMEZONES[stateCode.toUpperCase()] ?? 'America/Chicago';
}
```

If other state codes exist in the DB when you run this, add them to the map.

### 2.3 `lib/open-now.ts` (new file)

Computes open/closed from `Business.hours` in the business's local timezone. It MUST handle:
missing hours (return `null` status), `closed: true` days, 24-hour days (reuse
`isOpen24Hours` from `lib/hours.ts`), and **overnight windows** where `close < open`
(e.g. `{ open: "20:00", close: "04:00" }` means open until 4 AM the next day — so a check at
2 AM Tuesday must also consider Monday's window).

```ts
import { DAY_NAMES, isOpen24Hours, type BusinessHours, type DayHours } from './hours';

export type OpenStatus = {
  openNow: boolean;
  /** Short human label, e.g. "Open 24 hours", "Open · closes 10:00 PM", "Closed · opens 8:00 AM" */
  label: string;
} | null;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Current { dayIndex (0=Sunday), minutes } in the given IANA timezone. */
function localNow(timeZone: string, now: Date): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23', // avoids the "24:00" bug of hour12:false
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dayIndex, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function getOpenStatus(
  hours: BusinessHours | undefined,
  timeZone: string,
  now: Date = new Date(),
): OpenStatus {
  if (!hours) return null;
  const { dayIndex, minutes } = localNow(timeZone, now);
  const today: DayHours | undefined = hours[DAY_NAMES[dayIndex]];
  const yesterday: DayHours | undefined = hours[DAY_NAMES[(dayIndex + 6) % 7]];

  // Spillover from yesterday's overnight window (e.g. open 20:00, close 04:00)
  if (yesterday && !yesterday.closed && !isOpen24Hours(yesterday)) {
    const yOpen = toMinutes(yesterday.open);
    const yClose = toMinutes(yesterday.close);
    if (yClose < yOpen && minutes < yClose) {
      return { openNow: true, label: `Open · closes ${to12h(yesterday.close)}` };
    }
  }

  if (today && !today.closed) {
    if (isOpen24Hours(today)) return { openNow: true, label: 'Open 24 hours' };
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    const inWindow = close < open ? minutes >= open : minutes >= open && minutes < close;
    if (inWindow) return { openNow: true, label: `Open · closes ${to12h(today.close)}` };
    if (minutes < open) return { openNow: false, label: `Closed · opens ${to12h(today.open)}` };
  }

  // Closed for the rest of today — find the next day with an opening
  for (let i = 1; i <= 7; i++) {
    const d = hours[DAY_NAMES[(dayIndex + i) % 7]];
    if (d && !d.closed) {
      const dayLabel = i === 1 ? 'tomorrow' : DAY_NAMES[(dayIndex + i) % 7][0].toUpperCase() + DAY_NAMES[(dayIndex + i) % 7].slice(1);
      const openLabel = isOpen24Hours(d) ? '12 AM' : to12h(d.open);
      return { openNow: false, label: `Closed · opens ${openLabel} ${dayLabel}` };
    }
  }
  return { openNow: false, label: 'Closed' };
}
```

### 2.4 New query helpers in `lib/data.ts`

Add (keep the existing code style — `getDb()`, `COLLECTIONS`, `clean*` helpers):

```ts
export async function getBusinessCount(): Promise<number> {
  const db = await getDb();
  return db.collection(COLLECTIONS.businesses).countDocuments();
}

/** Highest-rated businesses with a meaningful number of reviews, for the homepage. */
export async function getTopRatedBusinesses(limit = 6): Promise<Business[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTIONS.businesses)
    .find({ rating: { $gte: 4.5 }, reviewCount: { $gte: 10 } })
    .sort({ rating: -1, reviewCount: -1 })
    .limit(limit)
    .toArray();
  return cleanAllBusinesses(docs as never);
}

/** Cities ordered by number of listed businesses (for "popular cities" chips). */
export async function getPopularCities(limit = 8): Promise<City[]> {
  const counts = await getBusinessCountsByCity(); // already exists in this file
  const cities = await getAllCities();
  return cities
    .map((c) => ({ city: c, count: counts.get(`${c.slug}:${c.state}`) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => x.city);
}
```

### Acceptance criteria — Phase 1
- [ ] `lib/geo.ts`, `lib/timezones.ts`, `lib/open-now.ts` exist; `lib/nearby.ts` imports from `lib/geo.ts`.
- [ ] `getOpenStatus` returns `null` for missing hours; correct results for a 24/7 business,
      a normal window, an overnight window checked after midnight, and a `closed: true` day.
- [ ] `npx tsc --noEmit` passes.

---

## 3. Phase 2 — `GET /api/nearby` route handler

**New file:** `app/api/nearby/route.ts`. Follow the exact conventions of
`app/api/search/route.ts` (`export const runtime = 'nodejs'`, `NextRequest`, try/catch
returning an empty payload on failure).

**Request:** `GET /api/nearby?lat=<number>&lng=<number>&limit=<1..10, default 5>`

**Behavior:**
1. Validate `lat`/`lng` with `isValidLatLng` from `lib/geo.ts`. On invalid input return
   `NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })`.
2. Load `getAllCities()` and `getAllBusinesses()` (both exist in `lib/data.ts`).
3. Build a map of city slug → city. Compute each city's distance from the user with
   `haversineMiles`, skipping cities where `isValidLatLng(city.lat, city.lng)` is false.
4. For each business, its distance = its city's distance (businesses have no own
   coordinates). Skip businesses whose city has no valid coordinates.
5. For each business compute `openStatus = getOpenStatus(biz.hours, timezoneForStateCode(biz.stateCode))`.
6. Sort: open businesses first (`openNow === true` before everything else; `null`/unknown
   hours rank between open and closed), then by ascending distance, then descending rating.
7. Return the top `limit` businesses plus the single nearest city:

```ts
export type NearbyBusiness = {
  slug: string;          // → link to `/business/${slug}/`
  name: string;
  phone: string;         // for tel: link
  phoneDisplay: string;
  rating: number;
  reviewCount: number;
  cityName: string;      // display, e.g. "Dallas"
  stateCode: string;     // e.g. "TX"
  distanceMiles: number; // rounded to 1 decimal
  openNow: boolean | null;
  openLabel: string | null;
  photo: string | null;  // biz.photos?.[0] ?? null
};

export type NearbyResponse = {
  results: NearbyBusiness[];
  nearestCity: { name: string; href: string; distanceMiles: number } | null;
  // nearestCity.href = `/${city.state}/${city.slug}/`
};
```

8. This response depends on the current time and user location → it must NOT be cached.
   Return it with `headers: { 'Cache-Control': 'no-store' }`.

**Manual test (requires `MONGODB_URI`):**
`curl 'http://localhost:3000/api/nearby?lat=32.7767&lng=-96.797'` → Dallas businesses first,
each with `distanceMiles` near 0 and a sensible `openLabel`.
`curl 'http://localhost:3000/api/nearby?lat=999&lng=0'` → HTTP 400.

### Acceptance criteria — Phase 2
- [ ] Route exists, validates input, returns the shape above, `Cache-Control: no-store`.
- [ ] Open businesses sort before closed ones regardless of distance.
- [ ] Businesses in `lat:0,lng:0` cities never appear. `npm run build` passes.

---

## 4. Phase 3 — `NearMeFinder` client component

**New file:** `components/NearMeFinder.tsx`, marked `'use client'`. Model its structure on
`components/SearchBar.tsx` (the existing client-component example in this repo).

**States (single `useState` discriminated union or equivalent):**
- `idle` — show only the CTA button.
- `locating` — user tapped, waiting on browser geolocation. Button shows a spinner +
  "Getting your location…" and is disabled.
- `loading` — coordinates acquired, `/api/nearby` request in flight. Show 3 skeleton cards
  (pulsing gray blocks) where results will render, so the layout doesn't jump.
- `results` — render the results panel (below).
- `error` — render a friendly message + recovery path (below).

**CTA button (idle):** full-width on mobile (`w-full sm:w-auto`), large tap target
(`min-h-12 px-8 py-3.5`), `bg-blue-700 hover:bg-blue-600` (matches existing hero buttons),
`rounded-lg font-semibold`, with the `LocateFixed` icon from `lucide-react`.
Label: **"Find Tire Repair Near Me"**.

**Geolocation call:**

```ts
if (!('geolocation' in navigator)) { /* → error state: 'unsupported' */ }
navigator.geolocation.getCurrentPosition(onSuccess, onError, {
  enableHighAccuracy: false,  // city-level accuracy is enough; faster + saves battery
  timeout: 10_000,
  maximumAge: 300_000,
});
```

`onSuccess` → `fetch('/api/nearby?lat=' + coords.latitude + '&lng=' + coords.longitude)`.

**Error handling (each with a distinct message):**
- `PERMISSION_DENIED` → "Location access was denied. Search for your city instead:" and
  render the popular-city chips passed in via props (see below) so the user still has a path.
- `POSITION_UNAVAILABLE` / `TIMEOUT` → "We couldn't get your location. Try again or search
  for your city below." with a "Try again" button that restarts the flow.
- Fetch/API failure → same generic retry message.
- Never show a raw error object or stack to the user.

**Props:** `popularCities: { name: string; href: string }[]` — passed from the server
component homepage so the fallback path needs no extra fetch.

**Results panel (`results` state):**
- Heading: "Closest options to you" + a subtle "Sorted by open now, then distance" line.
- One card per result (max 5), stacked vertically, each card containing:
  - Row 1: business name (link to `/business/${slug}/`) + open badge on the right —
    green `Open · closes 10 PM` / slate `Closed · opens 8 AM` / nothing when `openNow === null`.
    Reuse the visual style of `components/listing/StatusBadge.tsx` (don't import it as-is;
    it has hardcoded labels — create a tiny inline badge or extend it with a `label` prop).
  - Row 2: `{distanceMiles} mi · {cityName}, {stateCode}` and star rating
    `★ 4.8 (142)` in the same style as `components/BusinessCard.tsx`.
  - Row 3: a prominent full-width call button:
    `<a href={'tel:' + phone}>` with the `Phone` lucide icon and text `Call {phoneDisplay}`,
    styled like the primary CTA (`bg-blue-700 ... min-h-11`). This is the #1 conversion
    action — make it the most visually dominant element of each card.
- Below the cards: link "See all providers in {nearestCity.name} →" to `nearestCity.href`.
- If `results` is empty: "No listed providers near you yet. Browse by state below." +
  popular city chips.

**Accessibility:** the results container gets `aria-live="polite"` so screen readers
announce results; the CTA button gets `aria-busy` while locating/loading; all interactive
elements keyboard-focusable with visible focus rings.

### Acceptance criteria — Phase 3
- [ ] All five states render correctly; permission-denied shows the city-chip fallback.
- [ ] Call buttons are `tel:` anchors with ≥44px tap height.
- [ ] Component receives all display data via props/API — no direct DB imports (it's a client component).
- [ ] `npm run build` passes.

---

## 5. Phase 4 — Homepage redesign (`app/page.tsx`)

Rewrite the homepage with the section order below. Keep `export const revalidate = 3600`,
`SchemaOrg` usage, and `homeMetadata()`. All sections are server-rendered except the
`NearMeFinder` island. Mobile-first: design for 375px width, then enhance at `sm:`/`md:`.

Server data to fetch in the page (in one `Promise.all`): `getAllStates()`, `getAllCities()` +
existing indexability filter, `getBusinessCount()`, `getTopRatedBusinesses(6)`,
`getPopularCities(8)`, `getAllServices()`.

### 5.1 Hero (replaces current hero)
- Keep `bg-slate-900 text-white`, generous vertical padding (`py-14 sm:py-20`).
- `<h1>`: **"Find the Best Mobile Tire Repair Near Me"** (`text-3xl sm:text-5xl` — slightly
  smaller than today on mobile so the CTA is visible without scrolling).
- Subhead (1 line): "Compare trusted technicians who come to you — sorted by who's open
  right now and closest to your location."
- `<NearMeFinder popularCities={...} />` — the primary CTA.
- Divider text "or browse a city" followed by **popular city chips**: server-rendered
  `<Link>` pills (`bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm`)
  for the 8 cities from `getPopularCities`, horizontally wrapping. These replace the current
  wall of state buttons (states move to section 5.6).
- Small trust line under the chips with lucide icons: `ShieldCheck` "Verified listings" ·
  `Clock` "24/7 options" · `MapPin` "{cityCount}+ cities". Single row, `text-slate-400 text-xs`.

### 5.2 "How it works" (new)
Three steps in a `grid grid-cols-1 sm:grid-cols-3 gap-4`, white cards on `bg-slate-50`.
Each: lucide icon in a colored circle, bold title, one sentence.
1. `LocateFixed` — "Share your location" — "Or search your city. We find every mobile tire tech near you."
2. `Clock` — "Compare who's open now" — "See ratings, hours, and distance at a glance."
3. `Phone` — "Call — they come to you" — "No tow truck. The technician drives to your car."

### 5.3 Live stats strip (replaces current trust badges)
Same `<dl>` pattern as the current homepage but with **dynamic values**: Cities covered
(`cities.length`), Listed businesses (`getBusinessCount()` — replaces the hardcoded "46+"),
States (`states.length`). Keep it one compact row (3 columns even on mobile, `text-2xl`).

### 5.4 Top-rated businesses (new)
- Heading: "Top-rated mobile tire techs".
- Render the 6 businesses from `getTopRatedBusinesses(6)`.
- Mobile: horizontal scroll-snap row (`flex overflow-x-auto snap-x snap-mandatory gap-4
  -mx-4 px-4 scrollbar-hide`, cards `snap-start shrink-0 w-72`). Desktop (`md:`): 3-column grid.
- Card content: photo (if `biz.photos?.[0]`, via `next/image` with `sizes="288px"`,
  fixed `h-36` cover), name (link to `/business/${slug}/`), `★ rating (reviewCount)` in the
  `BusinessCard.tsx` style, city + state, and a small `tel:` call link.
- Build this as a new server component `components/home/TopRatedBusinesses.tsx` that takes
  `businesses: Business[]`.

### 5.5 Services explained (new)
Heading "What mobile tire techs can do". Three white cards (one per service from
`getAllServices()`): lucide icon (`Wrench` for mobile-tire-repair, `CircleDot` for
flat-tire-repair, `Disc3` for tire-installation), `service.name`, `service.description`
clamped to 3 lines. Not linked (service pages only exist per-city).

### 5.6 Browse by state — mobile accordion (replaces current 3-column grid)
Keep every existing link (SEO), but collapse on mobile using **native
`<details>`/`<summary>`** (no JS, links stay in the server-rendered HTML):

```tsx
<details className="group border border-slate-200 rounded-lg bg-white md:open:pb-2" open={/* only on md via CSS, see below */}>
  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-slate-900">
    {state.name}
    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
  </summary>
  {/* city links exactly as today */}
</details>
```

Note: the `open` attribute can't be responsive via CSS alone — keep all `<details>` closed by
default on every viewport (acceptable), OR render a 3-column always-open grid at `md:` and
the accordion below `md:` using two markup blocks with `hidden md:grid` / `md:hidden`.
Prefer the second option; the duplicated links are fine (same DOM page, one visible at a time).

### 5.7 FAQ (new)
Reuse `components/FAQSection.tsx` with 5 hardcoded general FAQs defined as a `const` in
`app/page.tsx` (write practical, non-spammy answers, 2–3 sentences each):
1. "How much does mobile tire repair cost?"
2. "How fast can a mobile tire technician get to me?"
3. "Do mobile tire services operate at night or on weekends?"
4. "Can they replace a tire on-site or only patch it?"
5. "Is mobile tire repair more expensive than a tire shop?"

Also render `<SchemaOrg data={buildFAQSchema(faqs)} />` (`buildFAQSchema` already exists in
`lib/schema.ts`).

### 5.8 Sticky mobile CTA bar (new)
New client component `components/home/StickyCallToAction.tsx` (`'use client'`), rendered
last in the homepage:
- `fixed bottom-0 inset-x-0 z-40 md:hidden`, white background, top border, safe-area padding
  (`pb-[env(safe-area-inset-bottom)]`), containing one full-width button
  "Find Tire Repair Near Me" that scrolls smoothly to the hero finder
  (`document.getElementById('near-me-finder')?.scrollIntoView({ behavior: 'smooth' })` —
  give the `NearMeFinder` wrapper that id).
- Hidden until the user scrolls past the hero: observe a sentinel element at the end of the
  hero with `IntersectionObserver`; show the bar only when the sentinel is out of view.
  Animate with `translate-y` + `transition-transform duration-200`.
- Respect `prefers-reduced-motion`: use `scrollIntoView()` without smooth behavior when
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- Add `pb-20 md:pb-0` to the homepage's last section so the bar never covers content
  (design-system rule: no content hidden behind fixed bars).

### 5.9 Metadata tweak
In `lib/seo.ts` → `homeMetadata()`, update the title to
`'Mobile Tire Repair Near Me — Find Open Techs Fast | MobileTireRepair24'` and adjust the
description to mention "open now" and "sorted by distance". Do not change other functions.

### Acceptance criteria — Phase 4
- [ ] Section order on mobile: hero+finder → how it works → stats → top rated → services →
      states accordion → FAQ → footer, with the sticky bar appearing after hero scroll.
- [ ] Every state and city link from the old homepage still exists in the server-rendered HTML
      (view-source check, not just DevTools).
- [ ] Stats show real DB counts (no hardcoded "46+").
- [ ] No horizontal page scroll at 375px (the scroll-snap row scrolls internally only).
- [ ] FAQ schema is present once; `npm run build` passes.

---

## 6. Phase 5 — Data pipeline: real business coordinates (enhancement, do last)

Currently distance uses city-center coordinates. Make future data precise:

1. In `lib/data.ts`, add optional fields to `Business`: `lat?: number; lng?: number;`.
2. In `lib/places-fetch.ts`:
   - Add `'places.location'` to `FIELD_MASK`.
   - Add `location?: { latitude: number; longitude: number }` to the `PlaceResult` type.
   - In `toBusiness()`, spread in
     `...(place.location ? { lat: place.location.latitude, lng: place.location.longitude } : {})`.
   - Bump the Text Search cache key suffix in `fetchBusinessesFromPlaces` from `-photos` to
     `-photos-loc` (the comment there explains why: old cached responses lack the new field).
3. In `app/api/nearby/route.ts`, prefer the business's own coordinates when
   `isValidLatLng(biz.lat ?? 0, biz.lng ?? 0)`, falling back to city coordinates otherwise.
4. Do NOT attempt to backfill existing records in this task; the city-center fallback covers
   them, and the admin "Fetch businesses" flow will upsert coordinates over time.

### Acceptance criteria — Phase 5
- [ ] `npm run build` passes; `/api/nearby` still works for businesses without coordinates.
- [ ] A dry-run of the fetch logic type-checks (no need to call the Places API).

---

## 7. Final verification checklist

1. `npm run build` succeeds (or, without `MONGODB_URI`, `npx tsc --noEmit` succeeds and this
   limitation is reported).
2. With a dev server + DB: `curl` the two `/api/nearby` cases from Phase 2.
3. In a browser at 375px width (device emulation):
   - Tap the CTA with a mocked location (DevTools → Sensors → e.g. Dallas 32.7767, -96.797):
     results appear, open businesses first, call buttons work as `tel:` links.
   - Block geolocation permission: the denied-state fallback with city chips appears.
   - Scroll: sticky bar appears after the hero and its button scrolls back to the finder.
   - The state accordion expands/collapses; all links navigate with trailing slashes.
4. Keyboard-only pass: every interactive element reachable, focus visible.
5. Design-system checklist at the bottom of `design-system/mobiltirerepair24/MASTER.md`.

## Out of scope (do not build)

- Maps or map pins (no map dependency exists; do not add one).
- Reverse geocoding / IP-based location (browser geolocation + city fallback only).
- Reviews, booking, quotes, accounts, or any new admin UI.
- Changing city/state/business/service page layouts (homepage + shared libs + API only).
- Enabling `cacheComponents`, adding CSS frameworks, or new runtime dependencies.
