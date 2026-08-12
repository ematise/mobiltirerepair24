import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface VehicleTypesSectionProps {
  vehicleTypes: string[];
}

export default function VehicleTypesSection({ vehicleTypes }: VehicleTypesSectionProps) {
  if (!vehicleTypes || vehicleTypes.length === 0) return null;

  return (
    <SectionContainer>
      <SectionHeading>Vehicle types served</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {vehicleTypes.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 [font-family:var(--font-body)]"
          >
            {item}
          </span>
        ))}
      </div>
    </SectionContainer>
  );
}
