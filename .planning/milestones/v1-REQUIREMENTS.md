# Requirements Archive: v1 MVP

**Archived:** 2026-02-06
**Status:** SHIPPED

This is the archived requirements specification for v1.
For current requirements, see `.planning/PROJECT.md` (Validated section carries cumulative record).

---

# Requirements: FootballPulse

**Defined:** 2026-02-04
**Core Value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.

## v1 Requirements

### League Table

- [x] **TABL-01**: User can view league table with P, W, D, L, GF, GA, GD, Pts for all Big 5 leagues
- [x] **TABL-02**: Table rows display zone colouring (Champions League, Europa, Conference, relegation) per league rules
- [x] **TABL-03**: Table shows form column with last 5 results as colour-coded dots (green/grey/red)
- [x] **TABL-04**: Table shows position change indicator (up/down/unchanged) since last matchweek
- [x] **TABL-05**: Table shows sparkline chart of position over season (inverted Y-axis) per team
- [x] **TABL-06**: Table supports three expandable states: collapsed (5 rows), default (10 rows), expanded (full)
- [x] **TABL-07**: League-specific tiebreaker rules applied correctly (H2H for La Liga/Serie A, GD for PL/BL/L1)

### League Navigation & Theming

- [x] **LEAG-01**: User can switch between all 5 leagues via tab navigation
- [x] **LEAG-02**: Full-page theme changes per league (colours, gradient, background)
- [x] **LEAG-03**: Theme transitions animate smoothly (200ms fade)
- [x] **LEAG-04**: Selected league persists via URL and localStorage

### Match Lists

- [x] **MATL-01**: User can view last 10 recent match results with scores, teams, key events
- [x] **MATL-02**: User can view next 10 upcoming fixtures with kickoff times in local timezone
- [x] **MATL-03**: Match list rows expandable with H2H summary and trend info (adjusted: inline display per user feedback)
- [x] **MATL-04**: Upcoming matches show multi-bookmaker odds comparison

### Team Detail

- [x] **TEAM-01**: Team page shows hero section with logo, name, stadium, position, points, form
- [x] **TEAM-02**: Overview tab shows season summary, position chart, cumulative points chart, form run
- [x] **TEAM-03**: Performance tab shows home/away splits, goals by 15-min period, xG analysis, clean sheets, scoring-first record
- [x] **TEAM-04**: Squad tab shows top scorers, top assisters, cards, minutes distribution
- [x] **TEAM-05**: Fixtures tab shows upcoming 5 with odds, fixture difficulty indicator, last 10 results

### Match Detail

- [x] **MTCH-01**: Completed match page shows score, events timeline, match stats bars, xG
- [x] **MTCH-02**: Completed match page shows H2H summary
- [x] **MTCH-03**: Upcoming match page shows odds comparison, form guide, H2H last 5, key comparative stats

### Season Timeline

- [x] **TIME-01**: Interactive timeline bar showing all matchweeks (filled/empty circles)
- [x] **TIME-02**: User can drag/tap to any matchweek to view historical table state
- [x] **TIME-03**: Table animates smoothly when changing matchweek

### Data Pipeline

- [x] **DATA-01**: API-Football client with rate limiting, Zod validation, and local file-cache proxy
- [x] **DATA-02**: Initial data seeding (current season fixtures, standings, team data for all 5 leagues)
- [x] **DATA-03**: Automated match polling via QStash cron (60s during match windows, smart polling off-peak)
- [x] **DATA-04**: Match completion detection triggers standings recalculation, cache invalidation, ISR revalidation
- [x] **DATA-05**: Table snapshots stored per matchweek for timeline feature
- [x] **DATA-06**: Real-time updates push table changes to connected browsers (smart polling or SSE)

### Betting & Monetisation

- [x] **ODDS-01**: Multi-bookmaker odds comparison table on upcoming match pages
- [x] **ODDS-02**: Affiliate links with click tracking and geo-targeted bookmaker display
- [x] **ODDS-03**: Odds displayed in user's preferred format (decimal/fractional/American)
- [x] **ODDS-04**: Geo-detection hides odds in restricted jurisdictions (Italy: complete ban)

### Localisation

- [x] **I18N-01**: UI available in 5 languages (EN, ES, DE, IT, FR)
- [x] **I18N-02**: Locale-aware date, time, and number formatting via Intl API
- [x] **I18N-03**: Database-driven team name localisation per language
- [x] **I18N-04**: Language detection (user pref > browser lang > geo > English default)

### Mobile

- [x] **MOBI-01**: League table shows condensed columns on mobile (position, team, P, GD, Pts, sparkline)
- [x] **MOBI-02**: Full detail accessible via row expansion on tap
- [x] **MOBI-03**: All pages responsive and touch-friendly

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| TABL-01 | Phase 2 | Complete |
| TABL-02 | Phase 2 | Complete |
| TABL-03 | Phase 2 | Complete |
| TABL-04 | Phase 2 | Complete |
| TABL-05 | Phase 2 | Complete |
| TABL-06 | Phase 2 | Complete |
| TABL-07 | Phase 2 | Complete |
| LEAG-01 | Phase 2 | Complete |
| LEAG-02 | Phase 2 | Complete |
| LEAG-03 | Phase 2 | Complete |
| LEAG-04 | Phase 2 | Complete |
| MOBI-01 | Phase 2 | Complete |
| MOBI-02 | Phase 2 | Complete |
| MOBI-03 | Phase 2 | Complete |
| MATL-01 | Phase 3 | Complete |
| MATL-02 | Phase 3 | Complete |
| MATL-03 | Phase 3 | Complete |
| MATL-04 | Phase 3, 7, 8 | Complete |
| MTCH-01 | Phase 3 | Complete |
| MTCH-02 | Phase 3 | Complete |
| MTCH-03 | Phase 3, 7, 8 | Complete |
| TEAM-01 | Phase 4 | Complete |
| TEAM-02 | Phase 4 | Complete |
| TEAM-03 | Phase 4 | Complete |
| TEAM-04 | Phase 4 | Complete |
| TEAM-05 | Phase 4, 7, 8 | Complete |
| TIME-01 | Phase 5 | Complete |
| TIME-02 | Phase 5 | Complete |
| TIME-03 | Phase 5 | Complete |
| DATA-05 | Phase 5 | Complete |
| DATA-03 | Phase 6 | Complete |
| DATA-04 | Phase 6 | Complete |
| DATA-06 | Phase 6 | Complete |
| ODDS-01 | Phase 7 | Complete |
| ODDS-02 | Phase 7 | Complete |
| ODDS-03 | Phase 7 | Complete |
| ODDS-04 | Phase 7 | Complete |
| I18N-01 | Phase 7 | Complete |
| I18N-02 | Phase 7 | Complete |
| I18N-03 | Phase 7 | Complete |
| I18N-04 | Phase 7 | Complete |

## Milestone Summary

**Shipped:** 43 of 43 v1 requirements
**Adjusted:**
- MATL-03: Changed from expand/collapse to inline display per user feedback during Phase 3
- DATA-06: Implemented as smart polling instead of SSE (simpler, works on all platforms)
**Dropped:** None

---
*Archived: 2026-02-06 as part of v1 milestone completion*
