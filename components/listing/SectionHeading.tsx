export interface SectionHeadingProps {
  children: React.ReactNode;
}

export default function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="text-[22px] font-bold text-gray-950 mb-3 tracking-tight [font-family:var(--font-body)]">
      {children}
    </h2>
  );
}
