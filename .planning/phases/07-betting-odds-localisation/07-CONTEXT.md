# Phase 7: Betting, Odds & Localisation - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-bookmaker odds comparison with affiliate revenue, geo-based compliance filtering across European markets, and 5-language internationalisation (English, Spanish, German, Italian, French) with locale-aware formatting. This phase adds monetisation and internationalisation layers on top of the existing match and fixture pages.

</domain>

<decisions>
## Implementation Decisions

### Odds Display & Placement
- Odds appear **everywhere fixtures appear**: match detail pages, fixture list cards, team fixtures tab, and home page previews
- Default odds format: **decimal (2.50)**. User can switch to fractional or American
- Match detail page: **comparison table** layout (rows = bookmakers, columns = 1X2 outcomes) like Oddschecker
- Compact odds on fixture cards: **best odds per outcome + "from N bookmakers" badge** to drive clicks to full comparison
- Odds values themselves are **clickable affiliate links** (clicking '2.50' takes user to that bookmaker's bet slip)
- **Show odds movement**: arrow/color per odds cell indicating shortening or drifting since opening

### Affiliate & Bookmaker Strategy
- **Odds data provider**: The Odds API
- **Bookmaker display**: equal display for all available bookmakers, sorted by best odds. No preferential placement for any bookmaker
- **Affiliate link model**: direct deeplinks to bookmaker bet slips where supported
- **Click tracking**: log every click in own database (match, bookmaker, odds, timestamp) AND use bookmaker affiliate tracking. Enables reconciliation and own analytics
- All odds displays should **drive traffic to affiliates** as much as reasonably possible within compliance constraints

### Geo-Compliance (2-Tier System)
- **Simplified to 2 tiers** based on affiliate licensing requirements:

**Tier 1 — Show betting content (no affiliate license needed):**
United Kingdom, Denmark, Sweden, France, Portugal, Austria, Switzerland, Germany

**Tier 2 — Geo-block ALL betting content:**
Italy, Belgium, Norway, Netherlands, Poland, Spain, and all other countries

- Geo-detection method: **Claude's discretion** (Vercel edge headers or IP lookup — pick most practical for Next.js stack)
- Bookmaker filtering for Tier 1: **dynamic from The Odds API** — API returns bookmakers per region, filter to show only locally-licensed ones
- Responsible gambling: **persistent footer banner** on all pages with odds content (18+ badge, responsible gambling message)
- Germany note: revenue-share affiliate models are banned there. Must use fixed-fee CPC/CPA deals. This is a business constraint, not a code concern — the display works the same

### Localisation
- Language picker: **in header navigation**, always accessible
- URL structure: **path prefix** (/de/, /fr/, /es/, /it/) — best for SEO, standard next-intl pattern
- Translation scope: **translate everything possible** — UI labels, navigation, team names (where official translations exist), league names, dates, numbers
- Default locale detection: **browser Accept-Language header**. Fallback to English if no match among the 5 supported locales
- Locale-aware formatting: dates, times, and numbers format per locale (e.g., 1,000 in EN vs 1.000 in DE). Kickoff times in user's timezone (already implemented in Phase 3)

### Claude's Discretion
- Geo-detection implementation approach (Vercel headers vs IP lookup service)
- Odds movement indicator design (arrows, colors, micro-animations)
- Translation file structure and key naming conventions
- How to handle team names without official translations in a target language
- Loading states for odds data
- Fallback behavior when The Odds API is unavailable

</decisions>

<specifics>
## Specific Ideas

- Odds comparison table should feel like Oddschecker — scan across rows to find best price per outcome
- "From 5 bookmakers" badge on compact odds creates a funnel to the full comparison page
- Betting content display should maximise affiliate click-throughs within legal constraints
- The Odds API chosen specifically as the data provider (not API-Football odds endpoints)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

## Pending TODOs (Business Actions)

- **Register with DGOJ in Spain** — Required before Spain can move from Tier 2 (geo-blocked) to Tier 1 (showing betting content). DGOJ affiliate registration is mandatory for earning affiliate income from Spanish users
- **Add betting content to currently-blocked countries** — Once compliance is sorted per-country (e.g., Spain registration, Netherlands age-targeting), update the geo-compliance config to move countries from Tier 2 to Tier 1. Each country needs individual legal review before enabling

</deferred>

---

*Phase: 07-betting-odds-localisation*
*Context gathered: 2026-02-05*
