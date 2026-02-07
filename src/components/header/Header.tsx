'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';

export function Header() {
  const pathname = usePathname();
  const isMatchesActive = pathname?.startsWith('/matches');

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="KickLeague home"
          className="flex items-center gap-2 text-white transition-colors hover:text-white/90"
        >
          {/* Football icon: circle with pentagon seam pattern */}
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="24" cy="24" r="22" strokeWidth="2.5" />
            <polygon
              points="24,10 33.5,17 30,28.5 18,28.5 14.5,17"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="24" y1="10" x2="24" y2="2" strokeWidth="1.5" />
            <line x1="33.5" y1="17" x2="44" y2="12" strokeWidth="1.5" />
            <line x1="30" y1="28.5" x2="40" y2="38" strokeWidth="1.5" />
            <line x1="18" y1="28.5" x2="8" y2="38" strokeWidth="1.5" />
            <line x1="14.5" y1="17" x2="4" y2="12" strokeWidth="1.5" />
          </svg>
          {/* Wordmark text: sporty italic bold matching brand identity */}
          <span className="text-lg font-extrabold italic tracking-tight">
            KickLeague
          </span>
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
