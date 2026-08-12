import { NextResponse } from 'next/server';
import { upsertGeographyFromJson } from '@/lib/seed-geography';
import { ensureDbIndexes } from '@/lib/db';

/**
 * Upsert states + cities from data/*.json into MongoDB.
 * Does not delete or modify businesses.
 * Protected by admin middleware.
 */
export async function POST() {
  try {
    await ensureDbIndexes();
    const result = await upsertGeographyFromJson();
    return NextResponse.json({
      success: true,
      message: `Upserted ${result.states} states and ${result.cities} cities from JSON.`,
      ...result,
    });
  } catch (error) {
    console.error('Geography seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed geography' },
      { status: 500 },
    );
  }
}
