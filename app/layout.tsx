import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EB_Garamond, Lato } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import AppShell from '@/components/location/AppShell';
import SiteFooter from '@/components/SiteFooter';

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'MobileTireRepair24 — Find Mobile Tire Repair Near You',
  },
  description:
    'MobileTireRepair24 is the #1 directory for mobile tire repair services across the United States. Find a technician near you — fast.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mobiletirerepair24.com'
  ),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }),
};

function FooterFallback() {
  return (
    <footer className="bg-footer text-footer-muted text-sm mt-16" aria-hidden="true">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-32 animate-pulse rounded bg-slate-800/50" />
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${garamond.variable} ${lato.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <AppShell>
          <main className="flex-1">{children}</main>
          <Suspense fallback={<FooterFallback />}>
            <SiteFooter />
          </Suspense>
        </AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
