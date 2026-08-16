---
name: Vercel Analytics Setup
overview: Wire up Vercel Web Analytics and Speed Insights in the root layout, and set up Google Search Console verification plus sitemap submission. No admin dashboard work.
todos:
  - id: domain
    content: Confirm canonical domain and set NEXT_PUBLIC_SITE_URL in Vercel project env vars
    status: pending
  - id: install
    content: Install @vercel/analytics and @vercel/speed-insights
    status: pending
  - id: layout
    content: Mount <Analytics /> and <SpeedInsights /> in app/layout.tsx body
    status: pending
  - id: enable
    content: Enable Web Analytics for the project in the Vercel dashboard and deploy
    status: pending
  - id: gsc
    content: Add Google Search Console verification token to layout metadata (or DNS TXT) and submit /sitemap.xml
    status: pending
  - id: events
    content: "If on Vercel Pro: add track('call_click') to the tel:/sms: CTA components"
    status: pending
isProject: false
---

# Analytics via Vercel + Search Console

## Rationale

Skip a custom admin traffic dashboard. Pageviews, referrers, and device breakdown are commodity data, and the single most valuable dataset for an SEO directory (search queries, impressions, average position, indexing coverage) only exists inside Google Search Console. Total code footprint here is about 10 lines.

## Prerequisite: confirm the canonical domain

`NEXT_PUBLIC_SITE_URL` is not set in [.env.local](.env.local), so [app/robots.ts](app/robots.ts) and the `metadataBase` in [app/layout.tsx](app/layout.tsx) both fall back to `https://mobiletirerepair24.com`. Search Console property, sitemap URL, and canonical tags all key off this, so confirm the live domain and set the variable in the Vercel project's environment variables before verifying anything.

## 1. Install packages

```bash
npm install @vercel/analytics @vercel/speed-insights
```

Speed Insights is optional but free on all plans and reports real-user Core Web Vitals, which feed directly into search ranking signals.

## 2. Mount in the root layout

In [app/layout.tsx](app/layout.tsx), add the imports and render both components at the end of `<body>`, inside the existing `<AppShell>` wrapper or just after it:

```tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
```

```tsx
        </AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
```

Notes specific to this codebase:
- The `/next` import path is the current one; it handles App Router client-side route changes automatically.
- The script is served first-party from `/_vercel/insights/script.js`, so it survives ad blockers and needs no cookie banner.
- [proxy.ts](proxy.ts) matches only `/admin/:path*` and `/api/admin/:path*`, so it will not interfere.
- The script is a no-op in development, so `npm run dev` will show nothing. Verification requires a deploy.

## 3. Enable Web Analytics in the Vercel dashboard

The package alone does nothing until Web Analytics is toggled on for the project under the Analytics tab. Do this before or right after deploying.

## 4. Google Search Console

Verify ownership using the metadata API rather than dropping a file in `public/` — add to the existing `metadata` export in [app/layout.tsx](app/layout.tsx):

```tsx
export const metadata: Metadata = {
  // ...existing fields
  verification: {
    google: 'PASTE_VERIFICATION_TOKEN',
  },
};
```

DNS TXT verification is preferable if you control the domain's DNS, since it verifies the whole domain property (including the `www` and non-`www` variants) and survives code changes.

Then in Search Console:
- Submit the sitemap at `https://<domain>/sitemap.xml`. It is already generated dynamically by [app/sitemap.ts](app/sitemap.ts) and declared in [app/robots.ts](app/robots.ts).
- Check Indexing > Pages after a few days; for a programmatic city/service directory the usual problem is "Crawled - currently not indexed" on thin pages, and that report is the only way to see it.

## 5. Conditional: phone-click events (Pro plan only)

Vercel restricts `track()` custom events to Pro and Enterprise. If the account is on Hobby, skip this step entirely — the `tel:`/`sms:` clicks in [components/listing/CTAButtonGroup.tsx](components/listing/CTAButtonGroup.tsx), [components/listing/StickyBusinessCTA.tsx](components/listing/StickyBusinessCTA.tsx), [components/listing/ContactSection.tsx](components/listing/ContactSection.tsx), and [components/BusinessCard.tsx](components/BusinessCard.tsx) will remain untracked.

If on Pro, add to each CTA click path:

```tsx
import { track } from '@vercel/analytics';

track('call_click', { business: slug, city: citySlug });
```

Pro allows only 2 properties per custom event (8 with the $10/month Web Analytics Plus add-on), so choose the two dimensions carefully — business slug and city slug are the useful pair.

## Plan limits worth knowing

- Hobby: 50,000 events/month, 1-month reporting window, no custom events. Collection pauses for the rest of the cycle once exceeded, after a 3-day grace period.
- Pro: $0.03 per 1,000 events, 12-month window, custom events included.

A directory site attracting crawlers can move through the Hobby allowance quickly, though bot traffic is largely filtered by Vercel before counting.

## Verification

After deploying, load a listing page in a normal browser, then confirm the visit appears in the Vercel Analytics tab within a minute or two. Nothing will appear from localhost.