'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LanguagePicker } from '@/components/i18n/LanguagePicker';
import { FeedbackButton } from './FeedbackDialog';
import { LEAGUES, LEAGUE_THEMES } from '@/lib/themes/league-themes';

export function Header() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const isMatchesActive = pathname?.startsWith('/matches');
  const isLeaguesActive = pathname?.startsWith('/leagues');
  const [leaguesOpen, setLeaguesOpen] = useState(false);

  return (
    <header className="relative z-50 bg-black/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Wordmark */}
        <Link
          href="/"
          aria-label={t('homeAriaLabel')}
          className="group flex items-center gap-2.5 text-white transition-colors hover:text-white/90"
        >
          {/* Football icon: circle with pentagon seam pattern */}
          <svg
            viewBox="0 0 48 48"
            className="h-7 w-7 flex-shrink-0 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--league-glow)]"
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
          {/* Wordmark text */}
          <span className="text-lg font-extrabold italic tracking-tight">
            KickLeague
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <FeedbackButton />

          {/* Leagues dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setLeaguesOpen(true)}
            onMouseLeave={() => setLeaguesOpen(false)}
          >
            <button
              className={`text-sm transition-colors ${
                isLeaguesActive
                  ? 'font-medium text-white'
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setLeaguesOpen(!leaguesOpen)}
              aria-expanded={leaguesOpen}
            >
              {t('leagues')}
            </button>
            {leaguesOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-white/10 bg-[#1a1a2e]/95 p-2 shadow-xl backdrop-blur-md z-50">
                {LEAGUES.map((slug) => {
                  const theme = LEAGUE_THEMES[slug];
                  return (
                    <Link
                      key={slug}
                      href={`/leagues/${slug}`}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      onClick={() => setLeaguesOpen(false)}
                    >
                      {theme?.logoUrl && (
                        <img
                          src={theme.logoUrl}
                          width={20}
                          height={20}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      )}
                      <span>{theme?.name ?? slug}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/matches"
            className={`text-sm transition-colors ${
              isMatchesActive
                ? 'font-medium text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {t('matches')}
          </Link>
          <LanguagePicker />
        </nav>
      </div>

      {/* Accent gradient line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--league-glow) 50%, transparent 100%)`,
          opacity: 0.25,
        }}
      />
    </header>
  );
}
