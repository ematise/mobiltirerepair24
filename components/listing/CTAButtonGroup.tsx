'use client';

import { Phone, MessageSquare, MapPin, Share2 } from 'lucide-react';
import { useState } from 'react';

export interface CTAButtonGroupProps {
  phone: string;
  slug: string;
  name: string;
  address: string;
}

export default function CTAButtonGroup({
  phone,
  slug,
  name,
  address,
}: CTAButtonGroupProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${typeof window !== 'undefined' ? window.location.pathname : ''}`;
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Call button */}
      <a
        href={`tel:${phone}`}
        className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Phone className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Call Now</span>
      </a>

      {/* Directions */}
      <button
        onClick={handleDirections}
        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Get directions"
      >
        <MapPin className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Directions</span>
      </button>

      {/* Request quote */}
      <button
        onClick={() => {
          // Scroll to review section (assumes ReviewSection exists)
          const reviewSection = document.getElementById('review-form');
          if (reviewSection) reviewSection.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Comment</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-4 py-3 rounded-lg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={copied ? 'Copied!' : 'Share listing'}
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
      </button>
    </div>
  );
}
