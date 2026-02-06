# Requirements: FootballPulse

**Defined:** 2026-02-06
**Core Value:** Football fans can see league standings with rich visual context — sparklines, trend indicators, form runs, position history — presented with the information density of a financial dashboard.

## v1.1 Requirements

Requirements for affiliate monetisation milestone. Each maps to roadmap phases.

### Affiliate Config

- [ ] **AFCFG-01**: System maps each bookmaker key to its affiliate program's tracking parameter name, URL template, and affiliate ID reference
- [ ] **AFCFG-02**: Affiliate IDs are loaded from environment variables per program (one env var per program)
- [ ] **AFCFG-03**: Bookmaker links work for users even when affiliate ID is not yet configured (link without tracking param)
- [ ] **AFCFG-04**: System constructs per-outcome deep links using API `sid` field when available

### Link Construction

- [ ] **LINK-01**: Link builder applies priority chain: API-provided deep link > sid-constructed deep link > bookmaker homepage fallback
- [ ] **LINK-02**: Affiliate tracking parameter is appended to all constructed links when affiliate ID is configured
- [ ] **LINK-03**: Seed script uses link builder to enrich odds rows with affiliate links at ingestion time
- [ ] **LINK-04**: Cron poll route uses link builder to enrich odds rows with affiliate links on each refresh

### Geo Filtering

- [ ] **GEO-01**: Regional availability config defines which bookmakers are available in which countries
- [ ] **GEO-02**: Odds display filters out bookmakers not available in the user's detected country
- [ ] **GEO-03**: Available bookmakers are sorted with regionally prioritised bookmakers first

### Analytics

- [ ] **ANLYT-01**: Click tracking records which affiliate program was used (not just bookmaker key)

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
| AFCFG-01 | Pending | Pending |
| AFCFG-02 | Pending | Pending |
| AFCFG-03 | Pending | Pending |
| AFCFG-04 | Pending | Pending |
| LINK-01 | Pending | Pending |
| LINK-02 | Pending | Pending |
| LINK-03 | Pending | Pending |
| LINK-04 | Pending | Pending |
| GEO-01 | Pending | Pending |
| GEO-02 | Pending | Pending |
| GEO-03 | Pending | Pending |
| ANLYT-01 | Pending | Pending |

**Coverage:**
- v1.1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12 (awaiting roadmap)

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after initial definition*
