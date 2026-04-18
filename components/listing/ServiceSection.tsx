import BadgeGroup from './BadgeGroup';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ServiceSectionProps {
  services: string[];
}

export default function ServiceSection({ services }: ServiceSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Services Offered</SectionHeading>
      <BadgeGroup items={services} variant="pill" />
    </SectionContainer>
  );
}
