'use client';

import { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';

export default function StickyCallToAction() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById('hero-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function scrollToFinder() {
    const target = document.getElementById('near-me-finder');
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={scrollToFinder}
          className="flex items-center justify-center gap-2 w-full min-h-12 px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <LocateFixed className="w-5 h-5" aria-hidden="true" />
          Find Tire Repair Near Me
        </button>
      </div>
    </div>
  );
}
