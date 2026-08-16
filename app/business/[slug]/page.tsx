import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import {
  getAllBusinesses,
  getAllServices,
  getBusinessBySlug,
  getBusinessesByCity,
  getCityBySlug,
  getStateBySlug,
} from '@/lib/data';
import { businessMetadata } from '@/lib/seo';
import {
  buildLocalBusinessSchema,
  buildBreadcrumbSchema,
  businessBreadcrumbs,
} from '@/lib/schema';
import { getOpenStatus } from '@/lib/open-now';
import { timezoneForStateCode } from '@/lib/timezones';
import { enrichProviders } from '@/lib/provider-list';
import Breadcrumb from '@/components/Breadcrumb';
import SchemaOrg from '@/components/SchemaOrg';
import ReviewSection from '@/components/ReviewSection';
import RelatedProviders from '@/components/listing/RelatedProviders';
import RatingBadge from '@/components/listing/RatingBadge';
import PhotoGallery from '@/components/listing/PhotoGallery';
import ServiceSection from '@/components/listing/ServiceSection';
import ContactSection from '@/components/listing/ContactSection';
import HoursSection from '@/components/listing/HoursSection';
import PricingSection from '@/components/listing/PricingSection';
import CertificationBadges from '@/components/listing/CertificationBadges';
import ServiceAreaSection from '@/components/listing/ServiceAreaSection';
import VehicleTypesSection from '@/components/listing/VehicleTypesSection';
import ReviewHighlights from '@/components/listing/ReviewHighlights';
import CTAButtonGroup from '@/components/listing/CTAButtonGroup';
import SectionContainer from '@/components/listing/SectionContainer';
import SectionHeading from '@/components/listing/SectionHeading';
import FeatureTags from '@/components/listing/FeatureTags';
import StickyBusinessCTA from '@/components/listing/StickyBusinessCTA';
import BusinessHeroBanner from '@/components/listing/BusinessHeroBanner';

export const revalidate = 3600; // re-render at most hourly; admin edits go live without redeploys

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const businesses = await getAllBusinesses();
  return businesses.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getBusinessBySlug(slug);
  if (!biz) return {};
  const [city, state] = await Promise.all([
    getCityBySlug(biz.city),
    getStateBySlug(biz.state),
  ]);
  if (!city || !state) return {};
  return businessMetadata(biz, city, state);
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  const biz = await getBusinessBySlug(slug);
  if (!biz) notFound();

  const [city, state, allCityBusinesses, allServices] = await Promise.all([
    getCityBySlug(biz.city),
    getStateBySlug(biz.state),
    getBusinessesByCity(biz.city, biz.state),
    getAllServices(),
  ]);
  if (!city || !state) notFound();

  const offeredServices = allServices.filter((s) => biz.services.includes(s.slug));

  const relatedBusinesses = allCityBusinesses
    .filter((b) => b.slug !== biz.slug)
    .slice(0, 3);
  const relatedProviders = enrichProviders(relatedBusinesses, city, state.code);

  const crumbs = businessBreadcrumbs(biz, city, state);
  const openStatus = getOpenStatus(biz.hours, timezoneForStateCode(biz.stateCode));
  const licensed =
    (biz.certifications ?? []).some((c) => /licen[cs]ed|insured/i.test(c)) ||
    /licen[cs]ed|insured/i.test(biz.description ?? '');

  return (
    <>
      <SchemaOrg data={buildLocalBusinessSchema(biz, city)} />
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />

      <div className="bg-white min-h-screen pb-28">
        <BusinessHeroBanner openNow={openStatus?.openNow ?? null} />

        <div className="max-w-lg mx-auto px-4 pt-4">
          <Breadcrumb crumbs={crumbs.slice(0, -1)} variant="muted" />

          <h1 className="text-[1.75rem] font-bold text-gray-950 leading-[1.15] tracking-tight">
            {biz.name}
          </h1>

          <p className="flex items-center gap-1.5 text-[15px] text-gray-500 mt-2 [font-family:var(--font-body)]">
            <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            {city.name}, {state.code}
          </p>

          {biz.rating > 0 && (
            <div className="mt-2.5">
              <RatingBadge rating={biz.rating} count={biz.reviewCount} />
            </div>
          )}

          <div className="mt-3.5">
            <FeatureTags licensed={licensed} />
          </div>

          <div className="mt-5 mb-8">
            <CTAButtonGroup
              phone={biz.phone}
              slug={biz.slug}
              citySlug={city.slug}
              name={biz.name}
              address={biz.address}
              responseTime={biz.responseTime}
            />
          </div>

          <SectionContainer>
            <SectionHeading>About</SectionHeading>
            <p className="text-[15px] text-gray-600 leading-relaxed [font-family:var(--font-body)]">
              {biz.description}
            </p>
          </SectionContainer>

          <ServiceSection
            services={offeredServices}
            citySlug={biz.city}
            stateSlug={biz.state}
          />

          <ReviewHighlights
            businessSlug={biz.slug}
            totalCount={biz.reviewCount}
            limit={2}
          />

          <ServiceAreaSection
            cityName={city.name}
            serviceRadius={biz.serviceRadius}
            areasServed={biz.areasServed}
          />

          {biz.photos && biz.photos.length > 0 && (
            <SectionContainer>
              <SectionHeading>Photos</SectionHeading>
              <PhotoGallery photos={biz.photos} businessName={biz.name} />
            </SectionContainer>
          )}

          <VehicleTypesSection vehicleTypes={biz.vehicleTypes || []} />

          <ContactSection
            phone={biz.phone}
            phoneDisplay={biz.phoneDisplay}
            address={biz.address}
            businessSlug={biz.slug}
            citySlug={city.slug}
            website={biz.website}
            email={biz.email}
          />

          <HoursSection hours={biz.hours} />

          <PricingSection pricing={biz.pricing || []} />

          <CertificationBadges certifications={biz.certifications || []} />

          <div id="review-form">
            <ReviewSection businessSlug={biz.slug} />
          </div>

          <SectionContainer>
            <SectionHeading>More in {city.name}</SectionHeading>
            <RelatedProviders providers={relatedProviders} services={allServices} />
            <Link
              href={`/${state.slug}/${city.slug}/`}
              className="text-cta hover:underline text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded"
            >
              View all mobile tire services in {city.name}, {state.code}
            </Link>
          </SectionContainer>
        </div>
      </div>

      <StickyBusinessCTA phone={biz.phone} name={biz.name} slug={biz.slug} citySlug={city.slug} />
    </>
  );
}
