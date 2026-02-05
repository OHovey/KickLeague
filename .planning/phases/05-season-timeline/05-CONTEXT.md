# Phase 5: Season Timeline - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive historical timeline that lets users scrub through past matchweeks to see how the league table looked at any point in the season, with animated transitions as teams move positions. Creating the timeline UI, historical standings retrieval, and animated table transitions. Live data updates and real-time features are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Timeline presentation
- Horizontal scrollable strip showing all 38 matchweeks (scrolls horizontally, current week centered on load)
- Completed matchweeks = solid filled circles in league color; upcoming = hollow/outline circles
- Every 5th matchweek labeled below circles (MW 1, 5, 10, 15, 20, 25, 30, 35, 38) — clean, not cluttered
- Timeline positioned above the table, between league tabs and table header

### Interaction model
- Desktop: click any circle to jump to that matchweek, or click-and-drag across the strip to scrub through weeks rapidly
- Table updates on release (not live during drag) — highlight circles as you drag, table renders when cursor lifts
- Play/pause button for auto-advance through matchweeks at ~1 second intervals — lets users watch the season unfold
- Auto-play uses same ~300ms transition speed as manual navigation — consistent feel
- Mobile: horizontal swipe to scroll the timeline strip, tap a circle to select; pinch-to-zoom for precision on the timeline

### Table transition style
- Staggered slide animation — rows slide to new positions one after another with slight delay between each (cascading effect)
- Fast transitions (~300ms total) — snappy, doesn't slow down scrubbing
- Stat values (P, W, D, L, GF, GA, GD, Pts) count up/down to new values — scoreboard-style number animation
- Same animation speed for both manual navigation and auto-play

### Historical view state
- Colored banner above the table when viewing a historical matchweek: "Viewing Matchweek 14 — Nov 23, 2025"
- Banner includes a "Return to Current" button to snap back to latest matchweek
- Sparklines show position history only up to the selected matchweek; form badges show last 5 results at that point in the season
- Selected matchweek encoded in URL parameter (e.g., ?week=14) — shareable links showing standings at a specific point

### Claude's Discretion
- Exact circle sizing and spacing in the timeline strip
- Stagger delay between row animations
- Easing curve for slide and count animations
- How to handle leagues with fewer than 38 matchweeks (e.g., Bundesliga with 34)
- Loading state while historical standings are being fetched
- Keyboard navigation support (arrow keys after click)

</decisions>

<specifics>
## Specific Ideas

- The drag-scrub interaction should feel like scrubbing through a video timeline — smooth horizontal tracking with visual feedback on which week you're hovering
- The staggered row animation should make it visually clear which teams gained and which lost positions — the cascading effect draws the eye to movement
- Count-up/down on stat numbers gives a "scoreboard" feel that fits the financial dashboard aesthetic of the product
- Auto-play is key — watching the entire season unfold week by week is a compelling feature for end-of-season review

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-season-timeline*
*Context gathered: 2026-02-05*
