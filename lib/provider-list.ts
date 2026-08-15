import type { Business, City, Service } from './data';
import { haversineMiles, isValidLatLng } from './geo';
import { getOpenStatus, type OpenStatus } from './open-now';
import { timezoneForStateCode } from './timezones';

export type ProviderListing = {
  slug: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  description: string;
  rating: number;
  reviewCount: number;
  services: string[];
  lat?: number;
  lng?: number;
  distanceMiles: number | null;
  openNow: boolean | null;
  openLabel: string | null;
};

export type SortMode = 'nearest' | 'rating';

export function getCardOpenLabel(status: OpenStatus): { openNow: boolean; label: string } | null {
  if (!status) return null;
  if (status.openNow) {
    if (status.label === 'Open 24 hours') return { openNow: true, label: 'Open 24 hours' };
    return { openNow: true, label: 'Open now' };
  }

  const match = status.label.match(/opens ([\d:]+\s*[AP]M)/i);
  if (match) {
    const time = match[1].replace(':00 ', ' ').replace(':00', '');
    return { openNow: false, label: `Opens ${time}` };
  }

  return { openNow: false, label: status.label.replace(/^Closed · /, '') };
}

export function getInitials(name: string): string {
  const skip = /^(the|and|&|of|for)$/i;
  const words = name.split(/\s+/).filter((w) => w.length > 0 && !skip.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function serviceNameForSlug(slug: string, services: Service[]): string {
  return services.find((s) => s.slug === slug)?.name ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function openSortRank(openNow: boolean | null): number {
  if (openNow === true) return 0;
  if (openNow === null) return 1;
  return 2;
}

export function businessToProviderListing(
  biz: Business,
  options?: {
    stateCode?: string;
    distanceMiles?: number | null;
    referenceLat?: number;
    referenceLng?: number;
  },
): ProviderListing {
  const stateCode = options?.stateCode ?? biz.stateCode;
  const openStatus = getOpenStatus(biz.hours, timezoneForStateCode(stateCode));
  const cardOpen = getCardOpenLabel(openStatus);

  let distanceMiles = options?.distanceMiles ?? null;
  if (
    distanceMiles === null &&
    options?.referenceLat !== undefined &&
    options?.referenceLng !== undefined &&
    isValidLatLng(biz.lat ?? 0, biz.lng ?? 0) &&
    isValidLatLng(options.referenceLat, options.referenceLng)
  ) {
    distanceMiles =
      Math.round(
        haversineMiles(options.referenceLat, options.referenceLng, biz.lat!, biz.lng!) * 10,
      ) / 10;
  }

  return {
    slug: biz.slug,
    name: biz.name,
    phone: biz.phone,
    phoneDisplay: biz.phoneDisplay,
    description: biz.description,
    rating: biz.rating,
    reviewCount: biz.reviewCount,
    services: biz.services,
    lat: biz.lat,
    lng: biz.lng,
    distanceMiles,
    openNow: cardOpen?.openNow ?? null,
    openLabel: cardOpen?.label ?? null,
  };
}

export function applyUserDistance(
  providers: ProviderListing[],
  userLat: number,
  userLng: number,
): ProviderListing[] {
  return providers.map((p) => {
    if (!isValidLatLng(p.lat ?? 0, p.lng ?? 0) || !isValidLatLng(userLat, userLng)) {
      return { ...p, distanceMiles: null };
    }
    const distanceMiles =
      Math.round(haversineMiles(userLat, userLng, p.lat!, p.lng!) * 10) / 10;
    return { ...p, distanceMiles };
  });
}

export function enrichProviders(
  businesses: Business[],
  _city: City,
  stateCode: string,
): ProviderListing[] {
  return businesses.map((biz) =>
    businessToProviderListing(biz, { stateCode }),
  );
}

export function businessesToProviderListings(businesses: Business[]): ProviderListing[] {
  return businesses.map((biz) => businessToProviderListing(biz));
}

export function sortProviders(providers: ProviderListing[], mode: SortMode): ProviderListing[] {
  const sorted = [...providers];
  if (mode === 'rating') {
    sorted.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    const openDiff = openSortRank(a.openNow) - openSortRank(b.openNow);
    if (openDiff !== 0) return openDiff;
    const aDist = a.distanceMiles ?? Number.POSITIVE_INFINITY;
    const bDist = b.distanceMiles ?? Number.POSITIVE_INFINITY;
    if (aDist !== bDist) return aDist - bDist;
    return b.rating - a.rating;
  });
  return sorted;
}

export function filterProvidersByService(
  providers: ProviderListing[],
  serviceSlug: string | null,
): ProviderListing[] {
  if (!serviceSlug) return providers;
  return providers.filter((p) => p.services.includes(serviceSlug));
}
