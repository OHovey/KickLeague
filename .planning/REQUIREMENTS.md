# Requirements: FootballPulse

**Defined:** 2026-02-04
**Core Value:** Football fans can see league standings with rich visual context -- sparklines, trend indicators, form runs, position history -- presented with the information density of a financial dashboard.

## v1 Requirements

### League Table

- [ ] **TABL-01**: User can view league table with P, W, D, L, GF, GA, GD, Pts for all Big 5 leagues
- [ ] **TABL-02**: Table rows display zone colouring (Champions League, Europa, Conference, relegation) per league rules
- [ ] **TABL-03**: Table shows form column with last 5 results as colour-coded dots (green/grey/red)
- [ ] **TABL-04**: Table shows position change indicator (up/down/unchanged) since last matchweek
- [ ] **TABL-05**: Table shows sparkline chart of position over season (inverted Y-axis) per team
- [ ] **TABL-06**: Table supports three expandable states: collapsed (5 rows), default (10 rows), expanded (full)
- [ ] **TABL-07**: League-specific tiebreaker rules applied correctly (H2H for La Liga/Serie A, GD for PL/BL/L1)

### League Navigation & Theming

- [ ] **LEAG-01**: User can switch between all 5 leagues via tab navigation
- [ ] **LEAG-02**: Full-page theme changes per league (colours, gradient, background)
- [ ] **LEAG-03**: Theme transitions animate smoothly (200ms fade)
- [ ] **LEAG-04**: Selected league persists via URL and localStorage

### Match Lists

- [ ] **MATL-01**: User can view last 10 recent match results with scores, teams, key events
- [ ] **MATL-02**: User can view next 10 upcoming fixtures with kickoff times in local timezone
- [ ] **MATL-03**: Match list rows expandable with H2H summary and trend info
- [ ] **MATL-04**: Upcoming matches show multi-bookmaker odds comparison

### Team Detail

- [ ] **TEAM-01**: Team page shows hero section with logo, name, stadium, position, points, form
- [ ] **TEAM-02**: Overview tab shows season summary, position chart, cumulative points chart, form run
- [ ] **TEAM-03**: Performance tab shows home/away splits, goals by 15-min period, xG analysis, clean sheets, scoring-first record
- [ ] **TEAM-04**: Squad tab shows top scorers, top assisters, cards, minutes distribution
- [ ] **TEAM-05**: Fixtures tab shows upcoming 5 with odds, fixture difficulty indicator, last 10 results

### Match Detail

- [ ] **MTCH-01**: Completed match page shows score, events timeline, match stats bars, xG
- [ ] **MTCH-02**: Completed match page shows H2H summary
- [ ] **MTCH-03**: Upcoming match page shows odds comparison, form guide, H2H last 5, key comparative stats

### Season Timeline

- [ ] **TIME-01**: Interactive timeline bar showing all matchweeks (filled/empty circles)
- [ ] **TIME-02**: User can drag/tap to any matchweek to view historical table state
- [ ] **TIME-03**: Table animates smoothly when changing matchweek

### Data Pipeline

- [ ] **DATA-01**: API-Football client with rate limiting, Zod validation, and local file-cache proxy
- [ ] **DATA-02**: Initial data seeding (current season fixtures, standings, team data for all 5 leagues)
- [ ] **DATA-03**: Automated match polling via QStash cron (60s during match windows, smart polling off-peak)
- [ ] **DATA-04**: Match completion detection triggers standings recalculation, cache invalidation, ISR revalidation
- [ ] **DATA-05**: Table snapshots stored per matchweek for timeline feature
- [ ] **DATA-06**: Real-time updates push table changes to connected browsers (smart polling or SSE)

### Betting & Monetisation

- [ ] **ODDS-01**: Multi-bookmaker odds comparison table on upcoming match pages
- [ ] **ODDS-02**: Affiliate links with click tracking and geo-targeted bookmaker display
- [ ] **ODDS-03**: Odds displayed in user's preferred format (decimal/fractional/American)
- [ ] **ODDS-04**: Geo-detection hides odds in restricted jurisdictions (Italy: complete ban)

### Localisation

- [ ] **I18N-01**: UI available in 5 languages (EN, ES, DE, IT, FR)
- [ ] **I18N-02**: Locale-aware date, time, and number formatting via Intl API
- [ ] **I18N-03**: Database-driven team name localisation per language
- [ ] **I18N-04**: Language detection (user pref > browser lang > geo > English default)

### Mobile

- [ ] **MOBI-01**: League table shows condensed columns on mobile (position, team, P, GD, Pts, sparkline)
- [ ] **MOBI-02**: Full detail accessible via row expansion on tap
- [ ] **MOBI-03**: All pages responsive and touch-friendly

## v2 Requirements

### Social Media Automation (v1.1)

- **SOCL-01**: Newsworthiness scoring for completed matches
- **SOCL-02**: LLM-generated social posts (X and Instagram)
- **SOCL-03**: Posting queue with rate limiting and timing rules
- **SOCL-04**: Match result image card generation

### Future Enhancements

- **FUTR-01**: Scenario modelling / "what if" calculator
- **FUTR-02**: User accounts and preferences
- **FUTR-03**: Watchlist/favourites
- **FUTR-04**: Push notifications
- **FUTR-05**: Premium tier (ad-free, API access, CSV export)
- **FUTR-06**: Additional leagues beyond Big 5
- **FUTR-07**: Display advertising integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live second-by-second scores | High complexity; FotMob/SofaScore own this space |
| User accounts/auth | Not needed for v1 information consumption |
| Player profiles/pages | Transfermarkt owns this space; data maintenance too high |
| Video highlights | Licensing and bandwidth costs |
| Community features (forums, comments) | Moderation overhead, not core to data product |
| 100+ league coverage | Quality over breadth; Big 5 only for v1 |
| Native mobile app | Web-first with responsive design covers mobile |
| Fantasy football integration | Completely different product |
| Match predictions/tips | Legal grey area, liability risk |

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
| MATL-04 | Phase 3 | Partial (placeholder, odds data in Phase 7) |
| MTCH-01 | Phase 3 | Complete |
| MTCH-02 | Phase 3 | Complete |
| MTCH-03 | Phase 3 | Partial (placeholder, odds data in Phase 7) |
| TEAM-01 | Phase 4 | Complete |
| TEAM-02 | Phase 4 | Complete |
| TEAM-03 | Phase 4 | Complete |
| TEAM-04 | Phase 4 | Complete |
| TEAM-05 | Phase 4 | Partial (placeholder, odds data in Phase 7) |
| TIME-01 | Phase 5 | Pending |
| TIME-02 | Phase 5 | Pending |
| TIME-03 | Phase 5 | Pending |
| DATA-05 | Phase 5 | Pending |
| DATA-03 | Phase 6 | Pending |
| DATA-04 | Phase 6 | Pending |
| DATA-06 | Phase 6 | Pending |
| ODDS-01 | Phase 7 | Pending |
| ODDS-02 | Phase 7 | Pending |
| ODDS-03 | Phase 7 | Pending |
| ODDS-04 | Phase 7 | Pending |
| I18N-01 | Phase 7 | Pending |
| I18N-02 | Phase 7 | Pending |
| I18N-03 | Phase 7 | Pending |
| I18N-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-05 after Phase 4 completion*
