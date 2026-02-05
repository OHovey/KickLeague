# Phase 3: Match & Fixture Pages - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Browse recent results and upcoming fixtures for any league, drill into individual match detail pages for stats, events, and H2H records. Match lists are filtered by the currently selected league. Creating lineups, live match updates, and betting odds are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Match list layout
- Match cards (not compact rows) — each match in its own card with breathing room
- Rich preview on each card: team names, crests, score/time, form dots for each team, and mini H2H win/draw/loss bar
- Cards grouped by matchweek with section headers (e.g., "Matchweek 22")
- Expanding a card shows: H2H last 5 meetings, both teams' form runs, and link to full match detail page

### Match counts and expansion
- Recent results: show last 10 by default, expandable to full season
- Upcoming fixtures: show next 10 by default, expandable to all remaining
- League table page preview: 5 recent results and 5 upcoming fixtures shown as preview cards
- Preview cards include "View all recent/upcoming matches" links that navigate to `/matches` landing on the correct tab

### Desktop vs mobile layout
- Desktop: recent results and upcoming fixtures sit side by side below the league table (visible when table is not in expanded mode)
- Mobile: preview section collapses; "Matches" link in header nav takes users to `/matches`
- Header nav contains: site title, Matches link, and language selection placeholder

### Match detail page — completed matches
- Section order: Score hero banner → Stats comparison → Events timeline → H2H history
- Events timeline: vertical center line — home events left, away events right, minute markers in the middle
- Stats displayed as horizontal comparison bars meeting in the middle (home extends left, away extends right) — FotMob/WhoScored style

### Match detail page — upcoming matches
- Form + H2H focused: both teams' recent form runs (last 5), H2H last 5 meetings, key comparative season stats (goals/game, clean sheets)
- No prediction indicators or algorithmic picks — just the data

### Results vs fixtures split
- Single `/matches` page with Results and Fixtures tabs
- Smart default: if matches happened today or recently finished, show Results tab; otherwise show Fixtures
- Matches filtered by currently selected league (league tabs from Phase 2 persist)

### Time display
- Upcoming kickoff times shown in user's local timezone, auto-detected
- Timezone abbreviation shown alongside times (e.g., "15:00 GMT", "10:00 EST")
- Completed match timestamps: relative for recent ("2 hours ago" within 24hrs), absolute date for older
- Date format: written out style — "Saturday 1 February"

### Claude's Discretion
- Score hero banner design and animation
- Comparison bar color scheme and styling
- Events timeline icon design for goals, cards, substitutions
- Exact responsive breakpoints for desktop side-by-side vs mobile collapse
- Loading states and skeleton designs

</decisions>

<specifics>
## Specific Ideas

- Match card preview on league table page should feel like a natural extension of the league table, not a separate section — integrated density
- "View all" links from preview cards land on the correct tab (recent → Results tab, upcoming → Fixtures tab)
- The CoinMarketCap-inspired information density should carry through to match cards — rich preview at a glance

</specifics>

<deferred>
## Deferred Ideas

- Header nav with language selection — language selection is Phase 7 (i18n), but Matches link in header is this phase
- Full header nav design (site title, navigation links, language selector) — capture as a cross-cutting concern; this phase adds the Matches link

</deferred>

---

*Phase: 03-match-fixture-pages*
*Context gathered: 2026-02-05*
