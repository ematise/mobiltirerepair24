import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllStates,
  getStateBySlug,
  getCitiesByState,
  isCityIndexable,
} from '@/lib/data';
import { stateMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';
import SchemaOrg from '@/components/SchemaOrg';
import { buildBreadcrumbSchema } from '@/lib/schema';

type Props = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  const states = await getAllStates();
  return states.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) return {};
  return stateMetadata(state);
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) notFound();

  const allCities = await getCitiesByState(stateSlug);
  const indexable = await Promise.all(
    allCities.map((c) => isCityIndexable(c.slug, stateSlug))
  );
  const cities = allCities.filter((_, i) => indexable[i]);

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: state.name, url: `/${state.slug}/` },
  ];

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={crumbs} />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Mobile Tire Repair in {state.name}
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-2xl">
          {state.intro}
        </p>

        <h2 className="text-2xl font-semibold text-slate-900 mb-5">
          Cities in {state.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {cities.map((city) => (
            <div
              key={city.slug}
              className="border border-slate-200 rounded-lg p-5 bg-white hover:border-blue-300 hover:shadow-sm transition-all duration-150"
            >
              <h3 className="font-semibold text-slate-900">
                <Link
                  href={`/${state.slug}/${city.slug}/`}
                  className="hover:text-blue-700 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Mobile Tire Repair in {city.name}, {state.code}
                </Link>
              </h3>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
