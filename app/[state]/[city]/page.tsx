import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllCities,
  getAllServices,
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
import { enrichProviders } from '@/lib/provider-list';
import Breadcrumb from '@/components/Breadcrumb';
import CityLinks from '@/components/CityLinks';
import SchemaOrg from '@/components/SchemaOrg';
import ReadMoreText from '@/components/listing/ReadMoreText';
import CityProviderList from '@/components/listing/CityProviderList';
import SectionContainer from '@/components/listing/SectionContainer';
import SectionHeading from '@/components/listing/SectionHeading';

export const revalidate = 3600; // re-render at most hourly; admin edits go live without redeploys

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

  const [businesses, nearby, services] = await Promise.all([
    getBusinessesByCity(citySlug, stateSlug),
    getNearbyCities(citySlug),
    getAllServices(),
  ]);
  const offeredServices = services.filter((svc) =>
    businesses.some((b) => b.services.includes(svc.slug))
  );
  const providers = enrichProviders(businesses, city, state.code);

  const crumbs = cityBreadcrumbs(city, state);

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />
      <SchemaOrg
        data={buildItemListSchema(businesses.map((b) => `/business/${b.slug}/`))}
      />

      <div className="bg-surface min-h-screen">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
          <Breadcrumb crumbs={crumbs} variant="muted" />

          <h1 className="text-[1.75rem] font-bold text-heading leading-[1.15] tracking-tight">
            Mobile tire repair in {city.name}, {state.code}
          </h1>

          <ReadMoreText text={city.intro} />

          <CityProviderList
            providers={providers}
            services={offeredServices}
            cityName={city.name}
          />

          {nearby.length > 0 && (
            <SectionContainer>
              <SectionHeading>Nearby cities</SectionHeading>
              <CityLinks cities={nearby} stateSlug={stateSlug} />
            </SectionContainer>
          )}
        </div>
      </div>
    </>
  );
}
