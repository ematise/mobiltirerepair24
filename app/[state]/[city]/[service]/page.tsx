import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getAllCities,
  getAllServices,
  getStateBySlug,
  getCityBySlug,
  getServiceBySlug,
  getBusinessesByCity,
  getBusinessesByCityAndService,
  isServiceCityIndexable,
  fillTemplate,
} from '@/lib/data';
import { serviceCityMetadata, noindexMetadata } from '@/lib/seo';
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
  buildFAQSchema,
  serviceCityBreadcrumbs,
} from '@/lib/schema';
import { getNearbyCities } from '@/lib/nearby';
import { enrichProviders } from '@/lib/provider-list';
import Breadcrumb from '@/components/Breadcrumb';
import FAQSection from '@/components/FAQSection';
import SchemaOrg from '@/components/SchemaOrg';
import ReadMoreText from '@/components/listing/ReadMoreText';
import CityProviderList from '@/components/listing/CityProviderList';
import SectionContainer from '@/components/listing/SectionContainer';
import SectionHeading from '@/components/listing/SectionHeading';

export const revalidate = 3600; // re-render at most hourly; admin edits go live without redeploys

type Props = {
  params: Promise<{ state: string; city: string; service: string }>;
};

export async function generateStaticParams() {
  const [cities, services] = await Promise.all([
    getAllCities(),
    getAllServices(),
  ]);
  return cities.flatMap((c) =>
    services.map((s) => ({ state: c.state, city: c.slug, service: s.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, service: serviceSlug } = await params;
  const [state, city, service] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug),
  ]);
  if (!state || !city || !service) return {};
  if (!(await isServiceCityIndexable(serviceSlug, citySlug, stateSlug))) {
    return noindexMetadata();
  }
  return serviceCityMetadata(service, city, state);
}

export default async function ServiceCityPage({ params }: Props) {
  const { state: stateSlug, city: citySlug, service: serviceSlug } = await params;
  const [state, city, service] = await Promise.all([
    getStateBySlug(stateSlug),
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug),
  ]);
  if (!state || !city || !service) notFound();

  const [serviceBusinesses, allCityBusinesses, nearby, allServices] = await Promise.all([
    getBusinessesByCityAndService(citySlug, stateSlug, serviceSlug),
    getBusinessesByCity(citySlug, stateSlug),
    getNearbyCities(citySlug),
    getAllServices(),
  ]);

  const offeredServices = allServices.filter((svc) =>
    allCityBusinesses.some((b) => b.services.includes(svc.slug))
  );
  const providers = enrichProviders(allCityBusinesses, city, state.code);

  const faqs = service.faqs.map((f) => ({
    q: fillTemplate(f.q, city, state),
    a: fillTemplate(f.a, city, state),
  }));

  const crumbs = serviceCityBreadcrumbs(city, state, service);
  const intro = `${service.description} Available now in ${city.name}, ${state.code}.`;

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />
      <SchemaOrg
        data={buildItemListSchema(serviceBusinesses.map((b) => `/business/${b.slug}/`))}
      />
      {faqs.length > 0 && <SchemaOrg data={buildFAQSchema(faqs)} />}

      <div className="bg-surface min-h-screen">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
          <Breadcrumb crumbs={crumbs} variant="muted" />

          <h1 className="text-[1.75rem] font-bold text-heading leading-[1.15] tracking-tight">
            {fillTemplate(service.h1Template, city, state)}
          </h1>

          <ReadMoreText text={intro} />

          <CityProviderList
            providers={providers}
            services={offeredServices}
            cityName={city.name}
            initialServiceSlug={serviceSlug}
          />

          {faqs.length > 0 && (
            <SectionContainer>
              <FAQSection faqs={faqs} />
            </SectionContainer>
          )}

          {nearby.length > 0 && (
            <SectionContainer>
              <SectionHeading>
                {service.name} near {city.name}
              </SectionHeading>
              <ul className="flex flex-col gap-2" role="list">
                {nearby.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.state}/${c.slug}/${service.slug}/`}
                      className="text-cta hover:underline text-sm font-medium [font-family:var(--font-body)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded"
                    >
                      {service.name} in {c.name}, {c.stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionContainer>
          )}
        </div>
      </div>
    </>
  );
}
