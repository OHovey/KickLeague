# Requirements: KickLeague

**Defined:** 2026-02-06
**Core Value:** Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history — presented with the information density of a financial dashboard.

## v1.2 Requirements

Requirements for Polish, SEO & Launch Readiness milestone. Each maps to roadmap phases.

### Rebrand

- [ ] **BRAND-01**: All source code references to FootballPulse/KickData are renamed to KickLeague
- [ ] **BRAND-02**: package.json name field updated to kickleague
- [ ] **BRAND-03**: Page titles and metadata display KickLeague across all pages
- [ ] **BRAND-04**: Logo/wordmark asset created or updated for KickLeague branding

### Header & Homepage

- [ ] **LAYOUT-01**: Site header with KickLeague wordmark and locale switcher renders on all pages via layout
- [ ] **LAYOUT-02**: Homepage displays a three-card hero row with key stat highlights (Top Scorer, Biggest Upset, Form Team)

### i18n Completeness

- [ ] **I18N-01**: All user-visible hardcoded English strings are wired to next-intl message files
- [ ] **I18N-02**: getTeamName helper is wired so team names display in the user's locale
- [ ] **I18N-03**: All 5 locale message files (EN, ES, DE, IT, FR) contain translations for newly wired strings

### Tech Debt

- [ ] **DEBT-01**: Season year is dynamic (not hardcoded '2025') in LeagueTableWrapper and any other locations

### SEO

- [ ] **SEO-01**: Every page has appropriate meta title and description tags
- [ ] **SEO-02**: Open Graph tags (og:title, og:description, og:image) are set per page
- [ ] **SEO-03**: sitemap.xml is generated covering all leagues, teams, and locales
- [ ] **SEO-04**: robots.txt is configured with appropriate crawl directives
- [ ] **SEO-05**: hreflang tags link equivalent pages across all 5 locales

### Ads

- [ ] **ADS-01**: Google AdSense script is loaded on all pages
- [ ] **ADS-02**: Responsive ad units are placed on key pages (homepage, league table, match detail)
- [ ] **ADS-03**: Ad-free zones are maintained around betting/odds content for compliance

## v1.1 Requirements (Complete)

<details>
<summary>Affiliate monetisation — all 12 requirements complete</summary>

### Affiliate Config

- [x] **AFCFG-01**: System maps each bookmaker key to its affiliate program's tracking parameter name, URL template, and affiliate ID reference
- [x] **AFCFG-02**: Affiliate IDs are loaded from environment variables per program (one env var per program)
- [x] **AFCFG-03**: Bookmaker links work for users even when affiliate ID is not yet configured (link without tracking param)
- [x] **AFCFG-04**: System constructs per-outcome deep links using API `sid` field when available

### Link Construction

- [x] **LINK-01**: Link builder applies priority chain: API-provided deep link > sid-constructed deep link > bookmaker homepage fallback
- [x] **LINK-02**: Affiliate tracking parameter is appended to all constructed links when affiliate ID is configured
- [x] **LINK-03**: Seed script uses link builder to enrich odds rows with affiliate links at ingestion time
- [x] **LINK-04**: Cron poll route uses link builder to enrich odds rows with affiliate links on each refresh

### Geo Filtering

- [x] **GEO-01**: Regional availability config defines which bookmakers are available in which countries
- [x] **GEO-02**: Odds display filters out bookmakers not available in the user's detected country
- [x] **GEO-03**: Available bookmakers are sorted with regionally prioritised bookmakers first

### Analytics

- [x] **ANLYT-01**: Click tracking records which affiliate program was used (not just bookmaker key)

</details>

## v2 Requirements

Deferred to future milestones.

### SEO Advanced

- **SEOADV-01**: JSON-LD structured data (SportsEvent, SportsTeam) on all relevant pages
- **SEOADV-02**: Semantic HTML audit and remediation across all pages
- **SEOADV-03**: Page speed optimization (Core Web Vitals, bundle analysis, image optimization)
- **SEOADV-04**: Canonical URL management across locale variants

### Affiliate Expansion

- **AFEXP-01**: Region-specific affiliate programs for EU bookmakers (Winamax FR, Tipico DE, Betclic FR)
- **AFEXP-02**: A/B testing different bookmaker sort orders for click-through optimisation
- **AFEXP-03**: Affiliate revenue dashboard showing earnings per program per country

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live odds updating during matches | Pre-match odds sufficient for affiliate revenue |
| Bookmaker reviews/comparison pages | Content marketing, separate initiative |
| User-selectable preferred bookmaker | Requires user accounts |
| Affiliate link cloaking/redirects | Direct links simpler and more transparent |
| Age verification gate | Bookmaker handles this on their site |
| Multi-ad-network abstraction | AdSense only for v1.2, expand later if needed |
| Social media automation | Deferred to v2, requires API upgrade |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | — | Pending |
| BRAND-02 | — | Pending |
| BRAND-03 | — | Pending |
| BRAND-04 | — | Pending |
| LAYOUT-01 | — | Pending |
| LAYOUT-02 | — | Pending |
| I18N-01 | — | Pending |
| I18N-02 | — | Pending |
| I18N-03 | — | Pending |
| DEBT-01 | — | Pending |
| SEO-01 | — | Pending |
| SEO-02 | — | Pending |
| SEO-03 | — | Pending |
| SEO-04 | — | Pending |
| SEO-05 | — | Pending |
| ADS-01 | — | Pending |
| ADS-02 | — | Pending |
| ADS-03 | — | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 18

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after initial definition*
