'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface PhotoGalleryProps {
  photos: string[];
  businessName: string;
}

export default function PhotoGallery({ photos, businessName }: PhotoGalleryProps) {
  if (!photos || photos.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrentIndex((i) => (i + 1) % photos.length);

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative bg-gray-100 rounded-[14px] overflow-hidden aspect-video">
        <Image
          src={photos[currentIndex]}
          alt={`${businessName} service photo ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority={currentIndex === 0}
        />

        {/* Navigation buttons */}
        {photos.length > 1 && (
          <>
            <Button
              type="button"
              variant="icon"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-surface"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="icon"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2.5 py-1 rounded text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail carousel */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                idx === currentIndex ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              <Image
                src={photo}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
