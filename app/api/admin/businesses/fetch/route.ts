import { NextRequest, NextResponse } from 'next/server';
import { fetchBusinessesFromPlaces } from '@/lib/places-fetch';
import { ensureDbIndexes } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const citySlugs = Array.isArray(body.citySlugs)
      ? (body.citySlugs as string[]).filter(Boolean)
      : typeof body.cities === 'string'
        ? body.cities.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined;
    const maxPages = typeof body.maxPages === 'number' ? body.maxPages : 1;
    const useCache = body.useCache !== false;
    const dryRun = body.dryRun === true;

    await ensureDbIndexes();

    const result = await fetchBusinessesFromPlaces({
      citySlugs,
      maxPages,
      useCache,
      dryRun,
    });

    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
    });
  } catch (error) {
    console.error('Business fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch businesses' },
      { status: 500 },
    );
  }
}
