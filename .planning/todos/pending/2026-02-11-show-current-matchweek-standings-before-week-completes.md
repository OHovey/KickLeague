---
created: 2026-02-11T07:43:26.211Z
title: Show current matchweek standings before week completes
area: api
files:
  - src/lib/pipeline/daily-resync.ts:329-360
  - src/lib/pipeline/match-completion.ts
---

## Problem

The league table only shows standings computed up to the latest **fully completed** matchweek. If matchweek 26 is in progress (e.g. 8 of 10 games played), the standings still show matchweek 25 data. This means users see stale positions that don't reflect recent results.

Verified by comparing DB (matchweek 25, all correct) against ESPN (some teams already at 26 GP with updated points). The `detectAndCorrectDrift()` function in `daily-resync.ts` explicitly finds the latest matchweek where ALL fixtures are finished before computing standings. Similarly, `handleMatchCompletion()` only recalculates standings for the completed match's matchweek.

## Solution

Compute "live" standings that include ALL finished fixtures regardless of whether the matchweek is fully complete. Options:

1. **Change standings query**: Instead of filtering to the latest complete matchweek, compute standings from all finished fixtures up to the current date. The `computeStandingsForMatchweek` function already accumulates all finished fixtures up to a target matchweek — could change to use the highest matchweek with ANY finished fixture rather than requiring ALL finished.

2. **Add a "current standings" view**: Keep the per-matchweek standings for historical accuracy, but add a separate "current" standings computation that always reflects the latest finished results.

3. **Update standings on every match completion**: `handleMatchCompletion()` could recompute standings across all finished fixtures (not just the completed match's matchweek), writing to a "current" matchweek marker.
