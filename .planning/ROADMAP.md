# Roadmap: KickLeague

## Milestones

- **v1.0 MVP** - Phases 1-8 (shipped 2026-02-06)
- **v1.1 Affiliate Monetisation** - Phases 9-10 (shipped 2026-02-06)
- **v1.2 Polish, SEO & Launch Readiness** - Phases 11-15 (shipped 2026-02-09)
- **v1.3 Production Launch** - Phases 16-20 (shipped 2026-02-12)
- **v1.4 Programmatic SEO** - Phases 21-25 (in progress)

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
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md -- Affiliate config & link builder (TDD)
- [x] 09-02-PLAN.md -- Schema migration, click analytics wiring & seed script integration
- [x] 09-03-PLAN.md -- Odds cron route with QStash auth

### Phase 10: Geo-Aware Bookmaker Filtering
**Goal**: Users only see bookmakers that operate in their country, with locally popular bookmakers shown first
**Depends on**: Phase 9
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md -- Bookmaker availability config & filtering logic (TDD)
- [x] 10-02-PLAN.md -- Server action integration & geo context threading
- [x] 10-03-PLAN.md -- UX indicators & i18n translations

</details>

<details>
<summary>v1.2 Polish, SEO & Launch Readiness (Phases 11-15) - SHIPPED 2026-02-09</summary>

### Phase 11: Rebrand to KickLeague
**Goal**: Every user-facing and developer-facing reference identifies the site as KickLeague
**Depends on**: Phase 10 (v1.1 shipped)
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md -- Codebase rename (source files, package.json, planning docs) + title.template migration
- [x] 11-02-PLAN.md -- Brand assets (SVG wordmark, favicons, PWA icons)
- [x] 11-03-PLAN.md -- PWA manifest, OG image generator, Header wordmark wiring
- [x] 11-04-PLAN.md -- Infrastructure renames (GitHub repo, Neon project)

### Phase 12: Site Chrome & Homepage
**Goal**: Users see a consistent site header on every page and an engaging homepage with real-time stat highlights
**Depends on**: Phase 11
**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md -- Header to layout, static positioning, dynamic season fix
- [x] 12-02-PLAN.md -- Stat highlight database queries and server action
- [x] 12-03-PLAN.md -- StatHighlights component and homepage wiring

### Phase 13: i18n Completeness
**Goal**: Every user-visible string renders in the user's chosen locale, including team names
**Depends on**: Phase 12
**Plans**: 7 plans

Plans:
- [x] 13-01-PLAN.md -- en.json complete key extraction + infrastructure
- [x] 13-02-PLAN.md -- Wire i18n into league table, timeline, and DataFreshness components
- [x] 13-03-PLAN.md -- Wire i18n into matches list and match detail components
- [x] 13-04-PLAN.md -- Wire i18n into team detail, header, stat highlights, and page components
- [x] 13-05-PLAN.md -- Team name translation seed data + server action wiring
- [x] 13-06-PLAN.md -- Generate complete translations for ES, DE, IT, FR locales
- [x] 13-07-PLAN.md -- Gap closure: translate hardcoded MW abbreviations and wire getLocalizedOrdinal

### Phase 14: SEO Foundation
**Goal**: Search engines can discover, index, and correctly attribute all pages across all locales
**Depends on**: Phase 11, Phase 13
**Plans**: 5 plans

Plans:
- [x] 14-01-PLAN.md -- Meta foundation: metadataBase, default OG tags, hreflang alternates
- [x] 14-02-PLAN.md -- Page-level meta enhancement: team and match detail generateMetadata
- [x] 14-03-PLAN.md -- Sitemap and robots: dynamic sitemap.xml, robots.txt
- [x] 14-04-PLAN.md -- OG images: light, high-contrast dynamic images for all page types
- [x] 14-05-PLAN.md -- Structured data: SportsEvent, BreadcrumbList, SportsTeam JSON-LD

### Phase 15: Display Ads
**Goal**: The site earns display ad revenue with ads placed on high-traffic pages while maintaining compliance around betting content
**Depends on**: Phase 12
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md -- AdUnit component, ad config, ads.txt, CSS collapse, env vars
- [x] 15-02-PLAN.md -- Place ad units on all 4 page types with betting content separation

</details>

<details>
<summary>v1.3 Production Launch (Phases 16-20) - SHIPPED 2026-02-12</summary>

### Phase 16: Security Hardening
**Goal**: Public API endpoints are protected from abuse and the site sends proper security headers on every response
**Depends on**: Phase 15 (v1.2 shipped)
**Requirements**: SEC-01, SEC-02, SEC-03
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md -- Rate limiting on public API endpoints (in-memory token bucket)
- [x] 16-02-PLAN.md -- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) + CSP report endpoint

### Phase 17: Monitoring Integration
**Goal**: Errors are automatically captured, performance is tracked, and operators are alerted when the data pipeline or API budget is at risk
**Depends on**: Phase 16
**Requirements**: MON-01, MON-02, MON-03, MON-04
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md -- Sentry error tracking + Vercel Analytics & Speed Insights
- [x] 17-02-PLAN.md -- API budget threshold alerting + cron job failure capture via Sentry

### Phase 18: Production Deployment
**Goal**: KickLeague runs on a production Vercel project backed by a production Neon database, with current data and complete setup documentation
**Depends on**: Phase 17
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Plans**: 2 plans

Plans:
- [x] 18-01-PLAN.md -- Complete .env.example documentation and production README
- [x] 18-02-PLAN.md -- Production Vercel + Neon deployment, migrations, and data seeding

### Phase 19: Production Pipeline
**Goal**: The automated data pipeline runs reliably in production, with live match polling at 3-minute intervals and all 5 leagues showing current data
**Depends on**: Phase 18
**Requirements**: PIPE-01, PIPE-02, PIPE-03
**Plans**: 2 plans

Plans:
- [x] 19-01-PLAN.md -- Configure QStash cron schedules with 3-minute polling and verify in Upstash dashboard
- [x] 19-02-PLAN.md -- Verify database freshness and production site data currency across all 5 leagues

### Phase 20: Launch Documentation
**Goal**: Every manual setup step needed for full monetisation and DNS is documented in actionable checklists so nothing is forgotten
**Depends on**: Nothing (documentation-only, can run in parallel)
**Requirements**: MANUAL-01, MANUAL-02, MANUAL-03
**Plans**: 1 plan

Plans:
- [x] 20-01-PLAN.md -- AdSense, affiliate program, and DNS/domain setup checklists

</details>

### v1.4 Programmatic SEO (In Progress)

**Milestone Goal:** Expand KickLeague's indexable page surface through programmatic SEO -- dedicated league pages, stat leaderboards, player profiles, and head-to-head comparisons -- each with enough substantive content to avoid thin content penalties.

- [x] **Phase 21: Sitemap Index Refactor** - Segmented sitemap-index foundation for all current and upcoming page types
- [x] **Phase 22: League Landing Pages** - Dedicated per-league pages with standings, top performers, and recent results
- [ ] **Phase 23: Statistical Leaderboards** - Top scorers, assists, and disciplinary leaderboards for each league
- [ ] **Phase 24: Player Pages** - Individual player profiles with season stats and match involvement
- [ ] **Phase 25: Head-to-Head Pages** - Team pair comparison pages with meeting history and form context

#### Phase 21: Sitemap Index Refactor
**Goal**: The sitemap uses a segmented sitemap-index pattern so each page type has its own sitemap file, ready for new page types to register as they are built
**Depends on**: Phase 20 (v1.3 shipped)
**Requirements**: INFRA-01
**Success Criteria** (what must be TRUE):
  1. `/sitemap-index.xml` returns a sitemap index listing separate sitemap URLs for each page type (teams, matches, and a placeholder structure for leagues, players, stats, h2h)
  2. Each individual sitemap (e.g., `/sitemaps/teams.xml`) returns valid sitemap XML with correct `<loc>` and `<lastmod>` entries including all locale variants
  3. The existing monolithic `sitemap.xml` is replaced by the sitemap-index without losing any currently indexed URLs
**Plans**: 2 plans

Plans:
- [ ] 21-01-PLAN.md -- Sitemap registry, XML generation, and route handlers for sitemap-index + segment sitemaps
- [ ] 21-02-PLAN.md -- Migration verification script, robots.txt validation, and end-to-end URL preservation check

#### Phase 22: League Landing Pages
**Goal**: Users can browse a dedicated page for each league with standings, top performers, recent results, and full SEO discoverability
**Depends on**: Phase 21
**Requirements**: LEAGUE-01, LEAGUE-02, LEAGUE-03, LEAGUE-04, INFRA-02, INFRA-04
**Success Criteria** (what must be TRUE):
  1. User can navigate to `/leagues/premier-league` (and equivalent slugs for all 5 leagues) and see the current standings table, a league description, and zone context (Champions League spots, relegation)
  2. Each league page displays the top 5 scorers and the current form team for that league
  3. Each league page shows recent match results and upcoming fixtures for that league
  4. Each league page has a unique `<title>`, meta description, JSON-LD (SportsOrganization), OG image, and hreflang alternates across all 5 locales
  5. League pages use `generateStaticParams` for build-time generation with ISR revalidation, and the leagues sitemap segment is populated
**Plans**: 2 plans

Plans:
- [x] 22-01-PLAN.md -- League page data layer, routing, full page UI, and i18n keys
- [x] 22-02-PLAN.md -- SEO infrastructure: metadata, OG images, JSON-LD, hreflang, sitemap segment

#### Phase 23: Statistical Leaderboards
**Goal**: Users can view top-20 statistical leaderboards for each league, giving the site 15 new indexable page types (3 stat types x 5 leagues)
**Depends on**: Phase 22
**Requirements**: STATS-01, STATS-02, STATS-03, STATS-04
**Success Criteria** (what must be TRUE):
  1. User can view a top scorers leaderboard for each league showing the top 20 players with goals, appearances, goals-per-90, and team
  2. User can view a top assists leaderboard for each league showing the top 20 players with assists, appearances, assists-per-90, and team
  3. User can view a disciplinary leaderboard for each league showing the top 20 players with yellow cards, red cards, appearances, and team
  4. Each leaderboard page has unique SEO metadata, JSON-LD, OG image, hreflang alternates, and appears in the stats sitemap segment
**Plans**: 2 plans

Plans:
- [ ] 23-01-PLAN.md -- Leaderboard data layer, routing, page UI, and i18n for all 3 stat types
- [ ] 23-02-PLAN.md -- SEO infrastructure: metadata, OG images, JSON-LD, hreflang, stats sitemap segment

#### Phase 24: Player Pages
**Goal**: Users can view individual player profiles with season stats and recent match involvement, limited to players with sufficient data to avoid thin content
**Depends on**: Phase 23
**Requirements**: PLAYER-01, PLAYER-02, PLAYER-03, PLAYER-04, PLAYER-05
**Success Criteria** (what must be TRUE):
  1. User can navigate to `/players/[slug]` and see the player's photo, position, nationality, current team, and shirt number
  2. Player page shows a season stats summary with goals, assists, yellow cards, red cards, and total appearances
  3. Player page shows the last 10 matches the player participated in, with match events (goals scored, assists, cards received)
  4. Only players with 5 or more appearances this season have generated pages; navigating to a sub-threshold player slug returns 404
  5. Each player page has unique SEO metadata, JSON-LD (Person/Athlete), OG image, and hreflang alternates, and the player sitemap segment only lists qualifying players
**Plans**: TBD

#### Phase 25: Head-to-Head Pages
**Goal**: Users can compare two teams side-by-side with meeting history and current form, limited to pairs with enough meetings to provide substantive content
**Depends on**: Phase 22
**Requirements**: H2H-01, H2H-02, H2H-03, H2H-04, H2H-05, INFRA-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to `/h2h/[team1]-vs-[team2]` and see all meetings between the two teams this season with scores, dates, and venues
  2. H2H page shows the aggregate record (wins per side, draws, total goals per side) and expanded detail for the most recent meeting
  3. H2H page shows a current form comparison (last 5 results) and league position comparison for both teams
  4. Only team pairs with 3 or more meetings across available data have generated pages; sub-threshold pairs return 404
  5. Cross-linking is wired between all page types: player pages link to their team, team pages link to their players, league pages link to stats and teams, H2H pages link to both teams

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 21 -> 22 -> 23 -> 24 -> 25 (Phase 25 depends on 22, not 24, so could potentially run in parallel with 23-24)

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
| 11. Rebrand | v1.2 | 4/4 | Complete | 2026-02-07 |
| 12. Site Chrome | v1.2 | 3/3 | Complete | 2026-02-08 |
| 13. i18n Complete | v1.2 | 7/7 | Complete | 2026-02-08 |
| 14. SEO | v1.2 | 5/5 | Complete | 2026-02-08 |
| 15. Display Ads | v1.2 | 2/2 | Complete | 2026-02-09 |
| 16. Security | v1.3 | 2/2 | Complete | 2026-02-10 |
| 17. Monitoring | v1.3 | 2/2 | Complete | 2026-02-10 |
| 18. Deployment | v1.3 | 2/2 | Complete | 2026-02-11 |
| 19. Pipeline | v1.3 | 2/2 | Complete | 2026-02-11 |
| 20. Launch Docs | v1.3 | 1/1 | Complete | 2026-02-11 |
| 21. Sitemap Index | v1.4 | 2/2 | Complete | 2026-02-12 |
| 22. League Landing | v1.4 | 2/2 | Complete | 2026-02-12 |
| 23. Stat Leaderboards | v1.4 | 0/TBD | Not started | - |
| 24. Player Pages | v1.4 | 0/TBD | Not started | - |
| 25. Head-to-Head | v1.4 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-12 -- Phase 22 complete*
