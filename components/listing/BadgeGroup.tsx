export interface BadgeGroupProps {
  items: string[];
  variant?: 'pill' | 'badge';
}

export default function BadgeGroup({
  items,
  variant = 'pill',
}: BadgeGroupProps) {
  if (!items || items.length === 0) return null;

  const baseClasses =
    variant === 'pill'
      ? 'inline-block px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200'
      : 'inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-200';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span key={idx} className={baseClasses}>
          {item}
        </span>
      ))}
    </div>
  );
}
