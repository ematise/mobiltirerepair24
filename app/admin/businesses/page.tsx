'use client';

import { useEffect, useState, useRef } from 'react';
import { Business } from '@/lib/data';
import BusinessFormFull from '@/components/admin/BusinessFormFull';
import BusinessFormJSON from '@/components/admin/BusinessFormJSON';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'json' | 'form'>('json');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    // Scroll to edit form when editing
    if (editingSlug && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingSlug]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/businesses');
      if (!response.ok) throw new Error('Failed to fetch businesses');
      const data = await response.json();
      setBusinesses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (business: Business) => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create business');
      }

      const newBusiness = await response.json();
      setBusinesses([...businesses, newBusiness]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateBusiness = async (business: Business) => {
    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update business');
      }

      const updated = await response.json();
      setBusinesses(businesses.map((b) => (b.slug === updated.slug ? updated : b)));
      setEditingSlug(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteBusiness = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this business?')) return;

    try {
      const response = await fetch(`/api/admin/businesses?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete business');
      }

      setBusinesses(businesses.filter((b) => b.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const editingBusiness = businesses.find((b) => b.slug === editingSlug);

  // Get unique states and cities for filtering
  const uniqueStates = Array.from(new Set(businesses.map((b) => b.state))).sort();
  const uniqueCities = filterState
    ? Array.from(new Set(businesses.filter((b) => b.state === filterState).map((b) => b.city))).sort()
    : [];

  // Filter businesses
  let filteredBusinesses = businesses;
  if (filterState) {
    filteredBusinesses = filteredBusinesses.filter((b) => b.state === filterState);
  }
  if (filterCity) {
    filteredBusinesses = filteredBusinesses.filter((b) => b.city === filterCity);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Add Business'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Create New Business</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Form Type Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setFormType('json')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                formType === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 JSON (API/Automation)
            </button>
            <button
              onClick={() => setFormType('form')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                formType === 'form'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Form (Manual Entry)
            </button>
          </div>

          {/* Forms */}
          {formType === 'json' ? (
            <BusinessFormJSON
              onSubmit={handleCreateBusiness}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <BusinessFormFull onSubmit={handleCreateBusiness} />
          )}
        </div>
      )}

      {editingSlug && (
        <div ref={editFormRef} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Business</h2>
            <button
              onClick={() => setEditingSlug(null)}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          {editingBusiness ? (
            <BusinessFormFull
              business={editingBusiness}
              onSubmit={async (business) => {
                await handleUpdateBusiness(business);
              }}
            />
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
              Business not found. Try refreshing the page.
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {uniqueStates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by State</label>
            <select
              value={filterState}
              onChange={(e) => {
                setFilterState(e.target.value);
                setFilterCity('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All States</option>
              {uniqueStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {uniqueCities.length > 0 && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Businesses List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredBusinesses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filterState || filterCity ? 'No businesses found with selected filters.' : 'No businesses yet.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">City</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">State</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => (
                <tr key={business.slug} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{business.name}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{business.city}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{business.state}</td>
                  <td className="px-6 py-4 text-gray-600">{business.phoneDisplay}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {business.rating > 0 ? (
                      <span>
                        {business.rating} ⭐ ({business.reviewCount})
                      </span>
                    ) : (
                      <span className="text-gray-400">No rating</span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => setEditingSlug(business.slug)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBusiness(business.slug)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                    >
                      Delete
                    </button>
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
