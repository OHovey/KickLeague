# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.
**Current focus:** v1.2 Polish, SEO & Launch Readiness -- Phase 14 complete

## Current Position

Phase: 14 of 15 (SEO Foundation)
Plan: 05 of 5 (5 complete: 01, 02, 03, 04, 05)
Status: Phase complete
Last activity: 2026-02-08 -- Completed 14-05-PLAN.md (structured data JSON-LD)

Progress: [##################################################] 100% (51/51 total plans complete)

## Performance Metrics

**v1.0 Velocity:**
- Total plans completed: 26
- Average duration: 3.8 min
- Total execution time: ~1.77 hours

**v1.1 Velocity:**
- Total plans completed: 6
- Average duration: 2.5 min
- Total execution time: 15 min

## Accumulated Context

### Decisions

All v1/v1.1 decisions logged in PROJECT.md Key Decisions table.

**v1.2 Phase 11:**
- 11-01: title.template pattern for automatic brand suffix (child pages return bare titles)
- 11-02: Football icon uses pentagon-with-seams pattern; sharp script generates all icon variants from SVG source
- 11-03: Inline SVG icon + styled HTML text for wordmark (avoids font-embedding); OG image uses Satori/ImageResponse with inline SVG
- 11-04: GitHub repo already renamed to KickLeague (pre-completed); Neon project rename skipped (never branded as KickData, uses default "neondb")

**v1.2 Phase 12:**
- 12-01: Header rendered in locale layout.tsx (not per-page); season derived dynamically from league.currentSeason via MatchweekListResult
- 12-02: Odds-based upset detection (AVG across bookmakers); Promise.allSettled for parallel query resilience; form scoring W=3, D=1, L=0
- 12-03: Plain <img> for team logos (avoid next/image domain config); inline SVG icons (no icon library); skeleton cards match card dimensions

**v1.2 Phase 13:**
- 13-01: Dual routing config (routing with pathnames for middleware, navigationRouting without pathnames for Link/useRouter); ICU plural format for count-dependent strings
- 13-02: ZoneLegend promoted to client component for useTranslations; DataFreshness split into getTimeBucket (pure) + formatRelativeTime (i18n); developer CLI instructions left untranslated
- 13-03: Match detail components converted to client components for useTranslations; EventsTimeline passes t function as prop to sub-components; ICU plural format for H2H wins/draws/meetings
- 13-04: TeamHero converted to client component for useTranslations; layout.tsx switched from static metadata to generateMetadata for translated description; FixturesTab uses callback pattern for translated tooltip labels; added Teams.gd and TeamPerformance.noHomeAwayData keys to en.json
- 13-05: Added teamId to TopScorerResult/BiggestUpsetResult for localization; position history chart keys remapped English->localized; seed script resolves team IDs by name at runtime
- 13-06: Complete translations for ES/DE/IT/FR (229 keys each); football-domain terminology per locale; German ASCII umlaut corrections; French "clean sheets" preserved as-is
- 13-07: Recharts tooltip i18n via prop-passing pattern (formatMatchweek/formatOrdinal callbacks); replaced hardcoded MW and ordinal() in 5 chart components

**v1.2 Phase 14:**
- 14-01: metadataBase uses NEXT_PUBLIC_SITE_URL with fallback; matches page metadata in layout.tsx (client component workaround); hreflang alternates from routing.pathnames config
- 14-02: Spoiler-free OG title for match pages (browser tab shows score, social share does not); hreflang alternates from routing.pathnames with slug/id replacement; league name in team title
- 14-03: Removed deprecated middleware.ts (proxy.ts only for Next.js 16); robots.txt/sitemap.xml at app root outside [locale]; routing.pathnames for localized sitemap URLs; only finished matches in sitemap
- 14-04: Light gradient OG images (#f8f9fa to #e9ecef) for all 4 page types; direct DB queries instead of server actions for OG (avoids getLocale context); spoiler-free match OG (no scores)
- 14-05: JSON-LD builder functions in src/lib/seo/structured-data.ts; SportsEvent + BreadcrumbList on match pages; SportsTeam + BreadcrumbList on team pages; XSS-safe serialization

### Pending Todos (manual/infrastructure -- not in v1.2 scope)

- Provision production infrastructure (Neon, Vercel, QStash, Odds API)
- API-Football subscription upgrade for fixture events/stats data
- Seed historical standings data for sparklines/position changes
- Set environment variables for cron routes and APIs
- Sign up for 5 affiliate programs (Paddy Power, Entain, Kindred, 888, William Hill)
- Collect affiliate IDs/btags from each dashboard after approval
- Apply migration 0003_young_network.sql to production database
- Install and use frontend-design Claude skill
- Pull all required Sports API data and verify daily request budget (<2000 req/day)

### Tech Debt (targeted in v1.2)

- ~~Team name translation helper orphaned (getTeamName never called)~~ -- RESOLVED in 13-05 (getLocalizedTeamNames wired into all 5 server actions)
- ~~Hardcoded season '2025' in LeagueTableWrapper~~ -- RESOLVED in 12-01
- ~~UI text hardcoded English despite message files existing~~ -- RESOLVED in 13-02 through 13-04 (team detail, header, stat highlights, layout all wired)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 14-05-PLAN.md (structured data JSON-LD) -- Phase 14 complete
Resume file: None
