import { Clock } from 'lucide-react';

export default function OpenStatusBadge({
  openNow,
  label,
}: {
  openNow: boolean | null;
  label: string | null;
}) {
  if (openNow === null || !label) return null;

  if (openNow) {
    return (
      <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-open bg-open px-2.5 py-0.5 text-xs font-medium text-open-fg [font-family:var(--font-body)]">
        <span className="h-1.5 w-1.5 rounded-full bg-open-fg" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted [font-family:var(--font-body)]">
      <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}
