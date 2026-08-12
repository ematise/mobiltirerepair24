import Link from 'next/link';
import { ChevronRight, Wrench, AlertTriangle, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Service } from '@/lib/data';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ServiceSectionProps {
  services: Service[];
  citySlug: string;
  stateSlug: string;
}

const SERVICE_ICONS: Record<string, LucideIcon> = {
  'mobile-tire-repair': Wrench,
  'flat-tire-repair': AlertTriangle,
  'tire-installation': CircleDot,
};

export default function ServiceSection({
  services,
  citySlug,
  stateSlug,
}: ServiceSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Services offered</SectionHeading>
      <ul className="flex flex-col gap-2.5" role="list">
        {services.map((svc) => {
          const Icon = SERVICE_ICONS[svc.slug] ?? Wrench;
          return (
            <li key={svc.slug}>
              <Link
                href={`/${stateSlug}/${citySlug}/${svc.slug}/`}
                className="flex items-center gap-3.5 rounded-card border border-border bg-surface px-3.5 py-3.5 hover:border-gray-300 hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta"
              >
                <span className="icon-circle">
                  <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gray-950 leading-snug [font-family:var(--font-body)]">
                    {svc.name}
                  </span>
                  <span className="block text-[13px] text-gray-500 leading-snug mt-0.5">
                    {svc.description}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionContainer>
  );
}
