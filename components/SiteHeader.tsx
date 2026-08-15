'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import Button from '@/components/ui/Button';

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');
  const showBack = !isHome && !isAdmin;

  function handleBack() {
    const fromSameOrigin =
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (fromSameOrigin) {
      router.back();
      return;
    }
    router.push('/');
  }

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        {showBack && (
          <Button
            type="button"
            variant="icon"
            className="site-header-back"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          </Button>
        )}

        <Link href="/" className="site-logo" aria-label="MobileTireRepair24 — Home">
          <Image
            src="/logo.png"
            alt="MobileTireRepair24"
            width={2172}
            height={724}
            priority
            className="site-logo-img"
          />
        </Link>

        <div className="site-header-search">
          <SearchBar />
        </div>

        <nav className="site-header-nav" aria-label="Main navigation">
          <Link href="/#browse-states">Browse states</Link>
        </nav>

        <Button
          type="button"
          variant="icon"
          className="site-header-search-toggle"
          onClick={() => setSearchOpen((open) => !open)}
          aria-label={searchOpen ? 'Close search' : 'Search'}
          aria-expanded={searchOpen}
        >
          {searchOpen ? (
            <X className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Search className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          )}
        </Button>
      </div>

      {searchOpen && (
        <div className="site-header-search-panel md:hidden">
          <SearchBar autoFocus />
        </div>
      )}
    </header>
  );
}
