import Link from 'next/link';
import { getAllStates, getAllCities, isCityIndexable } from '@/lib/data';

export default async function HomePage() {
  const [states, allCities] = await Promise.all([getAllStates(), getAllCities()]);
  const indexableCities = await Promise.all(
    allCities.map((c) => isCityIndexable(c.slug, c.state))
  );
  const cities = allCities.filter((_, i) => indexableCities[i]);

  return (
    <>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Mobile Tire Repair — Anywhere in the US
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Find trusted mobile tire repair technicians near you. No tow truck
            needed — they come to your location, fast.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/${state.slug}/`}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            {[
              { label: 'Cities Covered', value: `${cities.length}+` },
              { label: 'Listed Businesses', value: '46+' },
              { label: 'States', value: String(states.length) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="text-slate-500 text-sm">{stat.label}</dt>
                <dd className="text-3xl font-bold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Browse by state */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-8">
          Browse by State
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {states.map((state) => (
            <div key={state.slug} className="border border-slate-200 rounded-lg p-6 bg-white">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">
                <Link
                  href={`/${state.slug}/`}
                  className="hover:text-blue-700 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {state.name}
                </Link>
              </h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{state.intro}</p>
              <ul className="flex flex-col gap-1.5" role="list">
                {state.cities.map((citySlug) => (
                  <li key={citySlug}>
                    <Link
                      href={`/${state.slug}/${citySlug}/`}
                      className="text-blue-700 hover:underline text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {citySlug
                        .split('-')
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(' ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
