import { track } from '@vercel/analytics';

/** Pro-only custom events; no-op unless NEXT_PUBLIC_VERCEL_ANALYTICS_CUSTOM_EVENTS=true */
export function trackCallClick(business: string, city: string) {
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_CUSTOM_EVENTS !== 'true') return;
  track('call_click', { business, city });
}
