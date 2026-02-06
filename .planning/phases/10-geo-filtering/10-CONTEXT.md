# Phase 10: Geo-Aware Bookmaker Filtering - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Users only see bookmakers licensed to operate in their country, with locally popular bookmakers shown first. The filtering applies everywhere bookmaker data appears (odds tables, match pages, team fixture tabs). Restricted countries see no gambling content at all.

</domain>

<decisions>
## Implementation Decisions

### Country-bookmaker mapping
- Country-level granularity only (ISO country codes, no sub-regions)
- Map every country where at least one of the 8 bookmakers is licensed (best-effort research by Claude)
- Reuse existing proxy header geo detection from Phase 7
- Countries that ban online gambling entirely: hide odds section silently (no message, no gambling content shown)
- Updates via config change + deploy (changes are infrequent)

### Fallback & unknown countries
- Unknown/unmapped countries: show GB bookmaker set as default (all 8 bookmakers)
- Geo detection failure (no header/IP): treat same as unknown country — GB default
- Show subtle note when serving fallback: "Showing bookmakers for your region" or similar
- Accept geo headers as-is — no VPN detection or override attempts

### Priority ordering
- Manual priority number per bookmaker per country in the config
- Ties broken alphabetically
- Consistent ordering everywhere bookmakers appear (odds tables, match pages, team tabs)
- No user preference override — everyone in the same country sees the same order

### Filtered-out UX
- Odds table shrinks to show only available bookmakers (no empty columns)
- When no bookmakers available for a match in user's country: show "No odds available in your region" message
- Subtle count indicator: "3 of 8 bookmakers shown for your region"
- Restricted countries: silently omit the odds section entirely (no message, no gambling references)

### Claude's Discretion
- Storage approach for the mapping data (static config vs DB table — user said "you decide")
- Exact placement and styling of the region note and bookmaker count
- How to integrate filtering into the existing odds display pipeline
- Specific list of restricted countries

</decisions>

<specifics>
## Specific Ideas

- GB is the primary market and the "full experience" — serves as the default/fallback set
- Success criteria explicitly mention: French user sees Unibet but not Paddy Power; GB user sees all 8
- Paddy Power prioritized in GB, Unibet prioritized in FR — these are the benchmark examples for priority ordering

</specifics>

<deferred>
## Deferred Ideas

- User preference for bookmaker ordering (pin favorite bookmaker first) — future feature
- Sub-region granularity (e.g. UK nations with different licensing) — not needed for current 8 bookmakers

</deferred>

---

*Phase: 10-geo-filtering*
*Context gathered: 2026-02-06*
