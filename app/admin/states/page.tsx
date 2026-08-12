'use client';

import { useEffect, useState } from 'react';
import { State } from '@/lib/data';
import StateForm from '@/components/admin/StateForm';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/admin/states');
      if (!response.ok) throw new Error('Failed to fetch states');
      const data = await response.json();
      setStates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch states');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateState = async (state: State) => {
    try {
      const response = await fetch('/api/admin/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create state');
      }

      const newState = await response.json();
      setStates([...states, newState]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateState = async (state: State) => {
    try {
      const response = await fetch('/api/admin/states', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update state');
      }

      const updated = await response.json();
      setStates(states.map((s) => (s.slug === updated.slug ? updated : s)));
      setEditingSlug(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteState = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this state?')) return;

    try {
      const response = await fetch(`/api/admin/states?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete state');
      }

      setStates(states.filter((s) => s.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const editingState = states.find((s) => s.slug === editingSlug);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">States</h1>
        <Button type="button" variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add State'}
        </Button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New State</h2>
          <StateForm onSubmit={handleCreateState} />
        </div>
      )}

      {editingSlug && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit State</h2>
          {editingState && (
            <StateForm
              state={editingState}
              onSubmit={async (state) => {
                await handleUpdateState(state);
              }}
            />
          )}
        </div>
      )}

      {/* States List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {states.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No states yet. Create one to get started.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cities</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state.slug} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{state.name}</td>
                  <td className="px-6 py-4 text-gray-600">{state.code}</td>
                  <td className="px-6 py-4 text-gray-600">{state.cities.length}</td>
                  <td className="px-6 py-4 space-x-2">
                    <Button type="button" variant="soft" size="sm" onClick={() => setEditingSlug(state.slug)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => handleDeleteState(state.slug)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
