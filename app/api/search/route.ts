import { NextRequest, NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/db';

export const runtime = 'nodejs';

export type SearchResult = {
  type: 'business' | 'city' | 'state';
  label: string;
  sublabel: string;
  href: string;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse "city, state" or "city TX" → { cityQuery, stateFilter }
// Only splits when there's a comma, or the last token is exactly 2 letters (state code).
// This prevents "san antonio" from being incorrectly split.
function parseQuery(q: string): { cityQuery: string; stateFilter: string | null } {
  const hasComma = q.includes(',');
  const normalized = q.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = normalized.split(' ');
  const last = parts[parts.length - 1];

  if (parts.length > 1 && (hasComma || /^[a-zA-Z]{2}$/.test(last))) {
    return { cityQuery: parts.slice(0, -1).join(' '), stateFilter: last };
  }
  return { cityQuery: normalized, stateFilter: null };
}

function formatCitySlug(slug: string) {
  return slug.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const db = await getDb();
    const { cityQuery, stateFilter } = parseQuery(q);
    const safeQ = escapeRegex(q);
    const safeState = stateFilter ? escapeRegex(stateFilter) : null;

    const [states, citiesAtlas, citiesByState, businesses] = await Promise.all([
      // 1. State: match full name (partial) or exact code
      db
        .collection(COLLECTIONS.states)
        .find(
          {
            $or: [
              { name: { $regex: safeQ, $options: 'i' } },
              { code: { $regex: `^${safeQ}$`, $options: 'i' } },
            ],
          },
          { projection: { name: 1, slug: 1, code: 1, _id: 0 } }
        )
        .limit(2)
        .toArray(),

      // 2. City name search, with optional state filter
      db
        .collection(COLLECTIONS.cities)
        .find(
          {
            name: { $regex: escapeRegex(cityQuery), $options: 'i' },
            ...(safeState
              ? {
                  $or: [
                    { state: { $regex: safeState, $options: 'i' } },
                    { stateCode: { $regex: `^${safeState}$`, $options: 'i' } },
                  ],
                }
              : {}),
          },
          { projection: { name: 1, state: 1, stateCode: 1, slug: 1, _id: 0 } }
        )
        .limit(5)
        .toArray(),

      // 3. Cities by state: when query is a state name or code, surface top cities
      db
        .collection(COLLECTIONS.cities)
        .find(
          {
            $or: [
              { state: { $regex: `^${safeQ}$`, $options: 'i' } },
              { stateCode: { $regex: `^${safeQ}$`, $options: 'i' } },
            ],
          },
          { projection: { name: 1, state: 1, stateCode: 1, slug: 1, _id: 0 } }
        )
        .limit(4)
        .toArray(),

      // 4. Business name search
      db
        .collection(COLLECTIONS.businesses)
        .find(
          { name: { $regex: safeQ, $options: 'i' } },
          { projection: { name: 1, city: 1, stateCode: 1, slug: 1, _id: 0 } }
        )
        .limit(5)
        .toArray(),
    ]);

    // Merge Atlas + by-state cities, deduplicate by slug
    const seen = new Set<string>();
    const cities: { slug: string; name: string; state: string; stateCode: string }[] = [];
    for (const c of [...citiesAtlas, ...citiesByState] as unknown as { slug: string; name: string; state: string; stateCode: string }[]) {
      if (!seen.has(c.slug)) {
        seen.add(c.slug);
        cities.push(c);
      }
    }

    const results: SearchResult[] = [
      ...states.map((s) => ({
        type: 'state' as const,
        label: s.name,
        sublabel: 'Mobile Tire Repair — All Cities',
        href: `/${s.slug}/`,
      })),
      ...cities.slice(0, 5).map((c) => ({
        type: 'city' as const,
        label: `${c.name}, ${c.stateCode}`,
        sublabel: 'Mobile Tire Repair',
        href: `/${c.state}/${c.slug}/`,
      })),
      ...businesses.map((b) => ({
        type: 'business' as const,
        label: b.name,
        sublabel: `${formatCitySlug(b.city)}, ${b.stateCode}`,
        href: `/business/${b.slug}/`,
      })),
    ];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
