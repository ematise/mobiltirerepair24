export interface SectionContainerProps {
  children: React.ReactNode;
  divider?: boolean;
}

export default function SectionContainer({
  children,
}: SectionContainerProps) {
  return <div className="mb-8">{children}</div>;
}
