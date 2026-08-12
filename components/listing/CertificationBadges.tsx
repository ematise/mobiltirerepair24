import { CheckCircle } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface CertificationBadgesProps {
  certifications: string[];
}

export default function CertificationBadges({ certifications }: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Certifications</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {certifications.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 [font-family:var(--font-body)]"
          >
            <CheckCircle className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </SectionContainer>
  );
}
