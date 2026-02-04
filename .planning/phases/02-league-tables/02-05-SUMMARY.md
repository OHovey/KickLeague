---
phase: 02-league-tables
plan: 05
subsystem: ui-components
tags: [responsive, mobile, accessibility, tailwind]

dependency-graph:
  requires: [02-04]
  provides: [responsive-table, mobile-row-expansion, table-expand-states]
  affects: [03-match-tables]

tech-stack:
  added: []
  patterns: [responsive-columns, localStorage-persistence, touch-accessibility]

key-files:
  created: []
  modified:
    - src/components/league-table/LeagueTableClient.tsx
    - src/components/league-table/LeagueTable.tsx
    - src/components/league-table/TableRow.tsx
    - src/components/league-table/ExpandedRowDetail.tsx

decisions:
  - id: responsive-cols
    choice: "Hide W/D/L/GF/GA columns on mobile, keep #/Team/P/GD/Pts visible"
    rationale: "Essential standings info (position, points, GD) visible on small screens; detail available via row expansion"

  - id: expand-states
    choice: "Three states: collapsed (5), default (10), expanded (all)"
    rationale: "Progressive disclosure - users see top positions first, can expand for full table"

  - id: touch-targets
    choice: "min-h-[44px] on all interactive elements"
    rationale: "Meets WCAG 2.1 Level AA touch target requirements"

metrics:
  duration: 5 min
  completed: 2026-02-04
---

# Phase 2 Plan 5: Mobile Responsive Layout Summary

**One-liner:** Mobile-responsive league table with condensed columns, tap-to-expand rows, and three-state table expansion with localStorage persistence.

## What Was Built

### Task 1-2: Responsive Column Visibility + Row Expansion
- **LeagueTableClient.tsx** and **TableRow.tsx**: Applied `hidden md:table-cell` responsive classes to hide W, D, L, GF, GA columns on mobile
- **TableRow.tsx**: Added useState for row expansion, onClick handler for mobile tap, chevron indicator
- **ExpandedRowDetail.tsx**: Displays W/D/L, GF/GA, and Form in a 3-column grid when row is expanded on mobile
- All cells have `min-h-[44px]` for 44px touch target compliance
- Mobile columns: #, Team, P, GD, Pts (5 columns plus expand indicator)
- Desktop columns: All 13 columns including Form, +/-, and Trend

### Task 3: Table Expand/Collapse States
- **LeagueTableClient.tsx**: Added `expandState` with three states:
  - `collapsed`: Shows 5 rows
  - `default`: Shows 10 rows (initial state)
  - `expanded`: Shows all rows
- localStorage persistence with key `table-expand-state`
- Fade gradient overlay at bottom when table is not fully expanded
- Expand/collapse button cycles through states with clear labels

## Key Implementation Details

```tsx
// Responsive column hiding pattern
<th className="hidden py-3 px-2 text-center font-medium md:table-cell">W</th>

// Touch target compliance
<td className="min-h-[44px] py-3 px-2">

// Expand state management
type ExpandState = 'collapsed' | 'default' | 'expanded';
const ROW_COUNTS: Record<ExpandState, number> = {
  collapsed: 5,
  default: 10,
  expanded: Infinity,
};

// localStorage persistence
localStorage.setItem('table-expand-state', newState);
```

## Verification Checklist

- [x] Mobile view shows only essential columns (#, Team, P, GD, Pts)
- [x] Tapping mobile row expands to show full stats (W/D/L, GF/GA, Form)
- [x] Table shows 5/10/all rows based on expand state
- [x] Expand button cycles through states
- [x] All touch targets meet 44px minimum
- [x] Expand state persists across page reload

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8c9eaeb | feat | Add responsive mobile layout with row expansion |
| a348fe5 | feat | Integrate visual components into league table (includes expand states) |

## Deviations from Plan

None - plan executed as written.

## Success Criteria Met

- [x] MOBI-01: League table shows condensed columns on mobile (position, team, P, GD, Pts, sparkline)
- [x] MOBI-02: Full detail accessible via row expansion on tap
- [x] MOBI-03: All pages responsive and touch-friendly (44px min targets)
- [x] TABL-06: Table supports three expandable states: collapsed (5 rows), default (10 rows), expanded (full)

## Next Phase Readiness

Ready for Phase 3 (Match Tables). Mobile responsive patterns established here can be reused for fixture tables.
