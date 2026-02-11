'use client';

import { useTranslations } from 'next-intl';
import { FormBadges } from '@/components/league-table/FormBadges';
import type { TeamPageData } from './actions';

interface TeamHeroProps {
  team: TeamPageData;
}

export function TeamHero({ team }: TeamHeroProps) {
  const t = useTranslations('Teams');
  const { standings } = team;

  return (
    <section className="py-8">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
        {/* Accent gradient orb */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            backgroundColor: 'var(--league-glow)',
            opacity: 0.1,
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full blur-3xl"
          style={{
            backgroundColor: 'var(--league-primary)',
            opacity: 0.06,
          }}
        />

        {/* Mobile: stacked, Desktop: side by side */}
        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Team logo */}
          <div className="flex-shrink-0">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`${team.name} logo`}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-white/10 text-2xl font-bold text-white/50">
                {team.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Team info + stats */}
          <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
            {/* Name and stadium */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{team.name}</h1>
              {team.stadiumName && (
                <p className="mt-0.5 text-sm text-white/60">{team.stadiumName}</p>
              )}
              <span className="mt-1 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/70">
                {team.leagueName}
              </span>
            </div>

            {/* Callout numbers + form */}
            {standings && (
              <div className="flex items-center gap-6">
                {/* Position - accent colored */}
                <div className="text-center">
                  <span
                    className="text-3xl font-extrabold"
                    style={{ color: 'var(--league-glow)' }}
                  >
                    #{standings.position}
                  </span>
                  <p className="text-xs text-white/50">{t('position')}</p>
                </div>

                {/* Points */}
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">
                    {standings.points}
                  </span>
                  <p className="text-xs text-white/50">{t('points')}</p>
                </div>

                {/* Played */}
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white/80">
                    {standings.played}
                  </span>
                  <p className="text-xs text-white/50">{t('played')}</p>
                </div>

                {/* Goal difference */}
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white/80">
                    {standings.goalDifference > 0 ? '+' : ''}
                    {standings.goalDifference}
                  </span>
                  <p className="text-xs text-white/50">{t('gd')}</p>
                </div>
              </div>
            )}

            {/* Form badges */}
            {standings?.form && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{t('currentForm')}</span>
                <FormBadges form={standings.form} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 10%, var(--league-glow) 50%, transparent 90%)`,
            opacity: 0.15,
          }}
        />
      </div>
    </section>
  );
}
