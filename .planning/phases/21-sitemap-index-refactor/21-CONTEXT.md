# Phase 21: Sitemap Index Refactor - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the existing monolithic sitemap.xml into a segmented sitemap-index pattern where each page type (teams, matches, and future types like leagues, players, stats, h2h) has its own sitemap file. The index must be extensible so future phases can register new segments without modifying the core sitemap infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Placeholder sitemaps
- Claude's discretion on whether to create empty sitemaps for future page types or omit them until built
- Claude's discretion on whether the sitemap-index lists all known types or only populated ones
- Sitemap data must be auto-populated from the database — no manual URL seeding
- Claude's discretion on whether to include changefreq/priority hints or keep minimal (loc + lastmod)

### URL path convention
- Individual sitemap files served under `/sitemaps/` directory (e.g., `/sitemaps/teams.xml`)
- Locale variants use `xhtml:link` alternates within entries (Google's recommended hreflang-in-sitemap approach)
- Claude's discretion on sitemap-index URL (could replace `/sitemap.xml` in-place or use `/sitemap-index.xml`)
- Claude's discretion on whether one file contains all locales or separate per-locale files

### Transition strategy
- Replace the monolithic sitemap.xml in-place — same URL, new sitemap-index contents
- Automated verification that every URL in the old monolithic sitemap appears in the new segmented sitemaps — no URLs may be lost
- Claude's discretion on Search Console resubmission and robots.txt Sitemap directive approach

### Registration pattern
- Claude's discretion on central config registry vs convention-based auto-discovery for new segments
- Claude's discretion on shared fetcher interface vs per-segment custom queries
- Claude's discretion on dynamic vs ISR-cached sitemap generation
- Auto-split pagination when a sitemap segment exceeds the 50,000 URL spec limit (e.g., `/sitemaps/teams-1.xml`, `/sitemaps/teams-2.xml`)

### Claude's Discretion
- Placeholder strategy (empty sitemaps vs omit until built)
- Sitemap-index URL choice (replace in-place vs new URL)
- Locale file organization (single file all locales vs per-locale files)
- Registration mechanism (config registry vs convention discovery)
- Data-fetching interface pattern (shared vs custom per segment)
- Caching strategy (dynamic vs ISR)
- changefreq/priority inclusion
- robots.txt and Search Console transition approach

</decisions>

<specifics>
## Specific Ideas

- User wants `/sitemaps/` directory convention for segment files (not flat root or WordPress-style)
- User wants `xhtml:link` alternates for locale handling (Google's recommended approach)
- User wants in-place replacement of sitemap.xml (not a new URL with redirect)
- User wants automated URL diff verification to catch any lost URLs during transition
- User wants auto-split pagination built in from the start for future-proofing
- User wants database-driven auto-population (no manual URL lists)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-sitemap-index-refactor*
*Context gathered: 2026-02-12*
