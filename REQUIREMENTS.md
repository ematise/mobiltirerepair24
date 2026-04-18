# Business Listing Detail Page - Requirements

## Overview
Transform the business listing detail page from a minimal layout to a comprehensive, feature-rich business profile similar to QuickFix Mobile Tire & Wheel screenshot.

---

## 1. Header Section
- [ ] Business name (large, prominent)
- [ ] Location (city, state)
- [ ] Overall rating with star visualization
- [ ] Total review count
- [ ] Status badges:
  - [ ] "Featured" badge
  - [ ] "Open now" status indicator (dynamic based on hours)
  - [ ] "Mobile service" badge

---

## 2. Key Metrics Cards (Hero Stats)
Display 4 key stats in a card grid:
- [ ] Average response time (e.g., "25 min Avg. arrival")
- [ ] Service radius (e.g., "35 mi Service radius") - pulled from Business.serviceRadius
- [ ] Starting price (e.g., "$65+ Starting price")
- [ ] Availability status (e.g., "24/7 Availability")

---

## 3. Photo Gallery
- [ ] Image carousel/gallery view
- [ ] Multiple photos support
- [ ] Thumbnail previews
- [ ] Next/prev navigation
- [ ] Mobile-responsive
- [ ] Add `photos` array to Business schema

---

## 4. Services Offered Section
- [ ] List all services as clickable badges/pills
- [ ] Organized by category or flat list
- [ ] Icons for each service (optional)
- [ ] Services sourced from `business.services`

---

## 5. Service Area (Radius + Named Areas)
- [ ] Display service radius prominently (e.g., "35 mi Service radius")
- [ ] Display named areas served (e.g., "Dallas, Irving, Garland, Mesquite, Carrollton")
- [ ] Both fields are required for full display (no fallbacks)
- [ ] Each business has both `serviceRadius` and `areasServed`
- [ ] Display as two-part section:
  - [ ] "Service Radius: [radius]"
  - [ ] "Areas Served: [areas]"

## 6. Vehicle Types Served
- [ ] Display vehicle type badges/pills
- [ ] Add `vehicleTypes` to Business schema
- [ ] Examples: "Passenger cars", "SUVs & trucks", "Vans & minivans", "Light commercial"

---

## 7. Contact & Location Section
- [ ] Primary phone number (clickable tel: link)
- [ ] Website link
- [ ] Address with full details
- [ ] Add `address`, `website`, `zipCode` to Business schema if missing
- [ ] Icon-based display (phone icon, location icon, web icon)

---

## 8. Hours of Operation
- [ ] Day-by-day breakdown (Mon-Sun)
- [ ] Opening and closing times
- [ ] "Open now" indicator for current time
- [ ] Holiday/special hours note (if applicable)
- [ ] Add `hours` object to Business schema
- [ ] Format: `{ day: { open: "HH:MM", close: "HH:MM" } }`

---

## 9. Pricing (Estimated)
- [ ] Table or list of service pricing
- [ ] Service categories with price ranges
- [ ] Examples from screenshot:
  - [ ] Flat repair (plug/patch): $65–$85
  - [ ] Spare tire swap: $75–$95
  - [ ] New tire (supply + install): From $130
  - [ ] After-hours fee: +$25
- [ ] Add `pricing` array to Business schema
- [ ] Include disclaimer: "Free quote over the phone. No hidden fees. Service call included in price."

---

## 10. Certifications & Trust Signals
- [ ] Display certification badges
- [ ] Examples from screenshot:
  - [ ] ASE Certified
  - [ ] Licensed & Insured
  - [ ] BBB Accredited - A+
  - [ ] Background-checked techs
- [ ] Add `certifications` array to Business schema

---

## 11. Recent Reviews Section
- [ ] Display top 3-5 recent reviews prominently
- [ ] For each review:
  - [ ] Reviewer name
  - [ ] Rating (star display)
  - [ ] Review date (relative, e.g., "2 days ago")
  - [ ] Review text/excerpt
  - [ ] Optional: reviewer avatar/initials
- [ ] "View all reviews" link/button
- [ ] Optional: review filters (by rating, date, etc.)

---

## 12. Call-to-Action Buttons (Bottom)
- [ ] "Call now" button (prominent, calls business)
- [ ] "Request a quote" button (opens form/modal)
- [ ] "Get directions" button (links to Google Maps/Apple Maps)
- [ ] "Share listing" button (share to social/copy link)
- [ ] Button styling: clear visual hierarchy, mobile-friendly

---

## 13. About/Description
- [ ] Keep existing description section
- [ ] Optionally expand with more details

---

## 14. Areas Served
- [ ] Keep existing areas served section (already in schema as `areasServed`)
- [ ] Display as formatted list or map visualization (optional)

---

## 15. Nearby/Related Businesses
- [ ] Show other businesses in the same city
- [ ] Keep existing "More in [City]" section
- [ ] Optional: nearby businesses carousel

---

## 16. Data Schema Updates
Update the `Business` type in `lib/data.ts`:

**Already exists:**
- `areasServed: string[]` - keeps existing named areas (e.g., ["Dallas", "Irving", "Garland"])

**Fields to add:**
```typescript
photos?: string[];                    // Array of photo URLs
hours?: {
  [day: string]: { open: string; close: string; closed?: boolean }
};
pricing?: Array<{
  service: string;
  minPrice: number;
  maxPrice: number;
  note?: string;
}>;
certifications?: string[];           // e.g., "ASE Certified", "Licensed & Insured"
vehicleTypes?: string[];             // e.g., "Passenger cars", "SUVs & trucks"
responseTime?: string;               // e.g., "25 min"
serviceRadius?: string;              // e.g., "35 mi" - works alongside areasServed
website?: string;
zipCode?: string;
```

**Display Logic:**
- Service Area section shows BOTH serviceRadius AND areasServed together
- Example: "Service Radius: 35 mi | Areas Served: Dallas, Irving, Garland, Mesquite, Carrollton"

---

## 17. Visual & UX Requirements
- [ ] Responsive design (mobile-first)
- [ ] Clean, modern aesthetic (match current design language)
- [ ] Clear visual hierarchy
- [ ] Accessible color contrast
- [ ] Touch-friendly buttons (mobile)
- [ ] Icon usage for quick visual scanning
- [ ] Loading states for dynamic content
- [ ] Error states for missing data

---

## 18. Components to Create/Update
- [ ] `BusinessListingDetail.tsx` (main page, restructured)
- [ ] `HeroStats.tsx` (key metrics cards)
- [ ] `PhotoGallery.tsx` (new - image carousel)
- [ ] `ServiceBadges.tsx` (services section)
- [ ] `BusinessHours.tsx` (hours display)
- [ ] `PricingTable.tsx` (pricing section)
- [ ] `CertificationBadges.tsx` (trust signals)
- [ ] `ContactInfo.tsx` (contact details)
- [ ] `ReviewHighlights.tsx` (featured reviews)
- [ ] `CTAButtonGroup.tsx` (call-to-action buttons)

---

## 19. SEO & Metadata
- [ ] Update metadata generation to include new fields
- [ ] Ensure schema.org structured data includes new sections
- [ ] Keep existing breadcrumb & SEO structure

---

## Priority Order
1. **P0 (Critical)**: Header, Key Metrics, Photo Gallery, Services, Contact, Hours, CTA Buttons
2. **P1 (High)**: Pricing, Certifications, Reviews, Vehicle Types
3. **P2 (Nice-to-have)**: Website link, more detailed description sections, related businesses carousel

