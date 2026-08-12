# Google Places Fetcher — User Manual

The Google Places fetcher searches Google’s **Places API (New)** for mobile tire repair businesses in your target cities and saves them directly to MongoDB. You can run it from the **admin UI** or the **command line**.

---

## What it does (in one sentence)

For each city in your database, it runs a Google search like *“mobile tire repair in Dallas, TX”*, filters the results, converts them into business records, and **creates or updates** them in MongoDB. Cities with fewer existing businesses are processed first so empty coverage fills before cities that already have listings. When a listing has no photos yet, the fetcher downloads one Google Places photo and re-hosts it on S3 for the listing card/gallery.

---

## Prerequisites

Before running a fetch, you need:

| Requirement | Details |
|---|---|
| **Google Maps API key** | Set `GOOGLE_MAPS_API_KEY` in `.env.local` |
| **Places API (New) enabled** | In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → enable **Places API (New)** (not the legacy Places API) |
| **Billing enabled** | Google charges per Text Search and Place Photo request |
| **MongoDB** | `MONGODB_URI` must be set and reachable |
| **Cities in the database** | The fetcher reads cities from MongoDB — add them first at `/admin/cities` |
| **AWS S3 (for photos)** | `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (and optional `AWS_REGION`). Without S3, businesses still import but photos are skipped. |

If no cities exist, the fetch fails with: *“No cities in database — add cities in admin first”*.

---

## Recommended workflow

1. **Add cities** at `/admin/cities` (slug, name, state, state code, etc.).
2. **Log in** to admin at `/admin/login`.
3. **Dry run first** — preview results without writing to the database.
4. **Fetch & save** when the preview looks good.
5. **Review** businesses at `/admin/businesses` and edit as needed.

---

## Method 1: Admin UI (easiest)

Go to **`/admin/businesses`**. At the top you’ll see the **“Fetch from Google Places”** panel.

### Fields

| Field | What it does |
|---|---|
| **City slugs (optional)** | Comma-separated slugs, e.g. `dallas, houston`. Leave empty to fetch **all** cities in the database. |
| **Pages per city** | How many result pages to request per city (1 = up to ~20, 2 = ~40, 3 = ~60). |
| **Dry run** | When checked, fetches and shows stats but **does not write** to MongoDB. |

### Buttons

- **Preview fetch** (dry run on) — safe test run
- **Fetch & save to database** (dry run off) — writes to MongoDB

### After a successful fetch

You’ll see:

- Total businesses found
- Created vs updated counts
- Photos added
- API calls vs cache hits
- Per-city breakdown (e.g. `Dallas, TX: 12`)

The business list refreshes automatically after a non–dry-run fetch.

---

## Method 2: Command line

From the project root:

```bash
npm run fetch:businesses
```

### CLI flags

| Flag | Example | Description |
|---|---|---|
| `--cities` | `--cities dallas,houston` | Limit to specific city slugs |
| `--pages` | `--pages 2` | Pages per city (1–3, default `1`) |
| `--dry-run` | `--dry-run` | Preview only, no DB writes |
| `--no-cache` | `--no-cache` | Force fresh API calls (ignore cache) |

### Examples

```bash
# All cities, 1 page each
npm run fetch:businesses

# Specific cities only
npx tsx scripts/fetch-businesses.ts --cities dallas,houston

# More results per city
npx tsx scripts/fetch-businesses.ts --pages 3

# Preview without saving
npx tsx scripts/fetch-businesses.ts --dry-run

# Force fresh Google API calls
npx tsx scripts/fetch-businesses.ts --no-cache
```

The CLI loads env from `.env.local` and `.env` automatically.

---

## Method 3: HTTP API (programmatic)

**Endpoint:** `POST /api/admin/businesses/fetch`  
**Auth:** Requires an admin session cookie (same as other `/api/admin/*` routes).

**Request body (JSON):**

```json
{
  "cities": "dallas,houston",
  "citySlugs": ["dallas", "houston"],
  "maxPages": 2,
  "useCache": true,
  "dryRun": false
}
```

- Use either `cities` (comma-separated string) or `citySlugs` (array).
- Omit both to fetch all cities.

**Success response:**

```json
{
  "success": true,
  "dryRun": false,
  "citiesProcessed": 2,
  "businessesFound": 24,
  "created": 18,
  "updated": 6,
  "photosAdded": 15,
  "apiCalls": 17,
  "cacheHits": 0,
  "cityResults": [
    { "city": "Dallas", "stateCode": "TX", "count": 12 },
    { "city": "Houston", "stateCode": "TX", "count": 12 }
  ]
}
```

---

## How it works internally

```mermaid
flowchart TD
    A[Start] --> B[Load cities from MongoDB]
    B --> C{City slugs specified?}
    C -->|Yes| D[Filter to matching cities]
    C -->|No| E[Use all cities]
    D --> S[Sort by existing business count ascending]
    E --> S
    S --> F[For each city — empty cities first...]
    F --> G["Google Text Search: mobile tire repair in {city}, {stateCode}"]
    G --> H{Cache hit?}
    H -->|Yes| I[Use cached JSON]
    H -->|No| J[Call Places API]
    J --> K[Save response to temp cache]
    I --> L[Filter & dedupe results]
    K --> L
    L --> M[Convert to Business record]
    M --> N{Dry run?}
    N -->|No| O[ensureBusinessLocation]
    O --> PH{Listing missing photos?}
    PH -->|Yes| PI[Fetch Place Photo + re-host to S3]
    PH -->|No| U[upsertBusiness]
    PI --> U
    N -->|Yes| P[Count only]
    U --> Q[Next place / next page / next city]
    P --> Q
    Q --> R[Return summary stats]
```

### Search query

For each city, the query is always:

```
mobile tire repair in {city.name}, {city.stateCode}
```

Example: `mobile tire repair in Dallas, TX`

### Relevance filter

A place is **kept** only if all of these are true:

1. **Operational** — `businessStatus` is `OPERATIONAL` (or missing)
2. **Has a phone** — national or international number present
3. **Tire/mobile related** — name or types match patterns like:
   - Name contains `tire`, `tyre`, or `mobile`
   - Types include `tire`, `car_repair`, or `auto`

### Deduplication

Places are deduplicated by Google Place ID across all cities in one run. The same business won’t be inserted twice.

### Pagination

- Up to **3 pages** per city (hard cap)
- **2 second delay** between pages (Google requirement for `nextPageToken`)
- Each page returns up to ~20 results

---

## What gets saved for each business

| Field | Source |
|---|---|
| `id` | `g-{googlePlaceId}` |
| `slug` | Generated from name + city slug + state code |
| `name`, `phone`, `address` | Google Places |
| `phoneDisplay` | National phone format from Google |
| `city`, `state`, `stateCode` | From the city being searched |
| `services` | Inferred from name (always includes `mobile-tire-repair`, `flat-tire-repair`; may add `tire-installation`) |
| `areasServed` | `[city.name]` |
| `description` | Auto-generated template text |
| `rating`, `reviewCount` | Google |
| `website` | Google (if available) |
| `hours` | Google opening hours (if available). **24/7** places are encoded by Google as a single period with `open` at Sunday 00:00 and **no** `close` field — we map that to every day `00:00–23:59`. |
| `photos` | First Google Places photo, re-hosted to S3 (only when the listing has no photos yet). Skipped if S3 is not configured or the place has no photos. |

### Hours repair

If an earlier import showed **Sunday only 00:00–23:59** and Closed Mon–Sat for 24/7 businesses, repair with:

```bash
npx tsx scripts/fix-hours.ts --file businesses.fetched.json
npx tsx scripts/fix-hours.ts --db   # after setting MONGODB_URI
```

Add `--dry-run` to preview counts without writing.

The site also **self-heals** on read: listing pages normalize and persist corrected hours. Admins can click **Repair 24/7 hours** on `/admin/businesses`, or `POST /api/admin/businesses/fix-hours`.

### Listing photos

For each kept place that has a Places photo:

1. Resolve the photo resource via Place Photos (New) (`…/media?maxWidthPx=1024&skipHttpRedirect=true`)
2. Download the image and re-host it to S3 (`business-photos/{slug}-mobile-tire-repair-1.jpg`)
3. Set `photos: [s3Url]` on the business

Existing photos are **not** overwritten. Re-runs only backfill listings that still have an empty `photos` array.

### Upsert behavior

- Match key: **`slug`**
- **Same slug exists** → record is **updated** (`$set` overwrites fields present on the fetch payload)
- **New slug** → record is **inserted**
- Runs are **non-destructive**: businesses not returned by Google are **not deleted**
- Existing `photos` are preserved when the listing already has images

### Location records

Before saving each business, `ensureBusinessLocation`:

- Creates the **state** record if missing
- Creates the **city** record if missing (with placeholder lat/lng `0,0`)
- Adds the city to the state’s `cities` array

So fetched businesses can create location records even if you didn’t add the city manually first — but you should still add cities properly in `/admin/cities` so search queries use correct names and state codes.

---

## Response caching

API responses are cached on disk to avoid repeat billing:

- **Location:** OS temp directory → `{tmpdir}/mobiltirerepair24-places-cache/`
- **Filename:** `{city-slug}-{state-code}-p{page}-photos.json` (e.g. `dallas-tx-p1-photos.json`)
- **Default:** cache is **on** (UI and CLI)
- **Bypass:** CLI `--no-cache`, or API `"useCache": false`

Cache hits show in stats as `cacheHits`. Re-running the same cities/pages within the same environment reuses cached Text Search responses. Place Photo media downloads are **not** cached (they only run when a listing still needs a photo).

To clear cache: delete the folder `{tmpdir}/mobiltirerepair24-places-cache/` (on Windows, often something like `C:\Users\{you}\AppData\Local\Temp\mobiltirerepair24-places-cache`).

---

## API cost estimate

Each **uncached** city page = **1 Text Search request**. Each listing that needs a photo adds **1 Place Photo** request.

| Scenario | Approx. API calls |
|---|---|
| 10 cities, 1 page each (search only) | 10 |
| 10 cities, 1 page each + 12 new photos | 10 + 12 |
| 10 cities, 3 pages each | 30 (+ photos as needed) |
| Re-run with cache, all listings already have photos | 0 Text Search (cache) + 0 photos |

Check current pricing: [Google Maps Platform — Places API](https://developers.google.com/maps/billing-and-pricing/pricing#places-pricing).

---

## Troubleshooting

| Error / symptom | Likely cause | Fix |
|---|---|---|
| `GOOGLE_MAPS_API_KEY is not set` | Missing env var | Add key to `.env.local` |
| `Places API 403` | API not enabled or key restricted | Enable **Places API (New)**; check key restrictions |
| `Places API 429` | Quota exceeded | Wait, raise quota, or reduce cities/pages |
| `No cities in database` | Empty cities collection | Add cities at `/admin/cities` |
| `No cities matched: dallas` | Wrong slug | Check slug in admin (e.g. `dallas` not `Dallas`) |
| `Unauthorized` (API) | Not logged in | Log in at `/admin/login` first |
| Few or zero results | Strict filters or sparse area | Try `--pages 2` or `--pages 3`; verify city name/state |
| Same data every run | Cache | Use `--no-cache` for fresh results |

---

## Related: JSON import (separate path)

There is also `data/businesses.fetched.json` and an import script — this is **not** part of the live fetcher. The current fetcher writes **directly to MongoDB**, not to that file.

To import from a JSON file instead:

```bash
npm run import:businesses -- --file businesses.fetched.json
```

Use that only if you have a pre-built JSON array of businesses (manual export, older workflow, etc.).

---

## Quick reference

| Task | Command / action |
|---|---|
| Add target cities | `/admin/cities` |
| Preview fetch | Admin UI → check **Dry run** → **Preview fetch** |
| Save to database | Admin UI → **Fetch & save to database** |
| Fetch all cities (CLI) | `npm run fetch:businesses` |
| Fetch specific cities | `npx tsx scripts/fetch-businesses.ts --cities dallas,houston` |
| Force fresh API data | Add `--no-cache` |
| Review/edit results | `/admin/businesses` |

---

## Source files

| File | Role |
|---|---|
| `lib/places-fetch.ts` | Core fetch logic, empty-city-first ordering, photo attach, filtering, caching, upsert |
| `lib/data.ts` | City counts (`getBusinessCountsByCity`) and photo lookup (`getBusinessPhotos`) |
| `lib/s3.ts` (`reHostPhotosToS3`) | Download + resize + upload listing images to S3 |
| `scripts/fetch-businesses.ts` | CLI entry point |
| `app/api/admin/businesses/fetch/route.ts` | Admin API endpoint |
| `components/admin/BusinessFetcher.tsx` | Admin UI panel |
