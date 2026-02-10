'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { LEAGUE_THEMES, type League } from '@/lib/themes/league-themes';
import { MatchListClient } from './MatchListClient';

const TAB_VALUES = ['results', 'fixtures'] as const;
type TabValue = (typeof TAB_VALUES)[number];

interface ResultsFixturesTabsProps {
  league: string;
}

export function ResultsFixturesTabs({ league }: ResultsFixturesTabsProps) {
  const t = useTranslations('Matches');
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum([...TAB_VALUES]).withDefault('results')
  );

  const theme = LEAGUE_THEMES[league as League] ?? LEAGUE_THEMES['premier-league'];

  return (
    <div className="space-y-6">
      <Tabs.Root
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="w-full"
      >
        <Tabs.List className="relative inline-flex gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 backdrop-blur-xl">
          {TAB_VALUES.map((value) => {
            const isSelected = tab === value;

            return (
              <Tabs.Trigger
                key={value}
                value={value}
                className={clsx(
                  'group relative flex items-center gap-2 rounded-lg px-5 py-2',
                  'text-sm font-semibold tracking-wide uppercase',
                  'transition-all duration-300 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
                  'cursor-pointer select-none',
                  isSelected
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/75'
                )}
              >
                {/* Sliding pill background */}
                {isSelected && (
                  <motion.div
                    layoutId="results-fixtures-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `linear-gradient(180deg, ${theme.colors.glow}14 0%, ${theme.colors.glow}08 100%)`,
                      border: `1px solid ${theme.colors.glow}20`,
                      boxShadow: `0 0 16px ${theme.colors.glow}0c, inset 0 1px 0 ${theme.colors.glow}15`,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 35,
                    }}
                  />
                )}

                {/* Bottom glow line */}
                {isSelected && (
                  <motion.div
                    layoutId="results-fixtures-indicator"
                    className="absolute -bottom-1 left-4 right-4 h-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${theme.colors.glow}, transparent)`,
                      boxShadow: `0 0 6px ${theme.colors.glow}50, 0 0 14px ${theme.colors.glow}25`,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 35,
                    }}
                  />
                )}

                {/* Icon */}
                <span className="relative z-10">
                  {value === 'results' ? (
                    <ResultsIcon isSelected={isSelected} glowColor={theme.colors.glow} />
                  ) : (
                    <FixturesIcon isSelected={isSelected} glowColor={theme.colors.glow} />
                  )}
                </span>

                {/* Label */}
                <span className="relative z-10">
                  {value === 'results' ? t('results') : t('fixtures')}
                </span>

                {/* Hover shimmer */}
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

      <MatchListClient league={league} tab={tab} />
    </div>
  );
}

function ResultsIcon({ isSelected, glowColor }: { isSelected: boolean; glowColor: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={clsx(
        'transition-all duration-300',
        isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'
      )}
      style={isSelected ? { filter: `drop-shadow(0 0 4px ${glowColor}80)` } : undefined}
    >
      {/* Whistle / final result icon — checkmark in circle */}
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 7L6.5 9L9.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FixturesIcon({ isSelected, glowColor }: { isSelected: boolean; glowColor: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={clsx(
        'transition-all duration-300',
        isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'
      )}
      style={isSelected ? { filter: `drop-shadow(0 0 4px ${glowColor}80)` } : undefined}
    >
      {/* Calendar / upcoming icon */}
      <rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 5.5H12.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 1V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 1V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
