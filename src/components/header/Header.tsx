'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isMatchesActive = pathname?.startsWith('/matches');

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Site title */}
        <Link
          href="/"
          className="text-lg font-bold text-white transition-colors hover:text-white/90"
        >
          KickData
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link
            href="/matches"
            className={`text-sm transition-colors ${
              isMatchesActive
                ? 'font-medium text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Matches
          </Link>
          <span className="text-xs text-white/30">EN</span>
        </nav>
      </div>
    </header>
  );
}
