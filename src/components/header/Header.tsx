'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';

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
          KickLeague
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
          <LanguagePicker />
        </nav>
      </div>
    </header>
  );
}
