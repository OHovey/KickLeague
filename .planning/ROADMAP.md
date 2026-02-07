# Roadmap: KickLeague

## Milestones

- **v1.0 MVP** - Phases 1-8 (shipped 2026-02-06)
- **v1.1 Affiliate Monetisation** - Phases 9-10 (shipped 2026-02-06)
- **v1.2 Polish, SEO & Launch Readiness** - Phases 11-15 (in progress)

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

<details>
<summary>v1.1 Affiliate Monetisation (Phases 9-10) - SHIPPED 2026-02-06</summary>

### Phase 9: Affiliate Link Builder & Pipeline Integration
**Goal**: Every bookmaker odds link carries affiliate tracking when configured, constructed via the best available method, and the data pipeline enriches links automatically at ingestion time
**Depends on**: Phase 8
**Requirements**: AFCFG-01, AFCFG-02, AFCFG-03, AFCFG-04, LINK-01, LINK-02, LINK-03, LINK-04, ANLYT-01
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md -- Affiliate config & link builder (TDD)
- [x] 09-02-PLAN.md -- Schema migration, click analytics wiring & seed script integration
- [x] 09-03-PLAN.md -- Odds cron route with QStash auth

### Phase 10: Geo-Aware Bookmaker Filtering
**Goal**: Users only see bookmakers that operate in their country, with locally popular bookmakers shown first
**Depends on**: Phase 9
**Requirements**: GEO-01, GEO-02, GEO-03
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md -- Bookmaker availability config & filtering logic (TDD)
- [x] 10-02-PLAN.md -- Server action integration & geo context threading
- [x] 10-03-PLAN.md -- UX indicators & i18n translations

</details>

### v1.2 Polish, SEO & Launch Readiness (In Progress)

**Milestone Goal:** The site presents itself as KickLeague with complete branding, full i18n coverage, search engine discoverability, and display ad monetisation -- ready for public launch.

#### Phase 11: Rebrand to KickLeague
**Goal**: Every user-facing and developer-facing reference identifies the site as KickLeague, not FootballPulse or KickData
**Depends on**: Phase 10 (v1.1 shipped)
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04
**Success Criteria** (what must be TRUE):
  1. Searching the codebase for "FootballPulse" or "KickData" returns zero hits in source files (comments, strings, config)
  2. Running `npm pkg get name` returns "kickleague"
  3. Every page's browser tab shows "KickLeague" in the title (not FootballPulse or KickData)
  4. A KickLeague wordmark/logo SVG asset exists and renders correctly at multiple sizes
**Plans**: 4 plans

Plans:
- [ ] 11-01-PLAN.md -- Codebase rename (source files, package.json, planning docs) + title.template migration
- [ ] 11-02-PLAN.md -- Brand assets (SVG wordmark, favicons, PWA icons)
- [ ] 11-03-PLAN.md -- PWA manifest, OG image generator, Header wordmark wiring
- [ ] 11-04-PLAN.md -- Infrastructure renames (GitHub repo, Neon project)

#### Phase 12: Site Chrome & Homepage
**Goal**: Users see a consistent site header on every page and an engaging homepage with real-time stat highlights
**Depends on**: Phase 11 (wordmark asset exists for header)
**Requirements**: LAYOUT-01, LAYOUT-02, DEBT-01
**Success Criteria** (what must be TRUE):
  1. Every page displays a site header containing the KickLeague wordmark and a working locale switcher
  2. Switching locale via the header updates the page language without a full reload and persists across navigation
  3. The homepage displays three stat-highlight cards (Top Scorer, Biggest Upset, Form Team) with real data from the database
  4. The league table and other date-sensitive components display the current season year dynamically (not hardcoded "2025")
**Plans**: TBD

#### Phase 13: i18n Completeness
**Goal**: Every user-visible string renders in the user's chosen locale, including team names
**Depends on**: Phase 12 (new header/hero strings exist to be translated)
**Requirements**: I18N-01, I18N-02, I18N-03
**Success Criteria** (what must be TRUE):
  1. Switching to any of the 5 locales (EN, ES, DE, IT, FR) shows zero hardcoded English strings -- all UI text comes from message files
  2. Team names display in the user's locale (e.g., "Bayern Munich" in English, "Bayern Munchen" in German) via the getTeamName helper
  3. All 5 locale message files contain complete translations for every key (no missing keys in any locale)
**Plans**: TBD

#### Phase 14: SEO Foundation
**Goal**: Search engines can discover, index, and correctly attribute all pages across all locales
**Depends on**: Phase 11 (correct brand name in meta), Phase 13 (i18n complete for hreflang)
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05
**Success Criteria** (what must be TRUE):
  1. Every page has a unique, descriptive meta title and description (verifiable via View Source or browser dev tools)
  2. Every page has Open Graph tags (og:title, og:description, og:image) that render correctly when pasted into social media link previews
  3. Visiting /sitemap.xml returns a valid sitemap listing all league pages, team pages, and locale variants
  4. Visiting /robots.txt returns a valid robots file that allows search engine crawling and references the sitemap
  5. Every page includes hreflang link tags pointing to equivalent pages in all 5 locales
**Plans**: TBD

#### Phase 15: Display Ads
**Goal**: The site earns display ad revenue with ads placed on high-traffic pages while maintaining compliance around betting content
**Depends on**: Phase 12 (pages and layout finalized before placing ad units)
**Requirements**: ADS-01, ADS-02, ADS-03
**Success Criteria** (what must be TRUE):
  1. The Google AdSense script tag loads on every page (verifiable via browser dev tools Network tab)
  2. Responsive ad units render on the homepage, league table page, and match detail page without breaking layout
  3. No ad units appear within or immediately adjacent to betting odds/bookmaker content sections
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 -> 12 -> 13 -> 14 -> 15

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
| 9. Affiliate Links | v1.1 | 3/3 | Complete | 2026-02-06 |
| 10. Geo Filtering | v1.1 | 3/3 | Complete | 2026-02-06 |
| 11. Rebrand | v1.2 | 0/4 | Planned | - |
| 12. Site Chrome | v1.2 | 0/TBD | Not started | - |
| 13. i18n Complete | v1.2 | 0/TBD | Not started | - |
| 14. SEO | v1.2 | 0/TBD | Not started | - |
| 15. Display Ads | v1.2 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-06 after v1.2 roadmap creation*
