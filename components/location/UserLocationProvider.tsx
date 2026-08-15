'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearBannerDismiss,
  clearStoredLocation,
  dismissBanner as persistBannerDismiss,
  GEOLOCATION_OPTIONS,
  isBannerDismissed,
  readStoredLocation,
  writeStoredLocation,
  type StoredUserLocation,
} from '@/lib/user-location';

export type LocationStatus =
  | 'idle'
  | 'locating'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error';

type UserLocationContextValue = {
  location: StoredUserLocation | null;
  status: LocationStatus;
  hasUserLocation: boolean;
  isBannerDismissed: boolean;
  requestLocation: () => void;
  clearLocation: () => void;
  dismissBanner: () => void;
};

const UserLocationContext = createContext<UserLocationContextValue | null>(null);

export function useUserLocation(): UserLocationContextValue {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    throw new Error('useUserLocation must be used within UserLocationProvider');
  }
  return ctx;
}

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<StoredUserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      setLocation(stored);
      setStatus('granted');
    }
    setBannerDismissed(isBannerDismissed());
    setHydrated(true);
  }, []);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: StoredUserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: Date.now(),
        };
        writeStoredLocation(next);
        clearBannerDismiss();
        setLocation(next);
        setBannerDismissed(false);
        setStatus('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const clearLocation = useCallback(() => {
    clearStoredLocation();
    setLocation(null);
    setStatus('idle');
  }, []);

  const dismissBanner = useCallback(() => {
    persistBannerDismiss();
    setBannerDismissed(true);
  }, []);

  const value = useMemo(
    () => ({
      location: hydrated ? location : null,
      status: hydrated ? status : 'idle',
      hasUserLocation: hydrated && location !== null,
      isBannerDismissed: hydrated && bannerDismissed,
      requestLocation,
      clearLocation,
      dismissBanner,
    }),
    [
      hydrated,
      location,
      status,
      bannerDismissed,
      requestLocation,
      clearLocation,
      dismissBanner,
    ],
  );

  return (
    <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>
  );
}
