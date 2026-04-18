import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import InfoBlock from './InfoBlock';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';

export interface ContactSectionProps {
  phone: string;
  phoneDisplay: string;
  address: string;
  website?: string;
  email?: string;
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
      <SectionHeading>Contact & Location</SectionHeading>
      <div className="space-y-3">
        <InfoBlock
          icon={Phone}
          label="Phone"
          value={phoneDisplay}
          href={`tel:${phone}`}
          ariaLabel={`Call ${phoneDisplay}`}
        />
        <InfoBlock icon={MapPin} label="Location" value={address} />
        {email && (
          <InfoBlock
            icon={Mail}
            label="Email"
            value={email}
            href={`mailto:${email}`}
            ariaLabel={`Email ${email}`}
          />
        )}
        {website && (
          <InfoBlock
            icon={Globe}
            label="Website"
            value={new URL(website).hostname}
            href={website}
            ariaLabel={`Visit website`}
          />
        )}
      </div>
    </SectionContainer>
  );
}
