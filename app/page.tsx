import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ChevronDown,
  Clock,
  CircleDot,
  Disc3,
  LocateFixed,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  getAllStates,
  getAllCities,
  getAllServices,
  getBusinessCount,
  getTopRatedBusinesses,
  getPopularCities,
  isCityIndexable,
} from '@/lib/data';
import { homeMetadata } from '@/lib/seo';
import { buildWebSiteSchema, buildOrganizationSchema, buildFAQSchema } from '@/lib/schema';
import SchemaOrg from '@/components/SchemaOrg';
import NearMeFinder from '@/components/NearMeFinder';
import TopRatedBusinesses from '@/components/home/TopRatedBusinesses';
import StickyCallToAction from '@/components/home/StickyCallToAction';
import FAQSection from '@/components/FAQSection';

export const revalidate = 3600;

export const metadata = homeMetadata();

const HOME_FAQS = [
  {
    q: 'How much does mobile tire repair cost?',
    a: 'Most mobile tire repairs run between $25 and $75 for a standard flat patch or plug, though pricing varies by market and damage type. Many providers charge a trip or service fee on top of the repair. Call a local tech for a quote — listings on this site include phone numbers so you can ask before they roll out.',
  },
  {
    q: 'How fast can a mobile tire technician get to me?',
    a: 'In metro areas, many mobile tire techs arrive within 30 to 60 minutes when they are open and not already on a job. Rural or late-night calls can take longer. Use the finder above to see who is open now near you, then call to confirm ETA and availability.',
  },
  {
    q: 'Do mobile tire services operate at night or on weekends?',
    a: 'Yes — many listings include evening, weekend, or 24/7 hours, especially in larger cities. Hours vary by business, so check the open/closed label on nearby results or the business profile before you call.',
  },
  {
    q: 'Can they replace a tire on-site or only patch it?',
    a: 'Most mobile tire techs handle flat repairs (patch/plug) on-site. Many also carry replacement tires or can install tires you already purchased. Services differ by provider — ask when you call whether they stock your tire size or only perform repairs.',
  },
  {
    q: 'Is mobile tire repair more expensive than a tire shop?',
    a: 'Mobile service often costs a bit more because the technician travels to you, but you save on towing and downtime. For emergencies or busy schedules, the convenience usually outweighs a small premium. Compare a few local listings and call for exact pricing.',
  },
];

const SERVICE_ICONS: Record<string, ReactNode> = {
  'mobile-tire-repair': <Wrench className="w-5 h-5" aria-hidden="true" />,
  'flat-tire-repair': <CircleDot className="w-5 h-5" aria-hidden="true" />,
  'tire-installation': <Disc3 className="w-5 h-5" aria-hidden="true" />,
};

function StateCityLinks({
  state,
  cityNames,
  compact = false,
}: {
  state: Awaited<ReturnType<typeof getAllStates>>[number];
  cityNames: Map<string, string>;
  compact?: boolean;
}) {
  return (
    <ul
      className={`flex flex-col gap-1.5 ${compact ? '' : 'px-5 pb-4'}`}
      role="list"
    >
      {state.cities.map((citySlug) => (
        <li key={citySlug}>
          <Link
            href={`/${state.slug}/${citySlug}/`}
            className="text-blue-700 hover:underline text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {cityNames.get(citySlug) ?? citySlug}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function HomePage() {
  const [states, allCities, businessCount, topRated, popularCities, services] = await Promise.all([
    getAllStates(),
    getAllCities(),
    getBusinessCount(),
    getTopRatedBusinesses(6),
    getPopularCities(8),
    getAllServices(),
  ]);

  const indexableCities = await Promise.all(
    allCities.map((c) => isCityIndexable(c.slug, c.state)),
  );
  const cities = allCities.filter((_, i) => indexableCities[i]);
  const cityNames = new Map(allCities.map((c) => [c.slug, c.name]));

  const popularCityLinks = popularCities.map((c) => ({
    name: `${c.name}, ${c.stateCode}`,
    href: `/${c.state}/${c.slug}/`,
  }));

  return (
    <>
      <SchemaOrg data={buildWebSiteSchema()} />
      <SchemaOrg data={buildOrganizationSchema()} />
      <SchemaOrg data={buildFAQSchema(HOME_FAQS)} />

      {/* Hero */}
      <section className="bg-slate-900 text-white py-14 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight !text-white">
            Find the Best Mobile Tire Repair Near Me
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Compare trusted technicians who come to you — sorted by who&apos;s open right now and
            closest to your location.
          </p>

          <NearMeFinder popularCities={popularCityLinks} services={services} />

          <p className="mt-8 text-slate-400 text-sm">or browse a city</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {popularCityLinks.map((city) => (
              <Link
                key={city.href}
                href={city.href}
                className="btn btn-secondary btn-sm"
              >
                {city.name}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Verified listings
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              24/7 options
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {cities.length}+ cities
            </span>
          </div>

          <div id="hero-sentinel" className="md:hidden h-px w-full" aria-hidden="true" />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: LocateFixed,
                title: 'Share your location',
                body: 'Or search your city. We find every mobile tire tech near you.',
              },
              {
                icon: Clock,
                title: "Compare who's open now",
                body: 'See ratings, hours, and distance at a glance.',
              },
              {
                icon: Phone,
                title: 'Call — they come to you',
                body: 'No tow truck. The technician drives to your car.',
              },
            ].map((step) => (
              <div key={step.title} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <dl className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Cities Covered', value: `${cities.length}+` },
              { label: 'Listed Businesses', value: String(businessCount) },
              { label: 'States', value: String(states.length) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="text-slate-500 text-xs sm:text-sm">{stat.label}</dt>
                <dd className="text-2xl font-bold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Top rated */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <TopRatedBusinesses businesses={topRated} services={services} />
      </section>

      {/* Services */}
      <section className="bg-slate-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            What mobile tire techs can do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.slug}
                className="bg-white border border-slate-200 rounded-lg p-5"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  {SERVICE_ICONS[service.slug] ?? (
                    <Wrench className="w-5 h-5" aria-hidden="true" />
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{service.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by state — mobile accordion */}
      <section id="browse-states" className="max-w-6xl mx-auto px-4 py-12 pb-20 md:pb-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-8">Browse by State</h2>

        <div className="md:hidden flex flex-col gap-3">
          {states.map((state) => (
            <details
              key={`accordion-${state.slug}`}
              className="group border border-slate-200 rounded-lg bg-white"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg [&::-webkit-details-marker]:hidden">
                {state.name}
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180 shrink-0" />
              </summary>
              <StateCityLinks state={state} cityNames={cityNames} />
            </details>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-3 gap-8">
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
              <StateCityLinks state={state} cityNames={cityNames} compact />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-4 py-12 pb-20 md:pb-12 bg-slate-50">
        <FAQSection faqs={HOME_FAQS} />
      </section>

      <StickyCallToAction />
    </>
  );
}
