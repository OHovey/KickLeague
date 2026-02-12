# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** v1.4 Programmatic SEO -- Phase 24 complete (2/2 plans), ready for Phase 25

## Current Position

Phase: 24 of 25 (Player Pages)
Plan: 2 of 2
Status: Phase 24 complete, ready for Phase 25
Last activity: 2026-02-12 -- 24-02 player SEO infrastructure

Progress: [##########] 100% (2/2 plans)

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

### Pending Todos (manual/infrastructure)

- Sign up for 5 affiliate programs (Paddy Power, Entain, Kindred, 888, William Hill)
- Collect affiliate IDs/btags from each dashboard after approval
- Set up Google AdSense account and create 8 ad unit slots
- Update public/ads.txt with real publisher ID
- Discuss how to make v1.4 pages more discoverable through homepage links

### Tech Debt

None remaining.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 24-02-PLAN.md (player SEO) -- Phase 24 fully complete, ready for Phase 25
Resume file: None
Production URL: https://kick-league-gray.vercel.app
