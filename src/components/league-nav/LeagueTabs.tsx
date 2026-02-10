'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useLeague } from '@/lib/hooks/use-league';
import { LEAGUE_THEMES, type League } from '@/lib/themes/league-themes';

export function LeagueTabs() {
  const { league, setLeague, leagues } = useLeague();
  const activeTheme = LEAGUE_THEMES[league];

  return (
    <Tabs.Root
      value={league}
      onValueChange={(value) => setLeague(value as League)}
      className="w-full"
    >
      <Tabs.List className="relative flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 backdrop-blur-xl">
        {/* Ambient glow behind the entire bar — shifts color with selection */}
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-40 transition-all duration-700 blur-xl"
          style={{
            background: `radial-gradient(ellipse at 50% 100%, ${activeTheme.colors.glow}18 0%, transparent 70%)`,
          }}
        />

        {leagues.map((leagueSlug) => {
          const theme = LEAGUE_THEMES[leagueSlug];
          const isSelected = league === leagueSlug;

          return (
            <Tabs.Trigger
              key={leagueSlug}
              value={leagueSlug}
              className={clsx(
                'group relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5',
                'text-sm font-semibold tracking-wide uppercase',
                'transition-all duration-300 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
                'cursor-pointer select-none',
                isSelected
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/75'
              )}
            >
              {/* Selected background + glow */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    layoutId="league-tab-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `linear-gradient(180deg, ${theme.colors.glow}12 0%, ${theme.colors.glow}06 100%)`,
                      border: `1px solid ${theme.colors.glow}20`,
                      boxShadow: `0 0 20px ${theme.colors.glow}10, inset 0 1px 0 ${theme.colors.glow}15`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      layout: { type: 'spring', stiffness: 400, damping: 35 },
                      opacity: { duration: 0.2 },
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Bottom glow line for selected tab */}
              {isSelected && (
                <motion.div
                  layoutId="league-tab-indicator"
                  className="absolute -bottom-1 left-3 right-3 h-[2px] rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${theme.colors.glow}, transparent)`,
                    boxShadow: `0 0 8px ${theme.colors.glow}60, 0 0 20px ${theme.colors.glow}30`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 35,
                  }}
                />
              )}

              {/* League color dot */}
              <span
                className={clsx(
                  'relative z-10 h-2 w-2 rounded-full transition-all duration-300',
                  isSelected
                    ? 'scale-100 opacity-100'
                    : 'scale-75 opacity-40 group-hover:scale-90 group-hover:opacity-60'
                )}
                style={{
                  backgroundColor: theme.colors.glow,
                  boxShadow: isSelected
                    ? `0 0 6px ${theme.colors.glow}80, 0 0 12px ${theme.colors.glow}40`
                    : 'none',
                }}
              />

              {/* League name */}
              <span className="relative z-10 hidden sm:inline">{theme.name}</span>
              {/* Abbreviated name for mobile */}
              <span className="relative z-10 sm:hidden">
                {getShortName(leagueSlug)}
              </span>

              {/* Hover shimmer effect */}
              <div
                className={clsx(
                  'pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300',
                  !isSelected && 'group-hover:opacity-100'
                )}
                style={{
                  background: `radial-gradient(ellipse at 50% 80%, ${theme.colors.glow}08 0%, transparent 70%)`,
                }}
              />
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}

function getShortName(slug: League): string {
  const shortNames: Record<League, string> = {
    'premier-league': 'PL',
    'la-liga': 'LL',
    'serie-a': 'SA',
    bundesliga: 'BL',
    'ligue-1': 'L1',
  };
  return shortNames[slug];
}
