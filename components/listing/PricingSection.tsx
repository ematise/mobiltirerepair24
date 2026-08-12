import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface PricingItem {
  service: string;
  minPrice: number;
  maxPrice: number;
  note?: string;
}

export interface PricingSectionProps {
  pricing: PricingItem[];
  disclaimer?: string;
}

export default function PricingSection({
  pricing,
  disclaimer = 'Free quote over the phone. No hidden fees. Service call included in price.',
}: PricingSectionProps) {
  if (!pricing || pricing.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Pricing</SectionHeading>
      <div className="rounded-[14px] border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left font-semibold text-gray-900 px-4 py-3 [font-family:var(--font-body)]">Service</th>
              <th className="text-right font-semibold text-gray-900 px-4 py-3 [font-family:var(--font-body)]">Price</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((item, idx) => (
              <tr
                key={idx}
                className={idx !== 0 ? 'border-t border-gray-100' : ''}
              >
                <td className="px-4 py-3">
                  <p className="text-gray-900 font-medium [font-family:var(--font-body)]">{item.service}</p>
                  {item.note && <p className="text-gray-400 text-xs mt-0.5">{item.note}</p>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 font-medium whitespace-nowrap [font-family:var(--font-body)]">
                  ${item.minPrice}–${item.maxPrice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {disclaimer}
      </p>
    </SectionContainer>
  );
}
