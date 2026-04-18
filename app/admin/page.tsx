import Link from 'next/link';
import { getAllStates, getAllCities, getAllBusinesses } from '@/lib/data';
import TokenGenerator from '@/components/admin/TokenGenerator';

export default async function AdminDashboard() {
  const [states, cities, businesses] = await Promise.all([
    getAllStates(),
    getAllCities(),
    getAllBusinesses(),
  ]);

  const stats = [
    { label: 'States', count: states.length, href: '/admin/states' },
    { label: 'Cities', count: cities.length, href: '/admin/cities' },
    { label: 'Businesses', count: businesses.length, href: '/admin/businesses' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Token Generator */}
      <TokenGenerator />

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer">
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.count}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/states?action=new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add State
          </Link>
          <Link
            href="/admin/cities?action=new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add City
          </Link>
          <Link
            href="/admin/businesses?action=new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add Business
          </Link>
        </div>
      </div>
    </div>
  );
}
