import { NextResponse } from 'next/server';
import { getDb, COLLECTIONS } from '@/lib/db';
import { fixMisencodedHours, type BusinessHours } from '@/lib/hours';
import type { Business } from '@/lib/data';

/**
 * Permanently rewrite misencoded 24/7 hours in MongoDB.
 * Protected by admin middleware.
 */
export async function POST() {
  try {
    const db = await getDb();
    const docs = (await db
      .collection(COLLECTIONS.businesses)
      .find({})
      .toArray()) as unknown as Business[];

    let updated = 0;

    for (const doc of docs) {
      if (!doc.hours || !doc.slug) continue;
      const repaired = fixMisencodedHours(doc.hours as BusinessHours);
      if (!repaired) continue;
      if (JSON.stringify(repaired) === JSON.stringify(doc.hours)) continue;

      await db
        .collection(COLLECTIONS.businesses)
        .updateOne({ slug: doc.slug }, { $set: { hours: repaired } });
      updated++;
    }

    return NextResponse.json({
      ok: true,
      scanned: docs.length,
      updated,
    });
  } catch (error) {
    console.error('Error fixing business hours:', error);
    return NextResponse.json({ error: 'Failed to fix business hours' }, { status: 500 });
  }
}
