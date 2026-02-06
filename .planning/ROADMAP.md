# Roadmap: FootballPulse

## Milestones

- **v1.0 MVP** - Phases 1-8 (shipped 2026-02-06)
- **v1.1 Affiliate Monetisation** - Phases 9-10 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-8) - SHIPPED 2026-02-06</summary>

### Phase 1: Project Foundation
**Goal**: Working Next.js 16 app with database, theming, and league data pipeline
**Plans**: 4 plans

Plans:
- [x] 01-01: Project scaffold with Next.js 16, Tailwind, Drizzle, PostgreSQL
- [x] 01-02: League theming system with gradients and branding
- [x] 01-03: Database schema for teams, standings, matches
- [x] 01-04: API-Football data import pipeline

### Phase 2: League Table Core
**Goal**: Information-dense league table with sparklines, form, and position changes
**Plans**: 3 plans

Plans:
- [x] 02-01: League table component with full stats columns
- [x] 02-02: Sparkline trends and position change indicators
- [x] 02-03: Form column with animated indicators

### Phase 3: Match Data
**Goal**: Recent results and upcoming fixtures with inline context
**Plans**: 3 plans

Plans:
- [x] 03-01: Match list with results and fixtures
- [x] 03-02: Match detail pages
- [x] 03-03: Inline H2H and form display

### Phase 4: Team Pages
**Goal**: Team detail pages with tabbed analytics
**Plans**: 3 plans

Plans:
- [x] 04-01: Team detail page structure with tabs
- [x] 04-02: Performance and squad tabs
- [x] 04-03: Team fixtures tab

### Phase 5: Interactive Timeline
**Goal**: Historical table states viewable by matchweek
**Plans**: 3 plans

Plans:
- [x] 05-01: Season timeline component
- [x] 05-02: Historical standings calculation
- [x] 05-03: Animated table transitions

### Phase 6: Data Pipeline & Real-time
**Goal**: Automated polling, cache invalidation, and smart updates
**Plans**: 4 plans

Plans:
- [x] 06-01: QStash cron polling pipeline
- [x] 06-02: Match completion detection and table recalculation
- [x] 06-03: Cache invalidation strategy
- [x] 06-04: Smart polling for connected clients

### Phase 7: Betting Odds & Localisation
**Goal**: Multi-bookmaker odds comparison with geo-compliance and 5-language support
**Plans**: 4 plans

Plans:
- [x] 07-01: Odds data pipeline and schema
- [x] 07-02: Odds display components with bookmaker comparison
- [x] 07-03: Geo-compliance system via proxy headers
- [x] 07-04: next-intl localisation for 5 languages

### Phase 8: Polish & Integration
**Goal**: Mobile responsiveness, edge cases, and final integration
**Plans**: 2 plans

Plans:
- [x] 08-01: Thread showBetting through TeamTabs to FixturesTab
- [x] 08-02: Final audit and v1 completion

</details>

### v1.1 Affiliate Monetisation (In Progress)

**Milestone Goal:** Odds links generate affiliate revenue with tracked deep links, graceful degradation before IDs are collected, and geo-aware bookmaker filtering per user country.

#### Phase 9: Affiliate Link Builder & Pipeline Integration
**Goal**: Every bookmaker odds link carries affiliate tracking when configured, constructed via the best available method, and the data pipeline enriches links automatically at ingestion time
**Depends on**: Phase 8 (v1 shipped -- odds display, click tracking, and geo-compliance already exist)
**Requirements**: AFCFG-01, AFCFG-02, AFCFG-03, AFCFG-04, LINK-01, LINK-02, LINK-03, LINK-04, ANLYT-01
**Success Criteria** (what must be TRUE):
  1. Clicking a bookmaker's odds cell navigates to that bookmaker with affiliate tracking parameter in the URL (when affiliate ID is configured via env var)
  2. Clicking a bookmaker's odds cell still navigates to the bookmaker even when no affiliate ID is configured (link works, just without tracking)
  3. Links follow the priority chain: API-provided deep link is used when available, sid-constructed deep link when API link is missing, bookmaker homepage as last resort
  4. Running the seed script or triggering the cron poll produces odds rows with affiliate-enriched links stored in the database
  5. Click tracking analytics record which affiliate program (not just bookmaker key) was associated with each click
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

#### Phase 10: Geo-Aware Bookmaker Filtering
**Goal**: Users only see bookmakers that operate in their country, with locally popular bookmakers shown first
**Depends on**: Phase 9 (affiliate config defines the bookmaker registry that geo-filtering reads from)
**Requirements**: GEO-01, GEO-02, GEO-03
**Success Criteria** (what must be TRUE):
  1. A user in France sees only bookmakers licensed to operate in France (e.g. Unibet) and does not see UK-only bookmakers (e.g. Paddy Power, Sky Bet)
  2. A user in Great Britain sees all 8 bookmakers since all operate there
  3. Bookmakers with regional priority (e.g. Paddy Power in GB, Unibet in FR) appear before other available bookmakers in the odds display
  4. A user in a country with no configured availability data sees a reasonable default set of bookmakers (graceful fallback, not empty)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-02-04 |
| 2. League Table | v1.0 | 3/3 | Complete | 2026-02-04 |
| 3. Match Data | v1.0 | 3/3 | Complete | 2026-02-04 |
| 4. Team Pages | v1.0 | 3/3 | Complete | 2026-02-05 |
| 5. Timeline | v1.0 | 3/3 | Complete | 2026-02-05 |
| 6. Pipeline | v1.0 | 4/4 | Complete | 2026-02-05 |
| 7. Betting & i18n | v1.0 | 4/4 | Complete | 2026-02-05 |
| 8. Polish | v1.0 | 2/2 | Complete | 2026-02-06 |
| 9. Affiliate Links | v1.1 | 0/TBD | Not started | - |
| 10. Geo Filtering | v1.1 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-06*
