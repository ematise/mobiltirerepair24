import Link from 'next/link';
import { getAllCities, getAllStates } from '@/lib/data';

function MinimalFooter() {
  return (
    <footer className="bg-footer text-footer-muted text-sm mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} MobileTireRepair24. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs">
            Mobile tire repair directory — United States
          </p>
        </div>
      </div>
    </footer>
  );
}

export default async function SiteFooter() {
  try {
    const [states, cities] = await Promise.all([getAllStates(), getAllCities()]);
    const cityNames = new Map(cities.map((c) => [c.slug, c.name]));

    return (
      <footer className="bg-footer text-footer-muted text-sm mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
            {states.map((state) => (
              <div key={state.slug}>
                <h3 className="!text-white font-semibold mb-3">
                  <Link href={`/${state.slug}/`} className="hover:text-white">
                    {state.name}
                  </Link>
                </h3>
                <ul className="flex flex-col gap-1.5" role="list">
                  {state.cities.map((citySlug) => (
                    <li key={citySlug}>
                      <Link
                        href={`/${state.slug}/${citySlug}/`}
                        className="hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        {cityNames.get(citySlug) ?? citySlug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              &copy; {new Date().getFullYear()} MobileTireRepair24. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs">
              Mobile tire repair directory — United States
            </p>
          </div>
        </div>
      </footer>
    );
  } catch {
    return <MinimalFooter />;
  }
}
