import { CheckCircle, Star, Truck } from 'lucide-react';

export type StatusType = 'featured' | 'open' | 'mobile';

export interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { icon: React.ReactNode; label: string; colors: string }> = {
  featured: {
    icon: <Star className="w-3.5 h-3.5" />,
    label: 'Featured',
    colors: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  open: {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: 'Open now',
    colors: 'bg-green-50 text-green-700 border-green-200',
  },
  mobile: {
    icon: <Truck className="w-3.5 h-3.5" />,
    label: 'Mobile service',
    colors: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

export default function StatusBadge({
  status,
  size = 'sm',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${config.colors}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
