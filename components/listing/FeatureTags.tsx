import { Shield, Truck } from 'lucide-react';

export default function FeatureTags({ licensed }: { licensed: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 [font-family:var(--font-body)]">
        <Truck className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} aria-hidden="true" />
        Mobile service
      </span>
      {licensed && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 [font-family:var(--font-body)]">
          <Shield className="w-3.5 h-3.5 text-gray-600" strokeWidth={2} aria-hidden="true" />
          Licensed and insured
        </span>
      )}
    </div>
  );
}
