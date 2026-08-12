'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function SeedGeographyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRun = async () => {
    const confirmed = window.confirm(
      'Upsert all states and cities from the bundled JSON files into MongoDB?\n\nBusinesses will not be changed.',
    );
    if (!confirmed) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/seed/geography', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed geography');
      }
      setMessage(data.message || `Upserted ${data.states} states and ${data.cities} cities.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed geography');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Seed Geography</h2>
      <p className="text-sm text-gray-600 mb-4">
        Load states and main cities from <code className="text-xs bg-gray-100 px-1 rounded">data/states.json</code> and{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">data/cities.json</code> into MongoDB. Existing business
        records are left alone.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm">{message}</div>
      )}

      <Button type="button" onClick={handleRun} disabled={loading} variant="primary">
        {loading ? 'Seeding…' : 'Run geography seed'}
      </Button>
    </div>
  );
}
