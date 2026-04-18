import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllBusinesses,
  getBusinessBySlug,
  getCityBySlug,
  getStateBySlug,
} from '@/lib/data';
import { businessMetadata } from '@/lib/seo';
import {
  buildLocalBusinessSchema,
  buildBreadcrumbSchema,
  businessBreadcrumbs,
} from '@/lib/schema';
import Breadcrumb from '@/components/Breadcrumb';
import SchemaOrg from '@/components/SchemaOrg';
import ReviewSection from '@/components/ReviewSection';
import RatingBadge from '@/components/listing/RatingBadge';
import StatusBadge from '@/components/listing/StatusBadge';
import HeroMetrics from '@/components/listing/HeroMetrics';
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

  const [city, state] = await Promise.all([
    getCityBySlug(biz.city),
    getStateBySlug(biz.state),
  ]);
  if (!city || !state) notFound();

  const crumbs = businessBreadcrumbs(biz, city, state);

  return (
    <>
      <SchemaOrg data={buildLocalBusinessSchema(biz)} />
      <SchemaOrg data={buildBreadcrumbSchema(crumbs)} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={crumbs} />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <h1 className="text-4xl font-bold text-slate-900">{biz.name}</h1>
            {/* Status badges */}
            {biz.photos && biz.photos.length > 0 && (
              <StatusBadge status="featured" size="sm" />
            )}
            <StatusBadge status="mobile" size="sm" />
          </div>
          <p className="text-slate-500 text-base mb-3">
            {city.name}, {state.code}
          </p>
          <RatingBadge rating={biz.rating} count={biz.reviewCount} />
        </div>

        {/* Photo Gallery */}
        {biz.photos && biz.photos.length > 0 && (
          <SectionContainer>
            <PhotoGallery photos={biz.photos} businessName={biz.name} />
          </SectionContainer>
        )}

        {/* Hero Metrics */}
        <SectionContainer divider={false}>
          <HeroMetrics
            responseTime={biz.responseTime}
            serviceRadius={biz.serviceRadius}
            startingPrice={biz.pricing ? `$${biz.pricing[0]?.minPrice ?? 0}+` : undefined}
            availability={biz.acceptedPayment ? '24/7' : undefined}
          />
        </SectionContainer>

        {/* CTA Buttons */}
        <div className="mb-8">
          <CTAButtonGroup
            phone={biz.phone}
            slug={biz.slug}
            name={biz.name}
            address={biz.address}
          />
        </div>

        {/* Description */}
        <SectionContainer>
          <SectionHeading>About</SectionHeading>
          <p className="text-slate-600 leading-relaxed">{biz.description}</p>
        </SectionContainer>

        {/* Services */}
        <ServiceSection services={biz.services} />

        {/* Vehicle Types */}
        <VehicleTypesSection vehicleTypes={biz.vehicleTypes || []} />

        {/* Service Area */}
        <ServiceAreaSection
          serviceRadius={biz.serviceRadius}
          areasServed={biz.areasServed}
        />

        {/* Contact */}
        <ContactSection
          phone={biz.phone}
          phoneDisplay={biz.phoneDisplay}
          address={biz.address}
          website={biz.website}
          email={biz.email}
        />

        {/* Hours */}
        <HoursSection hours={biz.hours} />

        {/* Pricing */}
        <PricingSection pricing={biz.pricing || []} />

        {/* Certifications */}
        <CertificationBadges certifications={biz.certifications || []} />

        {/* Review Highlights */}
        <ReviewHighlights businessSlug={biz.slug} limit={3} />

        {/* Full Review Section */}
        <div id="review-form">
          <ReviewSection businessSlug={biz.slug} />
        </div>

        {/* Related Businesses */}
        <SectionContainer divider={false}>
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            More in {city.name}
          </h2>
          <Link
            href={`/${state.slug}/${city.slug}/`}
            className="text-blue-700 hover:underline text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Mobile Tire Repair in {city.name}, {state.code}
          </Link>
        </SectionContainer>
      </div>
    </>
  );
}
