import { Clock, MapPin, DollarSign, Clock3 } from 'lucide-react';

export interface HeroMetricsProps {
  responseTime?: string;
  serviceRadius?: string;
  startingPrice?: string;
  availability?: string;
}

const metrics = [
  {
    icon: Clock3,
    label: 'Avg. arrival',
    key: 'responseTime',
  },
  {
    icon: MapPin,
    label: 'Service radius',
    key: 'serviceRadius',
  },
  {
    icon: DollarSign,
    label: 'Starting price',
    key: 'startingPrice',
  },
  {
    icon: Clock,
    label: 'Availability',
    key: 'availability',
  },
];

export default function HeroMetrics({
  responseTime,
  serviceRadius,
  startingPrice,
  availability,
}: HeroMetricsProps) {
  const data = {
    responseTime,
    serviceRadius,
    startingPrice,
    availability,
  };

  // Only show metrics if at least one value is provided
  const hasData = Object.values(data).some((v) => v);
  if (!hasData) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {metrics.map(({ icon: Icon, label, key }) => {
        const value = data[key as keyof typeof data];
        if (!value) return null;

        return (
          <div
            key={key}
            className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center"
          >
            <Icon className="w-6 h-6 text-blue-700 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
