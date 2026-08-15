'use client';

import { usePathname } from 'next/navigation';
import { Loader2, MapPin, X } from 'lucide-react';
import { useUserLocation } from '@/components/location/UserLocationProvider';
import Button from '@/components/ui/Button';

export default function LocationPromptBanner() {
  const pathname = usePathname();
  const {
    hasUserLocation,
    isBannerDismissed,
    status,
    requestLocation,
    dismissBanner,
  } = useUserLocation();

  const isAdmin = pathname.startsWith('/admin');
  const isLocating = status === 'locating';

  if (isAdmin || hasUserLocation || isBannerDismissed) {
    return null;
  }

  return (
    <div className="location-prompt-banner" role="region" aria-label="Location prompt">
      <button
        type="button"
        onClick={dismissBanner}
        className="location-prompt-banner-dismiss"
        aria-label="Dismiss location prompt"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="location-prompt-banner-content">
        <MapPin
          className="location-prompt-banner-icon h-5 w-5 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />

        <div className="location-prompt-banner-text min-w-0 flex-1">
          <p className="location-prompt-banner-title">Find providers near you</p>
          <p className="location-prompt-banner-body">
            Share your location to see accurate distances and sort by nearest.
          </p>
          <Button
            type="button"
            onClick={requestLocation}
            disabled={isLocating}
            aria-busy={isLocating}
            variant="primary"
            size="sm"
            className="location-prompt-banner-cta mt-2.5"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Getting location…
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                Share location
              </>
            )}
          </Button>
          <p className="location-prompt-banner-privacy mt-2">
            Stored only on this device. Never sent to our servers except to sort nearby results.
          </p>
        </div>
      </div>
    </div>
  );
}
