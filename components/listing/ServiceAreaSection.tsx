import { MapPin } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ServiceAreaSectionProps {
  serviceRadius?: string;
  areasServed?: string[];
}

export default function ServiceAreaSection({
  serviceRadius,
  areasServed,
}: ServiceAreaSectionProps) {
  if (!serviceRadius && (!areasServed || areasServed.length === 0)) return null;

  return (
    <SectionContainer>
      <SectionHeading>Service Area</SectionHeading>
      <div className="space-y-4">
        {serviceRadius && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate-600 font-medium">Service Radius</p>
              <p className="text-base text-slate-900 font-medium">{serviceRadius}</p>
            </div>
          </div>
        )}

        {areasServed && areasServed.length > 0 && (
          <div>
            <p className="text-sm text-slate-600 font-medium mb-2">Areas Served</p>
            <p className="text-base text-slate-900">
              {areasServed.join(' · ')}
            </p>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
