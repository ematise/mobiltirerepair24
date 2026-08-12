import Link from 'next/link';
import { getAllStates, getAllCities, getAllBusinesses } from '@/lib/data';
import TokenGenerator from '@/components/admin/TokenGenerator';
import SeedGeographyButton from '@/components/admin/SeedGeographyButton';
import Button from '@/components/ui/Button';

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

      <SeedGeographyButton />

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
          <Button href="/admin/states?action=new" variant="primary" size="sm">
            Add State
          </Button>
          <Button href="/admin/cities?action=new" variant="primary" size="sm">
            Add City
          </Button>
          <Button href="/admin/businesses?action=new" variant="primary" size="sm">
            Add Business
          </Button>
        </div>
      </div>
    </div>
  );
}
