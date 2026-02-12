'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { MatchEventRow } from './actions';

// ── Event Icon ─────────────────────────────────────────────────────────────

function getEventIcon(type: string): string {
  switch (type) {
    case 'goal':
    case 'penalty_scored':
      return '\u26BD';
    case 'own_goal':
      return '\u26BD';
    case 'penalty_missed':
      return '\u274C';
    case 'yellow_card':
      return '\uD83D\uDFE8';
    case 'red_card':
      return '\uD83D\uDFE5';
    case 'substitution':
      return '\uD83D\uDD04';
    case 'var':
      return '\uD83D\uDCFA';
    default:
      return '';
  }
}

type TranslationFn = (key: string) => string;

function getEventLabel(type: string, t: TranslationFn): string {
  switch (type) {
    case 'own_goal':
      return `(${t('ownGoal')})`;
    case 'penalty_scored':
      return `(${t('penalty')})`;
    case 'penalty_missed':
      return `(${t('penaltyMissed')})`;
    case 'var':
      return t('varDecision');
    default:
      return '';
  }
}

// ── Minute Display ─────────────────────────────────────────────────────────

function formatMinute(minute: number, extraMinute: number | null): string {
  if (extraMinute !== null) {
    return `${minute}+${extraMinute}'`;
  }
  return `${minute}'`;
}

// ── Event Content ──────────────────────────────────────────────────────────

function PlayerName({ name, slug, locale }: { name: string; slug: string | null; locale: string }) {
  if (slug) {
    return (
      <a
        href={`/${locale}/players/${slug}`}
        className="text-sm font-medium text-white/90 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/50"
      >
        {name}
      </a>
    );
  }
  return <span className="text-sm font-medium text-white/90">{name}</span>;
}

function AssistPlayerName({ name, slug, locale }: { name: string; slug: string | null; locale: string }) {
  if (slug) {
    return (
      <a
        href={`/${locale}/players/${slug}`}
        className="text-white/50 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/70 hover:decoration-white/40"
      >
        {name}
      </a>
    );
  }
  return <>{name}</>;
}

function EventContent({ event, t, locale }: { event: MatchEventRow; t: TranslationFn; locale: string }) {
  const icon = getEventIcon(event.type);
  const label = getEventLabel(event.type, t);

  return (
    <div>
      <div className="flex items-center gap-1">
        <span>{icon}</span>
        {label && <span className="text-xs font-medium text-white/70">{label}</span>}
        {event.playerName ? (
          <PlayerName name={event.playerName} slug={event.playerSlug} locale={locale} />
        ) : (
          <span className="text-sm font-medium text-white/90">{t('unknown')}</span>
        )}
      </div>
      {event.type === 'substitution' && event.assistPlayerName && (
        <p className="text-xs text-white/40">{t('forPlayer')} <AssistPlayerName name={event.assistPlayerName} slug={event.assistPlayerSlug} locale={locale} /></p>
      )}
      {event.type !== 'substitution' && event.assistPlayerName && (
        <p className="text-xs text-white/40">{t('assist')} <AssistPlayerName name={event.assistPlayerName} slug={event.assistPlayerSlug} locale={locale} /></p>
      )}
      {event.detail && event.type !== 'substitution' && (
        <p className="text-[10px] text-white/30">{event.detail}</p>
      )}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface EventsTimelineProps {
  events: MatchEventRow[];
  homeTeamId: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function EventsTimeline({ events, homeTeamId }: EventsTimelineProps) {
  const t = useTranslations('MatchDetail');
  const locale = useLocale();

  if (events.length === 0) {
    return (
      <section className="glow-card rounded-xl bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t('matchEvents')}</h2>
        <p className="text-sm text-white/40">{t('noEventsRecorded')}</p>
      </section>
    );
  }

  return (
    <section className="glow-card rounded-xl bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{t('matchEvents')}</h2>
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />

        <div className="space-y-3">
          {events.map((event) => {
            const isHome = event.teamId === homeTeamId;

            return (
              <div key={event.id} className="flex items-start">
                {/* Home side (left) */}
                <div className="flex flex-1 justify-end pr-4">
                  {isHome && <EventContent event={event} t={t} locale={locale} />}
                </div>

                {/* Center: minute marker */}
                <div className="z-10 flex h-7 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
                  {formatMinute(event.minute, event.extraMinute)}
                </div>

                {/* Away side (right) */}
                <div className="flex flex-1 pl-4">
                  {!isHome && <EventContent event={event} t={t} locale={locale} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
