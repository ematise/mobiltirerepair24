import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ContactSectionProps {
  phone: string;
  phoneDisplay: string;
  address: string;
  website?: string;
  email?: string;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  ariaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  ariaLabel?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-3.5 py-3.5">
      <span className="icon-circle">
        <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] text-gray-400 font-medium [font-family:var(--font-body)]">{label}</p>
        <p className="text-[15px] text-gray-800 font-medium truncate [font-family:var(--font-body)]">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta"
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }

  return inner;
}

export default function ContactSection({
  phone,
  phoneDisplay,
  address,
  website,
  email,
}: ContactSectionProps) {
  return (
    <SectionContainer>
      <SectionHeading>Contact & location</SectionHeading>
      <div className="rounded-[14px] border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
        <ContactRow
          icon={Phone}
          label="Phone"
          value={phoneDisplay}
          href={`tel:${phone}`}
          ariaLabel={`Call ${phoneDisplay}`}
        />
        <ContactRow icon={MapPin} label="Location" value={address} />
        {email && (
          <ContactRow
            icon={Mail}
            label="Email"
            value={email}
            href={`mailto:${email}`}
            ariaLabel={`Email ${email}`}
          />
        )}
        {website && (
          <ContactRow
            icon={Globe}
            label="Website"
            value={new URL(website).hostname}
            href={website}
            ariaLabel="Visit website"
          />
        )}
      </div>
    </SectionContainer>
  );
}
