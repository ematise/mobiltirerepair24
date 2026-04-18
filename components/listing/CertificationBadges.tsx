import { CheckCircle } from 'lucide-react';
import BadgeGroup from './BadgeGroup';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface CertificationBadgesProps {
  certifications: string[];
}

export default function CertificationBadges({ certifications }: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <SectionContainer>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-slate-900">Certifications & Trust Signals</h2>
      </div>
      <BadgeGroup items={certifications} variant="badge" />
    </SectionContainer>
  );
}
