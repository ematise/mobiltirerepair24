import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getAllCities,
  getAllServices,
  getStateBySlug,
  getCityBySlug,
  getServiceBySlug,
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
import Breadcrumb from '@/components/Breadcrumb';
import BusinessList from '@/components/BusinessList';
import FAQSection from '@/components/FAQSection';
import SchemaOrg from '@/components/SchemaOrg';

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

  const [businesses, nearby] = await Promise.all([
    getBusinessesByCityAndService(citySlug, stateSlug, serviceSlug),
    getNearbyCities(citySlug),
  ]);

  const faqs = service.faqs.map((f) => ({
    q: fillTemplate(f.q, city, state),
    a: fillTemplate(f.a, city, state),
  }));

  const crumbs = serviceCityBreadcrumbs(city, state, service);

  return (
    <>
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />
      <SchemaOrg
        data={buildItemListSchema(businesses.map((b) => `/business/${b.slug}/`))}
      />
      {faqs.length > 0 && <SchemaOrg data={buildFAQSchema(faqs)} />}

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={crumbs} />

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          {fillTemplate(service.h1Template, city, state)}
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          {service.description} Available now in {city.name}, {state.code}.
        </p>

        <div className="flex flex-col gap-12">
          <BusinessList
            businesses={businesses}
            heading={`Businesses Offering ${service.name} in ${city.name}`}
          />

          {faqs.length > 0 && <FAQSection faqs={faqs} />}

          {nearby.length > 0 && (
            <section aria-labelledby="nearby-service-heading">
              <h2
                id="nearby-service-heading"
                className="text-xl font-semibold text-slate-900 mb-4"
              >
                {service.name} Near {city.name}
              </h2>
              <ul className="flex flex-col gap-2" role="list">
                {nearby.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.state}/${c.slug}/${service.slug}/`}
                      className="text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium"
                    >
                      {service.name} in {c.name}, {c.stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
