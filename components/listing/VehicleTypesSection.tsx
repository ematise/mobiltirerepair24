import BadgeGroup from './BadgeGroup';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface VehicleTypesSectionProps {
  vehicleTypes: string[];
}

export default function VehicleTypesSection({ vehicleTypes }: VehicleTypesSectionProps) {
  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Vehicle Types Served</SectionHeading>
      <BadgeGroup items={vehicleTypes} variant="pill" />
    </SectionContainer>
  );
}
