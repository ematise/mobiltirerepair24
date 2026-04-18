'use client';

import { useEffect, useState } from 'react';
import { City } from '@/lib/data';
import CityForm from '@/components/admin/CityForm';

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterState, setFilterState] = useState<string>('');

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/admin/cities');
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      setCities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async (city: City) => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(city),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create city');
      }

      const newCity = await response.json();
      setCities([...cities, newCity]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateCity = async (city: City) => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(city),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update city');
      }

      const updated = await response.json();
      setCities(cities.map((c) => (c.slug === updated.slug ? updated : c)));
      setEditingSlug(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteCity = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this city?')) return;

    try {
      const response = await fetch(`/api/admin/cities?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete city');
      }

      setCities(cities.filter((c) => c.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const editingCity = cities.find((c) => c.slug === editingSlug);
  const filteredCities = filterState ? cities.filter((c) => c.state === filterState) : cities;
  const uniqueStates = Array.from(new Set(cities.map((c) => c.state))).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Cities</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Add City'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New City</h2>
          <CityForm onSubmit={handleCreateCity} />
        </div>
      )}

      {editingSlug && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit City</h2>
          {editingCity && (
            <CityForm
              city={editingCity}
              onSubmit={async (city) => {
                await handleUpdateCity(city);
              }}
            />
          )}
        </div>
      )}

      {/* Filter */}
      {uniqueStates.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All States</option>
            {uniqueStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cities List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredCities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {filterState ? 'No cities in this state.' : 'No cities yet. Create one to get started.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">State</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lat/Lng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nearby Cities</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.map((city) => (
                <tr key={city.slug} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{city.name}</td>
                  <td className="px-6 py-4 text-gray-600">{city.state}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{city.nearbyCities.length}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => setEditingSlug(city.slug)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.slug)}
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
