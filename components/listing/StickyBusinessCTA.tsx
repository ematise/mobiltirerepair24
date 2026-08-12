'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function StickyBusinessCTA({
  phone,
  name,
}: {
  phone: string;
  name: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('business-primary-cta');
    if (!sentinel) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="max-w-lg mx-auto px-4 py-3 flex gap-2.5">
        <Button href={`sms:${phone}`} variant="secondary" className="w-[32%]" aria-label={`Text ${name}`}>
          <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden="true" />
          Text
        </Button>
        <Button href={`tel:${phone}`} variant="primary" className="flex-1" aria-label={`Call ${name}`}>
          <Phone className="w-[18px] h-[18px]" strokeWidth={2} fill="currentColor" aria-hidden="true" />
          Call now
        </Button>
      </div>
    </div>
  );
}
