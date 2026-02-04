# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** Phase 2: League Tables & Navigation

## Current Position

Phase: 2 of 7 (League Tables & Navigation)
Plan: 3 of 5 in current phase
Status: In progress
Last activity: 2026-02-04 -- Completed 02-03-PLAN.md

Progress: [████░░░░░░] 24% (6/25 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4.7 min
- Total execution time: 0.47 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-foundation | 3/3 | 16 min | 5.3 min |
| 02-league-tables | 3/5 | 12 min | 4 min |

**Recent Trend:**
- Last 5 plans: 01-03 (5 min), 02-01 (3 min), 02-02 (5 min), 02-03 (4 min)
- Trend: stable

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

### Pending Todos

- User must provision Neon database and set DATABASE_URL before running seed (see 01-USER-SETUP.md).
- User must obtain API-Football API key and set API_FOOTBALL_KEY before running seed (see 01-USER-SETUP.md).
- Run `npx drizzle-kit push` to apply schema before first `npm run seed -- --all`.

### Blockers/Concerns

- Research flags SSE on Vercel serverless as medium confidence -- polling fallback likely needed (Phase 6).
- Gambling compliance for Phase 7 requires legal consultation before implementation.
- API-Football xG data coverage may be incomplete for Ligue 1 and some Serie A matches -- handle gracefully.

## Session Continuity

Last session: 2026-02-04T23:43:43Z
Stopped at: Completed 02-03-PLAN.md (league table with zone colors)
Resume file: None (continue to 02-04-PLAN.md)
