# Phase 4: Team Detail Pages - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Tabbed team detail pages with overview stats, performance analytics, squad data, and fixture schedule. Users can explore any team's season in depth. Navigation to team pages from league tables and match pages. Creating new data sources or live updates are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Hero section & identity
- Large callout numbers for current league position (#3) and points total (52) as the visual anchor alongside the team logo
- Minimal contextual info — just team name + logo, let the stats and tabs carry the detail
- Coloured form dots (W/D/L) for recent form display — consistent with league table form dots
- League theme (gradients, colours) applied to hero section — no team-specific colour scheme

### Charts & visualizations
- Bump chart for position-over-time on overview tab — shows team's position relative to rivals crossing paths over the season
- Grouped bar chart for goals-by-period breakdown (scored vs conceded per 15-minute interval)
- xG analysis: summary stat comparison (xG vs actual goals) at top + cumulative xG line chart below for season-long view
- Home/away performance splits displayed as comparison bars (horizontal bars, home on left, away on right) — consistent with match detail stats pattern

### Squad presentation
- Roster grouped by position sections (GK, DEF, MID, FWD) with mini table in each group
- Top performer callout cards at top of squad tab: Top Scorer, Top Assister, Most Booked
- Horizontal bar per player showing % of total minutes played for minutes distribution visualization

### Claude's Discretion
- Stats shown per player within each position group (e.g., clean sheets for GK, goals for FWD — context-appropriate stats)
- Exact bump chart implementation details (number of rival teams shown, colour coding)
- Tab navigation style and order (Overview, Performance, Squad, Fixtures)
- Loading states and skeleton design
- Mobile responsive adaptations for charts and squad tables

### Fixtures tab
- Single chronological list of all fixtures — past results styled differently from upcoming, timeline feel
- Fixture rows link to match detail pages with inline preview on hover/tap before navigating
- Difficulty colouring: Claude decides the best indicator (position-based, form-based, or hybrid)
- Win probability bar for upcoming fixtures with odds — focused on the team being viewed
- Last 10 results + next 5 upcoming as the default window

</decisions>

<specifics>
## Specific Ideas

- Bump chart chosen specifically because it shows rivals crossing paths — the relational aspect matters, not just the team's own trajectory
- Inline preview on fixture hover/tap reduces unnecessary clicks to match detail pages — quick summary (score, key events) before committing to navigate
- Top performer callout cards give headline stats before diving into full roster — similar to a dashboard KPI section
- xG "both" approach (summary + cumulative chart) serves casual and analytical users in the same view

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-team-detail-pages*
*Context gathered: 2026-02-05*
