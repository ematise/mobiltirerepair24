import type { Business, Service } from '@/lib/data';
import { businessesToProviderListings } from '@/lib/provider-list';
import ProviderCard from '@/components/listing/ProviderCard';

export default function BusinessList({
  businesses,
  services,
  heading,
}: {
  businesses: Business[];
  services: Service[];
  heading?: string;
}) {
  if (businesses.length === 0) return null;

  const providers = businessesToProviderListings(businesses);

  return (
    <section aria-labelledby="business-list-heading">
      {heading && (
        <h2
          id="business-list-heading"
          className="text-base font-semibold text-heading mb-3 [font-family:var(--font-body)]"
        >
          {heading}
        </h2>
      )}
      <ul className="flex flex-col gap-3" role="list">
        {providers.map((provider) => (
          <li key={provider.slug}>
            <ProviderCard provider={provider} services={services} />
          </li>
        ))}
      </ul>
    </section>
  );
}
