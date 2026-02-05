import { getStandingsWithZones } from '@/lib/standings/queries';
import { getZoneColor } from '@/lib/zones';
import { TableRow } from './TableRow';
import { ZoneLegend } from './ZoneLegend';

interface LeagueTableProps {
  league: string;
}

export async function LeagueTable({ league }: LeagueTableProps) {
  const data = await getStandingsWithZones(league);

  if (data.error === 'database_not_configured') {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-lg font-medium text-white/90">Database Not Configured</p>
        <p className="mt-2 text-white/70">
          Set up your database to see league standings
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
        <p className="text-white/70">League not found</p>
      </div>
    );
  }

  if (data.standings.length === 0) {
    return (
      <div className="rounded-lg bg-white/5 p-8 text-center">
        <p className="text-white/70">No standings data available</p>
        <p className="mt-2 text-sm text-white/50">
          Run the seed script to populate league data
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm">
      {/* Matchweek indicator */}
      {data.matchweek && (
        <div className="border-b border-white/10 px-4 py-3">
          <span className="text-sm text-white/50">Matchweek {data.matchweek}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              {/* Always visible columns */}
              <th className="py-3 pl-4 pr-2 text-center font-medium">#</th>
              <th className="py-3 px-2 text-left font-medium">Team</th>
              <th className="py-3 px-2 text-center font-medium">P</th>
              {/* Desktop-only columns */}
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">W</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">D</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">L</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">GF</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">GA</th>
              {/* Always visible columns */}
              <th className="py-3 px-2 text-center font-medium">GD</th>
              <th className="py-3 pl-2 pr-2 text-center font-medium">Pts</th>
              {/* Desktop-only visual columns */}
              <th className="hidden py-3 px-2 text-left font-medium md:table-cell">Form</th>
              <th className="hidden py-3 px-2 text-center font-medium md:table-cell">+/-</th>
              <th className="hidden py-3 px-2 pr-4 text-left font-medium md:table-cell">Trend</th>
              {/* Expand indicator for mobile */}
              <th className="w-8 py-3 pr-2 md:hidden"><span className="sr-only">Expand</span></th>
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
