# Phase 12: Site Chrome & Homepage - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Consistent site header on every page (wordmark, matches link, locale switcher) and an engaging homepage with three stat-highlight cards sourced from real data. Also fix hardcoded season year to be dynamic. Existing league picker and table remain unchanged.

</domain>

<decisions>
## Implementation Decisions

### Header design
- Header contains: KickLeague wordmark, matches link (previous results + fixtures), locale switcher
- League navigation is NOT in the header — separate component concern
- Locale switcher is a dropdown menu
- Header is static (scrolls with page, not sticky)
- Mobile behavior: Claude's discretion

### Homepage layout
- No hero section or banner — stat cards sit directly between header and existing league picker
- Three stat cards in a horizontal row, stacking on mobile
- Stat cards are visually prominent (bold colors, larger text, eye-catching)
- Everything below stat cards (league picker, table) stays as-is

### Stat highlight cards
- Three cards: Top Scorer, Biggest Upset, Form Team
- Data is league-specific — cards update when the user selects a different league
- Rich content per card: stat + context (e.g., player name, team badge, goal count)
- Biggest Upset determination: Claude's discretion (odds-based or position-based, whichever works best with available data)

### Navigation & routing
- Matches link goes to a single page showing both recent results and upcoming fixtures
- Matches page is league-specific (e.g., /en/premier-league/matches)
- Locale switching preserves current page (EN on /en/premier-league → ES goes to /es/premier-league)
- Existing league picker behavior unchanged

### Claude's Discretion
- Header mobile adaptation approach
- Biggest Upset calculation method
- Stat card visual design details (spacing, typography, exact styling)
- Loading/error states for stat cards

</decisions>

<specifics>
## Specific Ideas

- Stat cards should be the first eye-catching element — prominent, not subtle
- Keep existing UI/UX patterns — this phase adds header + stat cards, not a redesign
- Header is intentionally minimal — room to add more items later

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-site-chrome-homepage*
*Context gathered: 2026-02-07*
