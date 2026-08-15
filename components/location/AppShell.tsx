'use client';

import type { ReactNode } from 'react';
import LocationPromptBanner from '@/components/location/LocationPromptBanner';
import { UserLocationProvider } from '@/components/location/UserLocationProvider';
import SiteHeader from '@/components/SiteHeader';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <UserLocationProvider>
      <div className="site-chrome">
        <SiteHeader />
        <LocationPromptBanner />
      </div>
      {children}
    </UserLocationProvider>
  );
}
