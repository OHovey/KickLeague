---
created: 2026-02-12T23:31:36.114Z
title: Redesign match detail page layout with two-row grid
area: ui
files:
  - src/app/[locale]/matches/[id]/page.tsx
  - src/components/match-detail/H2HSection.tsx
  - src/components/match-detail/MatchStats.tsx
  - src/components/match-detail/EventsTimeline.tsx
---

## Problem

The match detail page currently stacks all sections vertically. A more information-dense layout would better use horizontal space on desktop, similar to how professional football sites present match data.

## Solution

Restructure the match detail page into a two-row grid layout:

**Row 1 (top):**
- Match summary — 2/3 width (score, teams, date, venue, key info)
- Head-to-head section — 1/3 width (meeting history, aggregate record)

**Row 2 (bottom):**
- Match stats — 50% width (possession, shots, corners, etc.)
- Match events — 50% width (goals, cards, substitutions timeline)

Use CSS grid or Tailwind grid classes (`grid grid-cols-3` for row 1, `grid grid-cols-2` for row 2). Should collapse to single-column on mobile.
