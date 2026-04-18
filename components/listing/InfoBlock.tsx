import { LucideIcon } from 'lucide-react';

export interface InfoBlockProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  href?: string;
  ariaLabel?: string;
}

export default function InfoBlock({
  icon: Icon,
  label,
  value,
  href,
  ariaLabel,
}: InfoBlockProps) {
  const content = (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-slate-600 font-medium">{label}</p>
        <p className="text-base text-slate-900 font-medium">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block hover:bg-slate-50 p-2 rounded transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return content;
}
