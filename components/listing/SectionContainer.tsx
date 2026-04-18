export interface SectionContainerProps {
  children: React.ReactNode;
  divider?: boolean;
}

export default function SectionContainer({
  children,
  divider = true,
}: SectionContainerProps) {
  return (
    <div className={`mb-8 ${divider ? 'border-b border-slate-200 pb-8' : ''}`}>
      {children}
    </div>
  );
}
