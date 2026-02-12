---
phase: 26-internal-discovery-links
plan: 02
subsystem: ui
tags: [internal-linking, navigation, seo, next-intl, header]

# Dependency graph
requires:
  - phase: 25-head-to-head-pages
    provides: H2H page routes at /h2h/[matchup]
  - phase: 24-player-pages
    provides: Player page routes at /players/[slug]
  - phase: 22-league-pages
    provides: League page routes at /leagues/[slug]
provides:
  - H2H page links from match detail H2H section
  - Player profile links from match events timeline
  - Leagues dropdown navigation in site header
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Extended MatchEventRow with slug fields for linking without extra DB queries

key-files:
  created: []
  modified:
    - src/components/match-detail/H2HSection.tsx
    - src/components/match-detail/EventsTimeline.tsx
    - src/components/match-detail/actions.ts
    - src/components/header/Header.tsx
    - src/app/[locale]/matches/[id]/page.tsx
    - src/messages/en.json
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "Extended MatchEventRow type with playerSlug/assistPlayerSlug rather than separate DB query for efficiency"
  - "Used team slugs already on MatchDetailTeam (no getTeamSlugsById needed)"
  - "Hover dropdown for leagues (not separate page) for quick access without navigation"

patterns-established:
  - "Player name linking: wrap in anchor with underline-offset decoration style"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 26 Plan 02: Match Detail & Header Discovery Links Summary

**H2H section links to full comparison page, player names in events link to profiles, and header gains a leagues dropdown with all 5 league logos**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T23:11:40Z
- **Completed:** 2026-02-12T23:17:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Match detail H2H section now links to the full /h2h/[team1]-vs-[team2] page with a "View full head-to-head" call-to-action
- Player names in the events timeline are clickable links to their /players/[slug] profile pages (with graceful fallback for players without slugs)
- Site header has a "Leagues" hover dropdown showing all 5 leagues with logos and names, linking to /leagues/[slug]
- All new UI text translated in 5 locales (en, es, de, it, fr)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add H2H page link and player links from match detail pages** - `42b7b37` (feat)
2. **Task 2: Add leagues navigation to site header** - `56e1dba` (feat)

## Files Created/Modified
- `src/components/match-detail/H2HSection.tsx` - Added team1Slug/team2Slug props and "View full H2H" link at section bottom
- `src/components/match-detail/EventsTimeline.tsx` - Added PlayerName/AssistPlayerName link components, useLocale for URL building
- `src/components/match-detail/actions.ts` - Extended MatchEventRow with playerSlug and assistPlayerSlug, updated fetchMatchEvents query
- `src/app/[locale]/matches/[id]/page.tsx` - Pass team slugs to both H2HSection instances (completed and upcoming)
- `src/components/header/Header.tsx` - Added Leagues hover dropdown with useState, LEAGUES import, active state detection
- `src/messages/{en,es,de,it,fr}.json` - Added leagues key to Navigation namespace

## Decisions Made
- Extended MatchEventRow type with playerSlug/assistPlayerSlug fields directly in the query join rather than making a separate getPlayerSlugsById round-trip. More efficient, zero additional DB calls.
- Discovered that MatchDetailTeam already includes slug, so the plan's getTeamSlugsById was unnecessary. Used existing data directly.
- Used hover dropdown for leagues navigation (not a link to a leagues index page) for immediate access from any page.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used existing team slugs instead of creating getTeamSlugsById**
- **Found during:** Task 1 (H2H link implementation)
- **Issue:** Plan assumed team slugs were not available on match detail data, but MatchDetailTeam already has a slug field
- **Fix:** Passed match.homeTeam.slug and match.awayTeam.slug directly, skipped creating getTeamSlugsById helper
- **Files modified:** src/app/[locale]/matches/[id]/page.tsx
- **Verification:** TypeScript passes, slugs correctly threaded to H2HSection

**2. [Rule 3 - Blocking] Extended MatchEventRow instead of creating getPlayerSlugsById**
- **Found during:** Task 1 (player link implementation)
- **Issue:** Plan suggested a separate getPlayerSlugsById query, but the fetchMatchEvents query already joins the players table
- **Fix:** Added playerSlug and assistPlayerSlug to the existing select query and MatchEventRow type, avoiding an extra DB round-trip
- **Files modified:** src/components/match-detail/actions.ts
- **Verification:** TypeScript passes, player slugs available in EventsTimeline without additional queries

---

**Total deviations:** 2 auto-fixed (2 blocking -- simpler approach found)
**Impact on plan:** Both deviations improved efficiency. Removed 2 unnecessary database queries while achieving the same outcome.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 26 complete -- all internal discovery links are in place
- Every major page type (homepage, match detail, header) now provides organic links to programmatic SEO pages
- Ready for milestone completion

## Self-Check: PASSED

All files exist, all commits found, all key content verified.

---
*Phase: 26-internal-discovery-links*
*Completed: 2026-02-12*
