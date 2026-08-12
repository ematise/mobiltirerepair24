import { Truck } from 'lucide-react';

export default function BusinessHeroBanner({ openNow }: { openNow: boolean | null }) {
  return (
    <div className="bg-cta text-cta-foreground">
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        <Truck className="w-11 h-11 mb-3" strokeWidth={1.6} aria-hidden="true" />
        <p className="text-[17px] font-bold tracking-tight [font-family:var(--font-body)]">
          24/7 roadside tire service
        </p>
        {openNow !== null && (
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium [font-family:var(--font-body)] ${
              openNow
                ? 'bg-open text-open-fg'
                : 'bg-white/20 text-white'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-open-fg' : 'bg-white/80'}`}
              aria-hidden="true"
            />
            {openNow ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>
    </div>
  );
}
