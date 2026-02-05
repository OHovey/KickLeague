# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** Phase 4 in progress. Team detail page foundation complete (plan 01). Next: Performance tab (plan 02).

## Current Position

Phase: 4 of 7 (Team Detail Pages)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-05 -- Completed 04-01-PLAN.md

Progress: [█████░░░░░] 48% (12/25 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 4.3 min
- Total execution time: 0.89 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-foundation | 3/3 | 16 min | 5.3 min |
| 02-league-tables | 5/5 | 21 min | 4.2 min |
| 03-match-fixture-pages | 3/3 | 14 min | 4.7 min |
| 04-team-detail-pages | 1/3 | 2.5 min | 2.5 min |

**Recent Trend:**
- Last 5 plans: 03-01 (4 min), 03-02 (4 min), 03-03 (6 min), 04-01 (2.5 min)
- Trend: improving (04-01 fastest plan yet -- straightforward query + component creation)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 7 phases derived from 43 requirements across 9 categories. Standard depth applied.
- Roadmap: Betting odds and localisation combined into Phase 7 (both are cross-cutting enhancements independent of core product).
- Roadmap: Live data pipeline (Phase 6) placed after core UI phases so automated polling builds on stable rendering.
- 01-01: Zone definitions modelled as position-range data rows in league_zones table (simplest for Phase 2 rendering).
- 01-01: Tiebreaker order stored as comma-separated string in league_config for Drizzle compatibility.
- 01-01: Home/away splits included directly in standings table to avoid JOIN overhead.
- 01-02: Zod v4 used (backward compatible safeParse/passthrough APIs). z.record requires two args.
- 01-02: Cache returns stale data on schema evolution rather than re-fetching (preserves API quota).
- 01-02: All schemas use partial accept pattern: safeParse always, nullable/optional liberally, passthrough on all objects.
- 01-03: League zones use delete+insert (no single-row unique constraint on zones).
- 01-03: Fixture events use delete+insert per fixture for idempotent re-runs.
- 01-03: Points deductions auto-detected by comparing actual vs expected points.
- 01-03: Refresh mode re-fetches teams (for ID map) but skips players.
- 02-01: H2H totals calculated only among tied teams (correct for multi-way ties).
- 02-01: Alphabetical fallback when all tiebreakers exhausted.
- 02-01: Vitest configured with ESM (.mts extension) for Vite 7.x compatibility.
- 02-02: Spread LEAGUES array for nuqs parseAsStringEnum to avoid readonly type issue.
- 02-02: Suspense boundary required for useSearchParams in Next.js 15 static builds.
- 02-02: Dual-layer opacity technique for gradient transitions (CSS cannot transition gradients directly).
- 02-03: Server action pattern used for data fetching in client component context.
- 02-03: LeagueTableWrapper bridges client league state to server-fetched data.
- 02-03: H2H matrix built from finished fixtures for tiebreaker calculations.
- 02-04: Sparkline Y-axis inverted so line going UP = team improving toward 1st.
- 02-04: Position change calculated as previousPosition - currentPosition (positive = moved up).
- 02-04: Custom tooltip types defined locally to avoid recharts v3 typing issues.
- 02-05: Mobile columns: #, Team, P, GD, Pts (essential info); W/D/L/GF/GA hidden until row expanded.
- 02-05: Three table expand states (collapsed/default/expanded) with localStorage persistence.
- 02-05: 44px minimum touch targets for accessibility compliance.
- Bug fix: Historical standings computed from fixtures at seed time, not just API snapshot (enables sparklines/position change).
- Bug fix: ThemeBackground uses radial edge/corner gradients fading to neutral dark center (more subtle/professional).
- Bug fix: Zone color indicator moved inside position cell as absolute div (fixes column alignment).
- Bug fix: Skeleton loading state shown during all pending states, not just initial load.
- 03-01: drizzle-orm alias() for homeTeam/awayTeam double-join on fixtures table.
- 03-01: Batch getTeamForm at max matchweek avoids N+1 per-card queries.
- 03-01: Server actions serialize Map to Record for JSON transfer.
- 03-01: "Odds coming soon" placeholder on upcoming fixture cards (MATL-04 structural prep).
- 03-02: getLeagueSlugById helper in actions.ts resolves fixture leagueId to slug for ThemeBackground on detail page (avoids nuqs dependency).
- 03-02: lowerIsBetter flag in ComparativeStats inverts bar widths for league position and goals conceded comparisons.
- 03-02: Substitution events show assistPlayerName as "for {player}" rather than "Assist" for correct semantic meaning.
- 03-03: H2H data lazy-loaded inline per card on mount (not batch) to avoid N+1 upfront queries.
- 03-03: Expand/collapse removed from match cards -- all info visible by default for better UX.
- 03-03: formatMatchDateShort added for compact "Sat 1 Feb" display on cards.
- 04-01: TeamPageData bundles team info + current standings + hasXg flag in single server action call.
- 04-01: fetchOverviewData takes teamName as parameter for pivot extraction rather than re-querying.
- 04-01: Tab content placeholders for plans 04-02 and 04-03 to fill with real components.

### Pending Todos

- User must provision Neon database and set DATABASE_URL before running seed (see 01-USER-SETUP.md).
- User must obtain API-Football API key and set API_FOOTBALL_KEY before running seed (see 01-USER-SETUP.md).
- Run `npx drizzle-kit push` to apply schema before first `npm run seed -- --all`.
- **Re-run `npm run seed -- --all` to populate historical standings data** (required for sparklines and position changes to display).

### Blockers/Concerns

- Research flags SSE on Vercel serverless as medium confidence -- polling fallback likely needed (Phase 6).
- Gambling compliance for Phase 7 requires legal consultation before implementation.
- API-Football xG data coverage may be incomplete for Ligue 1 and some Serie A matches -- handle gracefully.

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 04-01-PLAN.md (team detail page foundation)
Resume file: None
