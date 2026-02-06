# Requirements: FootballPulse

**Defined:** 2026-02-06
**Core Value:** Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history — presented with the information density of a financial dashboard.

## v1.1 Requirements

Requirements for affiliate monetisation milestone. Each maps to roadmap phases.

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

## v2 Requirements

Deferred to future milestones.

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

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AFCFG-01 | Phase 9 | Complete |
| AFCFG-02 | Phase 9 | Complete |
| AFCFG-03 | Phase 9 | Complete |
| AFCFG-04 | Phase 9 | Complete |
| LINK-01 | Phase 9 | Complete |
| LINK-02 | Phase 9 | Complete |
| LINK-03 | Phase 9 | Complete |
| LINK-04 | Phase 9 | Complete |
| GEO-01 | Phase 10 | Complete |
| GEO-02 | Phase 10 | Complete |
| GEO-03 | Phase 10 | Complete |
| ANLYT-01 | Phase 9 | Complete |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after Phase 10 execution*
