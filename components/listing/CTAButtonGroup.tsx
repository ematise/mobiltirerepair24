'use client';

import { Phone, MessageSquare, MapPin, Share } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { trackCallClick } from '@/lib/analytics';

export interface CTAButtonGroupProps {
  phone: string;
  slug: string;
  citySlug: string;
  name: string;
  address: string;
  responseTime?: string;
}

export default function CTAButtonGroup({
  phone,
  slug,
  citySlug,
  name,
  address,
  responseTime,
}: CTAButtonGroupProps) {
  const [copied, setCopied] = useState(false);

  const trackCall = () => trackCallClick(slug, citySlug);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${name}, ${address}`);
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  return (
    <div>
      <Button
        id="business-primary-cta"
        href={`tel:${phone}`}
        variant="primary"
        size="lg"
        block
        aria-label={`Call ${name}`}
        onClick={trackCall}
      >
        <Phone className="w-5 h-5" strokeWidth={2} fill="currentColor" aria-hidden="true" />
        Call now
      </Button>

      <p className="text-center text-[13px] text-muted mt-2.5">
        Average response time: {responseTime || '30–45 min'}
      </p>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <Button href={`sms:${phone}`} variant="secondary" tile aria-label={`Text ${name}`} onClick={trackCall}>
          <MessageSquare className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
          Text
        </Button>

        <Button type="button" variant="secondary" tile onClick={handleDirections} aria-label="Get directions">
          <MapPin className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
          Directions
        </Button>

        <Button
          type="button"
          variant="secondary"
          tile
          onClick={handleShare}
          aria-label={copied ? 'Link copied' : 'Share listing'}
        >
          <Share className="w-5 h-5" strokeWidth={1.8} aria-hidden="true" />
          {copied ? 'Copied' : 'Share'}
        </Button>
      </div>
    </div>
  );
}
