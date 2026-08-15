import { haversineMiles, isValidLatLng } from './geo';
import type { City } from './data';

/** Max distance from city center for an imported listing (miles). */
export const MAX_RESULT_DISTANCE_MILES = 60;

/** Default radius for Google Text Search locationRestriction (miles). */
export const DEFAULT_CITY_SEARCH_RADIUS_MILES = 50;

type LatLng = { latitude: number; longitude: number };

export type LocationRectangle = {
  low: LatLng;
  high: LatLng;
};

type UsBounds = {
  name: string;
  low: { lat: number; lng: number };
  high: { lat: number; lng: number };
};

/** Bounding boxes covering US states and territories served by the directory. */
export const US_BOUNDS: UsBounds[] = [
  { name: 'contiguous', low: { lat: 24.4, lng: -125.0 }, high: { lat: 49.5, lng: -66.0 } },
  { name: 'alaska', low: { lat: 51.0, lng: -180.0 }, high: { lat: 72.0, lng: -129.0 } },
  { name: 'hawaii', low: { lat: 18.8, lng: -161.0 }, high: { lat: 22.6, lng: -154.5 } },
  { name: 'puerto-rico', low: { lat: 17.8, lng: -67.5 }, high: { lat: 18.6, lng: -65.2 } },
];

/** US-wide rectangle used when a city has no valid coordinates. */
export const US_WIDE_RECTANGLE: LocationRectangle = {
  low: { latitude: 18.8, longitude: -180.0 },
  high: { latitude: 72.0, longitude: -65.0 },
};

const UK_POSTCODE_RE = /\b[A-Z]{1,2}\d[A-Z\d]?\s+\d[A-Z]{2}\b/i;

const NON_US_COUNTRY_RE =
  /\b(united kingdom|uk\b|england|scotland|wales|northern ireland|berkshire|greater london|london,\s*uk|,\s*canada\b|\bcanada\s*$)\b/i;

const US_ZIP_RE = /\b\d{5}(?:-\d{4})?\b/;

/** Two-letter US state / territory codes used in formatted addresses. */
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
]);

export type ValidateUsPlaceInput = {
  lat?: number;
  lng?: number;
  address?: string;
  city: Pick<City, 'name' | 'slug' | 'stateCode' | 'lat' | 'lng'>;
};

export type ValidateUsPlaceResult =
  | { ok: true; warning?: string }
  | { ok: false; reason: string };

function inRectangle(
  lat: number,
  lng: number,
  low: { lat: number; lng: number },
  high: { lat: number; lng: number },
): boolean {
  return lat >= low.lat && lat <= high.lat && lng >= low.lng && lng <= high.lng;
}

/** True when coordinates fall inside any US bounding box. */
export function isInUnitedStates(lat: number, lng: number): boolean {
  if (!isValidLatLng(lat, lng)) return false;
  return US_BOUNDS.some((box) => inRectangle(lat, lng, box.low, box.high));
}

/**
 * Build a Google Places locationRestriction rectangle around a city center.
 * Returns null when the city has no usable coordinates.
 */
export function cityBoundingBox(
  city: Pick<City, 'lat' | 'lng'>,
  radiusMiles = DEFAULT_CITY_SEARCH_RADIUS_MILES,
): LocationRectangle | null {
  if (!isValidLatLng(city.lat, city.lng)) return null;

  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((city.lat * Math.PI) / 180));

  return {
    low: {
      latitude: city.lat - latDelta,
      longitude: city.lng - lngDelta,
    },
    high: {
      latitude: city.lat + latDelta,
      longitude: city.lng + lngDelta,
    },
  };
}

/** Detect UK postcodes or explicit non-US country/region names in an address. */
export function getNonUsAddressReason(address: string | undefined): string | null {
  if (!address?.trim()) return null;
  if (UK_POSTCODE_RE.test(address)) return 'address contains a UK postcode';
  if (NON_US_COUNTRY_RE.test(address)) return 'address names a non-US country or region';
  if (/\b(united kingdom|,\s*uk)\s*$/i.test(address.trim())) {
    return 'address ends with United Kingdom or UK';
  }
  return null;
}

/** True when the address looks like a US listing (ZIP or state code token). */
export function hasUsAddressMarkers(address: string | undefined, stateCode?: string): boolean {
  if (!address?.trim()) return false;
  if (US_ZIP_RE.test(address)) return true;
  if (/\bUSA\b/i.test(address)) return true;
  if (/\bUnited States\b/i.test(address)) return true;

  const tokens = address.split(/[,\s]+/);
  for (const token of tokens) {
    const upper = token.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (upper.length === 2 && US_STATE_CODES.has(upper)) return true;
    if (stateCode && upper === stateCode.toUpperCase()) return true;
  }
  return false;
}

function getAddressStateMismatchWarning(
  address: string | undefined,
  stateCode: string,
): string | undefined {
  if (!address?.trim()) return undefined;
  const upper = address.toUpperCase();
  const code = stateCode.toUpperCase();
  if (upper.includes(`, ${code}`) || upper.includes(`, ${code} `)) return undefined;
  if (hasUsAddressMarkers(address) && !upper.includes(code)) {
    return `address state may differ from target ${code} (border metro — not rejected)`;
  }
  return undefined;
}

/** Validate a Google Places result or stored listing against US geography rules. */
export function validateUsPlace(input: ValidateUsPlaceInput): ValidateUsPlaceResult {
  const { lat, lng, address, city } = input;

  const nonUsAddress = getNonUsAddressReason(address);
  if (nonUsAddress) return { ok: false, reason: nonUsAddress };

  if (lat === undefined || lng === undefined || !isValidLatLng(lat, lng)) {
    return { ok: false, reason: 'missing or invalid coordinates' };
  }

  if (!isInUnitedStates(lat, lng)) {
    return { ok: false, reason: 'coordinates outside the United States' };
  }

  if (isValidLatLng(city.lat, city.lng)) {
    const distance = haversineMiles(city.lat, city.lng, lat, lng);
    if (distance > MAX_RESULT_DISTANCE_MILES) {
      return {
        ok: false,
        reason: `${Math.round(distance)} mi from ${city.name}, ${city.stateCode} (max ${MAX_RESULT_DISTANCE_MILES} mi)`,
      };
    }
  }

  const warning = getAddressStateMismatchWarning(address, city.stateCode);
  return warning ? { ok: true, warning } : { ok: true };
}

/** Audit helper for listings stored without coordinates. */
export function validateLegacyListingWithoutCoords(input: {
  address?: string;
  city: Pick<City, 'name' | 'stateCode'>;
}): ValidateUsPlaceResult {
  const { address, city } = input;
  const nonUsAddress = getNonUsAddressReason(address);
  if (nonUsAddress) return { ok: false, reason: nonUsAddress };

  if (!hasUsAddressMarkers(address, city.stateCode)) {
    return {
      ok: false,
      reason: 'no coordinates and address lacks US ZIP or state marker',
    };
  }

  return { ok: true };
}
