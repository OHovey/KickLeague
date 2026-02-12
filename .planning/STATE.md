# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** v1.4 Programmatic SEO -- Phase 26 added (Internal Discovery Links)

## Current Position

Phase: 26 of 26 (Internal Discovery Links)
Plan: 2 of 2
Status: Phase 26 COMPLETE -- all plans executed
Last activity: 2026-02-12 -- 26-02 Match detail & header discovery links

Progress: [##########] 100% (2/2 plans in Phase 26)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 26
- Average duration: 3.8 min
- Total execution time: ~1.77 hours

**v1.1 Velocity:**
- Total plans completed: 6
- Average duration: 2.5 min

**v1.2 Velocity:**
- Total plans completed: 21
- Timeline: 5 days (2026-02-07 to 2026-02-09)

**v1.3 Velocity:**
- Total plans completed: 9
- Timeline: 3 days (2026-02-10 to 2026-02-12)

**v1.4 Velocity:**
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 21    | 01   | 3min     | 2     | 5     |
| 21    | 02   | 4min     | 2     | 1     |
| 22    | 01   | 5min     | 2     | 9     |
| 22    | 02   | 3min     | 2     | 5     |
| 23    | 01   | 4min     | 2     | 9     |
| 23    | 02   | 3min     | 2     | 10    |
| 24    | 01   | 10min    | 2     | 14    |
| 24    | 02   | 8min     | 2     | 5     |
| 25    | 01   | 6min     | 2     | 9     |
| 25    | 02   | 9min     | 2     | 13    |
| 26    | 01   | 3min     | 2     | 9     |
| 26    | 02   | 6min     | 2     | 10    |

## Accumulated Context

### Decisions

All decisions logged in PROJECT.md Key Decisions table (20 decisions, all marked Good).

v1.4 decisions:
- Used src/app/sitemap.xml/ directory-based route for /sitemap.xml path (Next.js 16 supports dots in route dirs)
- Used kickoff timestamp as lastmod for match sitemap entries (no updatedAt column)
- Registry pattern: new page types push to sitemapSegments array, no infrastructure changes
- Dynamic imports in verification scripts to avoid ESM module evaluation order issues with dotenv
- robots.ts confirmed unchanged -- /sitemap.xml URL preserved through migration
- Static const map for league descriptions (editorial content, not DB-driven)
- Server-rendered league pages only (no client components needed for data display)
- Inline FormBadgesInline for server-side rendering (avoids unnecessary client boundary)
- Text-only OG images for leagues (SVG logos are relative paths, not usable in ImageResponse)
- Daily changefreq for leagues sitemap segment (standings update daily during season)
- Raw SQL via db.execute for leaderboard queries (complex aggregations with correlated subqueries)
- Appearances approximated as distinct fixtures with events (no lineup table available)
- Tab navigation between stat types using simple anchor links (server-rendered)
- English-only OG images for stats (language-neutral for social shares)
- Daily changefreq for stats sitemap (leaderboard data changes with each match)
- Metadata namespace for stats SEO keys (consistent with league/team metadata pattern)
- Slug includes api_id suffix in seed for guaranteed uniqueness
- Types not re-exported from 'use server' modules (Next.js 16 Turbopack limitation)
- Local PlayerPageData interface in page.tsx rather than importing from server action
- Migration backfill uses LOWER-first ordering to preserve letters correctly
- English-only OG images for players (consistent with leagues and stats pattern)
- Weekly changefreq for player sitemap (stats change less frequently than standings)
- Reuse getQualifyingPlayerSlugs for sitemap instead of duplicating query logic
- Smart matchup slug parsing: query all team slugs from DB, find valid -vs- split (handles hyphenated names)
- LEAST/GREATEST SQL for qualifying H2H pairs ensures canonical dedup regardless of home/away order
- No path localization for /h2h/ prefix (universally understood in football)
- Inline FormBadgesInline for H2H server-rendered form display (no client boundary)
- English-only OG images for H2H (consistent with leagues, stats, players)
- Weekly changefreq for H2H sitemap (meetings data rarely changes)
- Added slug to PlayerStat for squad roster links to player pages
- H2H section on team page limited to 5 opponents by meeting count
- Native anchor with conditional Wrapper pattern for stat card links (client-rendered with locale prefix)
- next-intl Link for league table standings link (consistent with existing navigation)
- Skipped aria-label i18n for stat card links (card content serves as accessible text)
- Extended MatchEventRow with playerSlug/assistPlayerSlug for efficiency (no extra DB query)
- Used existing MatchDetailTeam slugs (getTeamSlugsById unnecessary)
- Hover dropdown for leagues nav (immediate access from any page)

### Pending Todos (manual/infrastructure)

- Sign up for 5 affiliate programs (Paddy Power, Entain, Kindred, 888, William Hill)
- Collect affiliate IDs/btags from each dashboard after approval
- Set up Google AdSense account and create 8 ad unit slots
- Update public/ads.txt with real publisher ID
- Discuss how to make v1.4 pages more discoverable through homepage links
- Redesign match detail page layout with two-row grid (summary+H2H top, stats+events bottom)

### Roadmap Evolution

- Phase 26 added: Internal Discovery Links — organic entry points across existing pages that surface new programmatic pages

### Tech Debt

None remaining.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 26-02-PLAN.md (Match detail & header discovery links) -- Phase 26 COMPLETE
Resume file: None
Production URL: https://kick-league-gray.vercel.app
