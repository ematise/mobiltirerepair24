import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllCities,
  getStateBySlug,
  getCityBySlug,
  getBusinessesByCity,
  isCityIndexable,
} from '@/lib/data';
import { cityMetadata, noindexMetadata } from '@/lib/seo';
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
  cityBreadcrumbs,
} from '@/lib/schema';
import { getNearbyCities } from '@/lib/nearby';
import Breadcrumb from '@/components/Breadcrumb';
import BusinessList from '@/components/BusinessList';
import CityLinks from '@/components/CityLinks';
import SchemaOrg from '@/components/SchemaOrg';

type Props = { params: Promise<{ state: string; city: string }> };

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((c) => ({ state: c.state, city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const [state, city] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
  ]);
  if (!state || !city) return {};
  if (!(await isCityIndexable(citySlug, stateSlug))) return noindexMetadata();
  return cityMetadata(city, state);
}

export default async function CityPage({ params }: Props) {
  const { state: stateSlug, city: citySlug } = await params;
  const [state, city] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
  ]);
  if (!state || !city) notFound();

  const [businesses, nearby] = await Promise.all([
    getBusinessesByCity(citySlug, stateSlug),
    getNearbyCities(citySlug),
  ]);

  const crumbs = cityBreadcrumbs(city, state);

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />
      <SchemaOrg
        data={buildItemListSchema(businesses.map((b) => `/business/${b.slug}/`))}
      />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={crumbs} />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Mobile Tire Repair in {city.name}, {state.code}
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          {city.intro}
        </p>

        <div className="flex flex-col gap-12">
          <BusinessList
            businesses={businesses}
            heading={`Top Mobile Tire Repair Services in ${city.name}`}
          />

          {nearby.length > 0 && (
            <CityLinks
              cities={nearby}
              stateSlug={stateSlug}
              heading="Nearby Cities with Mobile Tire Services"
            />
          )}
        </div>
      </div>
    </>
  );
}
