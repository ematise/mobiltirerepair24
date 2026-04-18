export interface SectionHeadingProps {
  children: string;
}

export default function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h2 className="text-xl font-semibold text-slate-900 mb-4">
      {children}
    </h2>
  );
}
