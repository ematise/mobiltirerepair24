import { isValidLatLng } from './geo';

export const USER_LOCATION_KEY = 'mtr24:user-location';
export const BANNER_DISMISS_KEY = 'mtr24:location-banner-dismissed';

export const LOCATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const BANNER_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type StoredUserLocation = {
  lat: number;
  lng: number;
  updatedAt: number;
};

export type BannerDismiss = {
  dismissedAt: number;
};

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

export function readStoredLocation(): StoredUserLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserLocation;
    if (
      !parsed ||
      typeof parsed.lat !== 'number' ||
      typeof parsed.lng !== 'number' ||
      typeof parsed.updatedAt !== 'number' ||
      !isValidLatLng(parsed.lat, parsed.lng)
    ) {
      localStorage.removeItem(USER_LOCATION_KEY);
      return null;
    }
    if (Date.now() - parsed.updatedAt > LOCATION_MAX_AGE_MS) {
      localStorage.removeItem(USER_LOCATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(USER_LOCATION_KEY);
    return null;
  }
}

export function writeStoredLocation(location: StoredUserLocation): void {
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(location));
}

export function clearStoredLocation(): void {
  localStorage.removeItem(USER_LOCATION_KEY);
}

export function isBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as BannerDismiss;
    if (!parsed?.dismissedAt) return false;
    if (Date.now() - parsed.dismissedAt > BANNER_DISMISS_TTL_MS) {
      localStorage.removeItem(BANNER_DISMISS_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(BANNER_DISMISS_KEY);
    return false;
  }
}

export function dismissBanner(): void {
  localStorage.setItem(
    BANNER_DISMISS_KEY,
    JSON.stringify({ dismissedAt: Date.now() } satisfies BannerDismiss),
  );
}

export function clearBannerDismiss(): void {
  localStorage.removeItem(BANNER_DISMISS_KEY);
}
