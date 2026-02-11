# Roadmap: KickLeague

## Milestones

- **v1.0 MVP** - Phases 1-8 (shipped 2026-02-06)
- **v1.1 Affiliate Monetisation** - Phases 9-10 (shipped 2026-02-06)
- **v1.2 Polish, SEO & Launch Readiness** - Phases 11-15 (shipped 2026-02-09)
- **v1.3 Production Launch** - Phases 16-20 (in progress)

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

### v1.3 Production Launch (In Progress)

**Milestone Goal:** Deploy KickLeague to production with monitoring, verified data pipeline, security hardening, and documentation -- everything needed to go live.

- [x] **Phase 16: Security Hardening** - Rate limiting and security headers before production deploy
- [x] **Phase 17: Monitoring Integration** - Error tracking, performance analytics, and operational alerts
- [x] **Phase 18: Production Deployment** - Vercel + Neon production environment with seeded data and documentation
- [x] **Phase 19: Production Pipeline** - Verified cron schedules, live match polling, and current data
- [ ] **Phase 20: Launch Documentation** - Manual setup checklists for AdSense, affiliates, and DNS

#### Phase 16: Security Hardening
**Goal**: Public API endpoints are protected from abuse and the site sends proper security headers on every response
**Depends on**: Phase 15 (v1.2 shipped)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Requests to `/api/updates/check` and `/api/clicks` are rate-limited and return 429 when limits are exceeded
  2. The site serves a Content Security Policy header that allows its own scripts, styles, AdSense, and analytics while blocking unexpected sources
  3. Every response includes X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers with secure defaults
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md -- Rate limiting on public API endpoints (in-memory token bucket)
- [x] 16-02-PLAN.md -- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) + CSP report endpoint

#### Phase 17: Monitoring Integration
**Goal**: Errors are automatically captured, performance is tracked, and operators are alerted when the data pipeline or API budget is at risk
**Depends on**: Phase 16
**Requirements**: MON-01, MON-02, MON-03, MON-04
**Success Criteria** (what must be TRUE):
  1. Unhandled errors and rejected promises are captured in Sentry with source maps and environment tags (development vs production)
  2. Vercel Analytics is active and page load performance is visible in the Vercel dashboard
  3. When daily API-Football request count approaches the 7,500 limit, a warning is logged or alerted
  4. When a QStash or Vercel cron route returns an error status, the failure is captured in Sentry with cron context
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md -- Sentry error tracking + Vercel Analytics & Speed Insights
- [x] 17-02-PLAN.md -- API budget threshold alerting + cron job failure capture via Sentry

#### Phase 18: Production Deployment
**Goal**: KickLeague runs on a production Vercel project backed by a production Neon database, with current data and complete setup documentation
**Depends on**: Phase 17
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Success Criteria** (what must be TRUE):
  1. The production Vercel project deploys successfully with all environment variables configured and the site loads at the production URL
  2. The Neon production database has all Drizzle migrations applied and contains current-season teams, fixtures, standings, and odds data
  3. A `.env.example` file documents every required environment variable with a description of its purpose and where to obtain it
  4. The project README contains setup instructions, architecture overview, environment variable guide, and deployment steps (replacing the Next.js boilerplate)
**Plans**: 2 plans

Plans:
- [x] 18-01-PLAN.md -- Complete .env.example documentation and production README
- [x] 18-02-PLAN.md -- Production Vercel + Neon deployment, migrations, and data seeding

#### Phase 19: Production Pipeline
**Goal**: The automated data pipeline runs reliably in production, with live match polling at 3-minute intervals and all 5 leagues showing current data
**Depends on**: Phase 18
**Requirements**: PIPE-01, PIPE-02, PIPE-03
**Success Criteria** (what must be TRUE):
  1. QStash cron schedules are configured and visibly running in the Upstash dashboard, triggering the polling and odds routes on their defined intervals
  2. During live matches, the polling frequency increases to 3-minute intervals so match scores stay near real-time
  3. All 5 leagues show current match results and standings that match the latest data from API-Football
**Plans**: 2 plans

Plans:
- [x] 19-01-PLAN.md -- Configure QStash cron schedules with 3-minute polling and verify in Upstash dashboard
- [x] 19-02-PLAN.md -- Verify database freshness and production site data currency across all 5 leagues

#### Phase 20: Launch Documentation
**Goal**: Every manual setup step needed for full monetisation and DNS is documented in actionable checklists so nothing is forgotten
**Depends on**: Nothing (documentation-only, can run in parallel)
**Requirements**: MANUAL-01, MANUAL-02, MANUAL-03
**Success Criteria** (what must be TRUE):
  1. An AdSense setup checklist exists documenting account creation steps, ad unit ID collection for all 8 slots, and the `ads.txt` update procedure
  2. An affiliate program setup checklist exists documenting signup steps for each bookmaker program, ID/btag collection, and where to configure them in the codebase
  3. A DNS/domain setup checklist exists documenting domain purchase, DNS record configuration, Vercel domain linking, and SSL verification steps
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 16 -> 17 -> 18 -> 19 -> 20 (Phase 20 can run in parallel with 18-19)

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
| 20. Launch Docs | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-06*
*Last updated: 2026-02-11 -- Phase 19 complete*
