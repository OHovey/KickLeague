# Phase 2: League Tables & Navigation - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Display information-dense league tables with sparklines, zone colouring, form guides, position change indicators, and full-page league theming across all 5 Big 5 leagues. Responsive layout for desktop and mobile. Users can switch leagues via tab navigation with theme transitions and persistence.

</domain>

<decisions>
## Implementation Decisions

### Information Density
- Full traditional column set visible on desktop: P, W, D, L, GF, GA, GD, Pts, Form, Sparkline (10+ columns)
- Home/away splits accessed via separate tab or toggle — not inline in main table
- Form displayed as letter badges (WWDLW) with colored backgrounds — 5 letters showing last 5 results
- Position change shown as arrow + number (green up arrow with +2, red down arrow with -1, dash for unchanged)

### Sparkline Behavior
- Sparkline shows cumulative points over time (line chart showing total points accumulated)
- Covers last 10 matchweeks (rolling window, consistent density regardless of season progress)
- Interactive with tooltip on hover showing matchweek number and points at that point
- Prominent size (~120px wide) — visual focal point like CoinMarketCap style

### League Theming
- Full page transformation when switching leagues — background gradients, header colors, and accents all shift to league branding
- Smooth color transition (~300ms crossfade) when switching leagues
- Base aesthetic supports both light and dark mode with user toggle (system preference or manual)
- Navigation via horizontal tab bar with league logos/badges; selected league highlighted with its colors

### Zone Visualization
- Left border stripe indicates zones — colored vertical stripe on left edge of zone rows (green for CL, orange for Europa, red for relegation)
- Zone legend always visible — small legend below or beside table explaining zone colors
- Fixed universal zone colors across all leagues — same green/orange/red regardless of league theme
- No additional separators between zones — border stripe alone distinguishes zone boundaries

### Claude's Discretion
- Exact gradient implementations per league
- Typography and spacing details
- Loading states and skeleton design
- Error state handling
- Exact tooltip styling and positioning
- Dark/light mode color palette specifics

</decisions>

<specifics>
## Specific Ideas

- "CoinMarketCap-inspired" — information density of a financial dashboard, sparklines as focal point
- Form badges should be explicit (letters) rather than abstract (dots) — users shouldn't have to decode
- Position change should show magnitude, not just direction
- League theming should feel immersive — visiting Premier League page should feel different from La Liga page
- Sparklines should be prominent enough to draw the eye, not an afterthought

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-league-tables*
*Context gathered: 2026-02-04*
