# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** Phase 7 in progress. Plan 01 (Odds API client and schema) complete. Continuing with odds ingestion and UI.

## Current Position

Phase: 7 of 7 (Betting, Odds & Localisation)
Plan: 1 of 5 complete in current phase
Status: In progress
Last activity: 2026-02-05 -- Completed 07-01-PLAN.md

Progress: [████████░░] 84% (21/25 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 4.1 min
- Total execution time: 1.51 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-foundation | 3/3 | 16 min | 5.3 min |
| 02-league-tables | 5/5 | 21 min | 4.2 min |
| 03-match-fixture-pages | 3/3 | 14 min | 4.7 min |
| 04-team-detail-pages | 3/3 | 18.8 min | 6.3 min |
| 05-season-timeline | 3/3 | 8 min | 2.7 min |
| 06-live-data-pipeline | 3/3 | 14 min | 4.7 min |
| 07-betting-odds-localisation | 1/5 | 3 min | 3.0 min |

**Recent Trend:**
- Last 5 plans: 05-03 (1 min), 06-03 (3 min), 06-01 (6 min), 06-02 (5 min), 07-01 (3 min)

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
- 04-02: HomeAwayBars uses CSS percentage-width bars (not Recharts) -- consistent with ComparativeStats pattern.
- 04-02: xG section omitted entirely when hasXg is false -- avoids empty chart state.
- 04-02: Own goals in scoring-first analysis correctly invert teamId check.
- 04-02: Goals bucketed with Math.min(Math.floor((minute-1)/15), 5) -- 90+ goals merge to last bucket.
- 04-02: BumpChart shows focus team as thick green line, rivals as thin low-opacity lines.
- 04-03: Appearances used as proxy for minutes distribution (minutes data not available).
- 04-03: useRouter + stopPropagation for team links inside MatchCard (avoids nested <a> tags).
- 04-03: Fixture difficulty: position 1-6 hard (red), 7-14 medium (amber), 15+ easy (green).
- 04-03: Top performer cards conditionally hidden when stat = 0 (early season edge case).
- 05-01: Motion layout="position" chosen over layout={true} to prevent child element distortion during animation.
- 05-01: NumberFlow trend={0} for shortest-path digit spin (no forced up/down direction).
- 05-01: lte bound added to sparkline query so historical matchweek views don't show future data.
- 05-01: CSS Grid 14-column template shared between header and AnimatedTableRow for consistent alignment.
- 05-02: useMatchweek default value from latestCompleted -- null URL param shows current standings.
- 05-02: Drag threshold 5px to distinguish click from drag on timeline strip.
- 05-02: Auto-play replay restarts from matchweek 1 when at end.
- 05-02: LeagueTableWrapper is integration point managing matchweek state, timeline, and historical banner.
- 05-02: League change resets matchweek to null (current) via prevLeagueRef tracking.
- 05-03: NavArrows always visible with disabled state (not hidden) for consistent layout.
- 05-03: Double-chevron SVG distinguishes 5-week jump from single-step circle click.
- 05-03: earliestCompleted computed inline from matchweeks array for left boundary clamping.
- 06-01: Runtime QStash verification via lazy Receiver import (avoids build-time env var requirement).
- 06-01: Fixed .js extension imports in client.ts for Next.js bundler compatibility.
- 06-01: Pipeline budget default 80 calls/day (reserves 20 for manual use from 100/day free tier).
- 06-01: Active fixture window: 3 hours before/after kickoff, excluding terminal statuses.
- 06-01: Match completion detection: compare old DB status vs new API status, collect for downstream chain.
- 06-03: League-specific match window check (not global) for precise adaptive polling intervals.
- 06-03: React key remount strategy for silent data refresh (simplest approach since LeagueTableClient refetches on mount).
- 06-03: Season hardcoded to '2025' with TODO to derive dynamically from league config.
- 06-03: Polling disabled during historical matchweek viewing.
- 06-03: Stale closure protection via useRef for onUpdate callback in usePolling hook.
- 06-02: Standings algorithm inlined in match-completion.ts (not shared with seed) for independent evolution.
- 06-02: Drift detection checks latest fully-completed matchweek only (all fixtures finished).
- 06-02: Daily resync processes leagues sequentially to stay within API rate limits.
- 06-02: revalidatePath wrapped in try/catch for test/non-request context safety.
- 07-01: Odds format conversion uses common fractions lookup table with GCD fallback (no external dependency).
- 07-01: Odds API client uses partial-accept Zod pattern matching api-football/client.ts conventions.
- 07-01: Sport key map is static with runtime discovery available via fetchSportsKeys().
- 07-01: fixture_odds table stores prev_*_odds for movement tracking (shortened/drifted indicators).

### Pending Todos

- User must provision Neon database and set DATABASE_URL before running seed (see 01-USER-SETUP.md).
- User must obtain API-Football API key and set API_FOOTBALL_KEY before running seed (see 01-USER-SETUP.md).
- Run `npx drizzle-kit push` to apply schema before first `npm run seed -- --all`.
- Run `npx drizzle-kit push` to create api_call_log table (new in 06-01).
- **API upgrade milestone**: Upgrade API-Football subscription to populate fixture_events and fixture_stats. The batch `ids` parameter returns empty on the free tier. Once upgraded, re-run seed to populate events/stats — UI sections auto-show when data exists (goals by period, xG, scoring first record, player appearances/goals/assists/cards, top performer cards).
- **Re-run `npm run seed -- --all` to populate historical standings data** (required for sparklines and position changes to display).
- Set QStash env vars (QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY) and run `npm run setup-qstash` after deployment.
- Set CRON_SECRET in Vercel environment variables for daily resync cron route protection.
- Set ODDS_API_KEY environment variable (get from https://the-odds-api.com/).
- Run `npx drizzle-kit push` to create fixture_odds and affiliate_clicks tables.

### Blockers/Concerns

- Gambling compliance for Phase 7 requires legal consultation before implementation.
- API-Football xG data coverage may be incomplete for Ligue 1 and some Serie A matches -- handle gracefully.

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 07-01-PLAN.md (Odds API client and schema)
Resume file: None
