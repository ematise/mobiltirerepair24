import { Map } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ServiceAreaSectionProps {
  cityName: string;
  serviceRadius?: string;
  areasServed?: string[];
}

export default function ServiceAreaSection({
  cityName,
  serviceRadius,
}: ServiceAreaSectionProps) {
  const copy = `We come to you anywhere in ${cityName} and surrounding areas`;

  return (
    <SectionContainer>
      <SectionHeading>Service area</SectionHeading>
      <div className="flex items-center gap-3.5 rounded-[14px] border border-gray-200 bg-white px-3.5 py-3.5">
        <span className="icon-circle">
          <Map className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="text-[14px] text-gray-600 leading-relaxed">
          {copy}
          {serviceRadius ? ` (${serviceRadius})` : ''}
        </p>
      </div>
    </SectionContainer>
  );
}
