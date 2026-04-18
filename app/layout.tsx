import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { getAllStates } from '@/lib/data';
import SearchBar from '@/components/SearchBar';

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'MobileTireRepair24 — Find Mobile Tire Repair Near You',
  },
  description:
    'MobileTireRepair24 is the #1 directory for mobile tire repair services across the United States. Find a technician near you — fast.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com'
  ),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const states = await getAllStates();

  return (
    <html lang="en">
      <head />
      <body className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-slate-900 text-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-semibold text-lg tracking-tight hover:text-blue-300 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded shrink-0"
              aria-label="MobileTireRepair24 — Home"
            >
              MobileTireRepair<span className="text-blue-400">24</span>
            </Link>

            <SearchBar />

            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-4 text-sm" role="list">
                {states.map((state) => (
                  <li key={state.slug}>
                    <Link
                      href={`/${state.slug}/`}
                      className="text-slate-300 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    >
                      {state.code}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 text-sm mt-16">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              {states.map((state) => (
                <div key={state.slug}>
                  <h3 className="text-white font-semibold mb-3">{state.name}</h3>
                  <ul className="flex flex-col gap-1.5" role="list">
                    {state.cities.map((citySlug) => (
                      <li key={citySlug}>
                        <Link
                          href={`/${state.slug}/${citySlug}/`}
                          className="hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
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

            <div className="border-t border-slate-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p>
                &copy; {new Date().getFullYear()} MobileTireRepair24. All rights
                reserved.
              </p>
              <p className="text-slate-500 text-xs">
                Mobile tire repair directory — United States
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
