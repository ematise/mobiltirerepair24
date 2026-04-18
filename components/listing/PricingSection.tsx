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
      <SectionHeading>Pricing (Estimated)</SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left font-semibold text-slate-900 px-4 py-3">Service</th>
              <th className="text-right font-semibold text-slate-900 px-4 py-3">Price Range</th>
              <th className="text-left font-semibold text-slate-900 px-4 py-3 max-w-xs">Notes</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
              >
                <td className="px-4 py-3 text-slate-900 font-medium">{item.service}</td>
                <td className="px-4 py-3 text-right text-slate-600 font-medium">
                  ${item.minPrice}–${item.maxPrice}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        {disclaimer}
      </p>
    </SectionContainer>
  );
}
