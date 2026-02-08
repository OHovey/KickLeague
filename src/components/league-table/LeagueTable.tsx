import { getTranslations } from 'next-intl/server';
import { getStandingsWithZones } from '@/lib/standings/queries';
import { getZoneColor } from '@/lib/zones';
import { TableRow } from './TableRow';
import { ZoneLegend } from './ZoneLegend';

interface LeagueTableProps {
  league: string;
}

export async function LeagueTable({ league }: LeagueTableProps) {
  const t = await getTranslations('LeagueTable');
  const tCommon = await getTranslations('Common');
  const data = await getStandingsWithZones(league);

  if (data.error === 'database_not_configured') {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-lg font-medium text-white/90">{tCommon('databaseNotConfigured')}</p>
        <p className="mt-2 text-white/70">
          {tCommon('setupDatabase')}
        </p>
        <div className="mt-4 rounded bg-black/30 p-4 text-left">
          <p className="text-xs font-mono text-white/50">1. Create a Neon database at neon.tech</p>
          <p className="text-xs font-mono text-white/50 mt-1">2. Copy DATABASE_URL to .env.local</p>
          <p className="text-xs font-mono text-white/50 mt-1">3. Run: npx drizzle-kit push</p>
          <p className="text-xs font-mono text-white/50 mt-1">4. Run: npm run seed -- --all</p>
        </div>
      </div>
    );
  }

  if (!data.league) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">{tCommon('leagueNotFound')}</p>
      </div>
    );
  }

  if (data.standings.length === 0) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">{t('noStandingsData')}</p>
        <p className="mt-2 text-sm text-white/50">
          {tCommon('neonInstructions')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      {/* Table header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-baseline gap-2">
        <h2 className="text-sm font-medium text-white/70">{t('standings')}</h2>
        {data.matchweek && (
          <span className="text-xs text-white/40">{t('matchweekN', { week: data.matchweek })}</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              {/* Always visible columns */}
              <th className="py-3 pl-4 pr-2 text-center font-medium">#</th>
              <th className="py-3 px-2 text-left font-medium">{t('team')}</th>
              <th className="py-3 px-2 text-center font-medium">{t('played')}</th>
              {/* Desktop-only columns */}
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('won')}</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('drawn')}</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('lost')}</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('goalsFor')}</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('goalsAgainst')}</th>
              {/* Always visible columns */}
              <th className="py-3 px-2 text-center font-medium">{t('goalDifference')}</th>
              <th className="py-3 pl-2 pr-2 text-center font-medium">{t('points')}</th>
              {/* Desktop-only visual columns */}
              <th className="hidden py-3 px-2 text-left font-medium md:table-cell">{t('form')}</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">{t('positionChange')}</th>
              <th className="hidden py-3 px-2 pr-4 text-left font-medium md:table-cell">{t('trend')}</th>
              {/* Expand indicator for mobile */}
              <th className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">{t('expand')}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.standings.map((row) => (
              <TableRow
                key={row.teamId}
                row={row}
                zoneColor={getZoneColor(data.zones, row.position)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Zone legend */}
      <div className="border-t border-white/10 px-4 py-3">
        <ZoneLegend zones={data.zones} />
      </div>
    </div>
  );
}
