'use client';

import { useState } from 'react';

type FetchResult = {
  success: boolean;
  dryRun: boolean;
  citiesProcessed: number;
  businessesFound: number;
  created: number;
  updated: number;
  apiCalls: number;
  cacheHits: number;
  cityResults: Array<{ city: string; stateCode: string; count: number }>;
};

export default function BusinessFetcher({ onComplete }: { onComplete?: () => void }) {
  const [citySlugs, setCitySlugs] = useState('');
  const [maxPages, setMaxPages] = useState(1);
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FetchResult | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/businesses/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities: citySlugs.trim() || undefined,
          maxPages,
          dryRun,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Fetch failed');
      setResult(data);
      if (!dryRun && onComplete) onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Fetch from Google Places</h2>
        <p className="text-sm text-gray-600 mt-1">
          Pulls mobile tire repair businesses and saves them directly to the database.
          Cities with no businesses are fetched first. Add cities in{' '}
          <a href="/admin/cities" className="text-blue-600 hover:underline">
            Cities
          </a>{' '}
          first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City slugs (optional)
          </label>
          <input
            type="text"
            value={citySlugs}
            onChange={(e) => setCitySlugs(e.target.value)}
            placeholder="dallas, houston — leave empty for all"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pages per city</label>
          <select
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={1}>1 (up to 20 results)</option>
            <option value={2}>2 (up to 40 results)</option>
            <option value={3}>3 (up to 60 results)</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Dry run (preview only, no DB writes)
          </label>
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading ? 'Fetching…' : dryRun ? 'Preview fetch' : 'Fetch & save to database'}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      {result && (
        <div className="p-4 bg-gray-50 border rounded-lg text-sm space-y-2">
          <p>
            <strong>{result.dryRun ? 'Preview' : 'Saved'}:</strong>{' '}
            {result.businessesFound} businesses across {result.citiesProcessed} cities
            {!result.dryRun && (
              <> · {result.created} created · {result.updated} updated</>
            )}
          </p>
          <p className="text-gray-600">
            API calls: {result.apiCalls} · cache hits: {result.cacheHits}
          </p>
          {result.cityResults.length > 0 && (
            <ul className="text-gray-600 list-disc list-inside">
              {result.cityResults.map((row) => (
                <li key={`${row.city}-${row.stateCode}`}>
                  {row.city}, {row.stateCode}: {row.count}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
