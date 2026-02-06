---
phase: 05-season-timeline
verified: 2026-02-05T20:30:00Z
status: gaps_found
score: 3/4 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 7/7
  gaps_closed: []
  gaps_remaining: ["Navigation arrows jump matchweek by ~5 weeks"]
  regressions: ["Navigation arrows feature was implemented correctly in f536af0 but intentionally reverted in 2b5c055"]
gaps:
  - truth: "Clicking the left arrow navigates the selected matchweek back by ~5 weeks (clamped to earliest completed)"
    status: failed
    reason: "Navigation arrows only scroll the timeline strip visually, they do not change the selected matchweek"
    artifacts:
      - path: "src/components/timeline/TimelineStrip.tsx"
        issue: "scrollByCircles function scrolls the strip visually instead of calling onSelectWeek with Math.max(earliestCompleted, selectedWeek - 5)"
    missing:
      - "Replace scrollByCircles with jumpWeek function that calls onSelectWeek(Math.max(earliestCompleted, selectedWeek - 5))"
      - "Compute earliestCompleted from matchweeks.filter(m => m.completed)"
      - "Update NavArrow onClick to call jumpWeek instead of scrollByCircles"
      - "Change disabled logic from canScrollLeft/canScrollRight to canNavLeft/canNavRight based on selectedWeek boundaries"
  - truth: "Clicking the right arrow navigates the selected matchweek forward by ~5 weeks (clamped to latest completed)"
    status: failed
    reason: "Navigation arrows only scroll the timeline strip visually, they do not change the selected matchweek"
    artifacts:
      - path: "src/components/timeline/TimelineStrip.tsx"
        issue: "scrollByCircles function scrolls the strip visually instead of calling onSelectWeek with Math.min(latestCompleted, selectedWeek + 5)"
    missing:
      - "Replace scrollByCircles with jumpWeek function that calls onSelectWeek(Math.min(latestCompleted, selectedWeek + 5))"
      - "Update right NavArrow onClick to call jumpWeek('right')"
  - truth: "Arrows are visually distinct navigation controls, not just scroll indicators"
    status: partial
    reason: "Arrows use double-chevron icon which is visually distinct, but aria-label says 'Scroll left/right' instead of 'Jump back/forward 5 matchweeks', betraying their actual scroll-only behavior"
    artifacts:
      - path: "src/components/timeline/TimelineStrip.tsx"
        issue: "aria-label says 'Scroll ${direction} 5 matchweeks' which describes scrolling action, not matchweek navigation"
    missing:
      - "Update aria-label to 'Jump back 5 matchweeks' and 'Jump forward 5 matchweeks' after implementing jump behavior"
---

# Phase 5: Season Timeline Verification Report

**Phase Goal:** Users can scrub through the season to see how the league table looked at any point in history, with smooth animated transitions as teams move up and down

**Verified:** 2026-02-05T20:30:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure (regression found)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can see a timeline bar showing all matchweeks as filled (completed) or empty (upcoming) circles | ✓ VERIFIED | TimelineCircle.tsx renders with completed/upcoming visual states: dashed border (line 37-40) for upcoming, solid fill with league color (lines 43-57) for completed |
| 2 | User can drag or tap to any completed matchweek and the league table updates to show the historical standings at that point | ✓ VERIFIED | TimelineStrip.tsx has onClick handlers (lines 185-189), LeagueTableWrapper.tsx passes matchweek to LeagueTableClient (line 106), fetchStandings accepts matchweek param (actions.ts line 25), getStandingsWithZones accepts matchweek param (queries.ts line 312) |
| 3 | Table rows animate smoothly when the selected matchweek changes, with teams visibly sliding to their new positions | ✓ VERIFIED | AnimatedTableRow uses motion.div with layout="position" (line 40) and staggered spring transitions with delay: index * 0.015 (line 47). LayoutGroup wraps rows (LeagueTableClient.tsx line 204). NumberFlow provides digit-spin for stats (AnimatedStatCell.tsx lines 17-23) |
| 4a | Left and right arrow buttons appear at each end of the timeline bar | ✓ VERIFIED | TimelineStrip.tsx renders NavArrow components at both ends (lines 157-161 for left, 194-198 for right) |
| 4b | Clicking the left arrow navigates the selected matchweek back by ~5 weeks (clamped to earliest completed) | ✗ FAILED | Implementation only scrolls the strip visually via scrollByCircles (lines 111-122). Does NOT call onSelectWeek. Commit f536af0 implemented jumpWeek correctly, but commit 2b5c055 reverted it to scroll-only behavior |
| 4c | Clicking the right arrow navigates the selected matchweek forward by ~5 weeks (clamped to latest completed) | ✗ FAILED | Same issue as 4b — scrollByCircles instead of jumpWeek |
| 4d | Arrows are visually distinct navigation controls, not just scroll indicators | ⚠️ PARTIAL | Double-chevron SVG (lines 51-52, 56-57) is visually distinct, but aria-label "Scroll ${direction} 5 matchweeks" reveals scroll-only intent. Behavior does not match visual affordance |

**Score:** 3/4 must-haves verified (4a passed, 4b-4d failed/partial due to same root cause)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/hooks/use-matchweek.ts` | nuqs-powered hook for ?week= URL parameter | ✓ VERIFIED | Exists (14 lines), exports useMatchweek, uses parseAsInteger from nuqs (line 11), returns {week, setWeek} |
| `src/components/timeline/SeasonTimeline.tsx` | Main timeline container orchestrating strip, controls, and state | ✓ VERIFIED | Exists (82 lines), renders TimelineStrip + TimelineControls, manages auto-play via useAutoPlay hook |
| `src/components/timeline/TimelineStrip.tsx` | Horizontal scrollable circle strip with drag and click interaction | ⚠️ PARTIAL | Exists (201 lines), renders matchweek circles, has NavArrow components, keyboard navigation, scroll-snap. BUT: NavArrow only scrolls strip, does not jump matchweek |
| `src/components/timeline/TimelineCircle.tsx` | Individual matchweek circle with filled/hollow/selected states | ✓ VERIFIED | Exists (88 lines), forwardRef component, renders different visual states based on completed/isSelected props |
| `src/components/timeline/TimelineControls.tsx` | Play/pause button for auto-advance | ✓ VERIFIED | Exists (72 lines), renders play/pause/replay icons based on state, proper aria-labels |
| `src/components/timeline/useAutoPlay.ts` | Auto-advance interval hook with proper cleanup | ✓ VERIFIED | Exists (53 lines), uses setInterval with useRef to avoid stale closures, auto-pauses at end |
| `src/components/league-table/HistoricalBanner.tsx` | Colored banner showing 'Viewing Matchweek N' with return-to-current button | ✓ VERIFIED | Exists (31 lines), conditional render based on isHistorical (line 14), shows matchweek number and return button |
| `src/components/league-table/AnimatedTableRow.tsx` | Motion-powered div-based table row with layout='position' and stagger delay | ✓ VERIFIED | Exists (162 lines), uses motion.div with layout="position" (line 40), spring transition with index * 0.015 delay (line 47) |
| `src/components/league-table/AnimatedStatCell.tsx` | NumberFlow-wrapped stat cell for animated number transitions | ✓ VERIFIED | Exists (26 lines), wraps NumberFlow with 300ms duration (lines 19-20), trend={0} for shortest-path spin (line 21) |
| `src/lib/standings/queries.ts` | getStandingsWithZones with optional matchweek param, getMatchweekList function | ✓ VERIFIED | Modified, exports both functions, matchweek parameter accepted at line 312, lte bound added to sparkline query (line 179) |
| `src/components/league-table/actions.ts` | fetchStandings with optional matchweek, fetchMatchweekList server action | ✓ VERIFIED | Modified, fetchStandings accepts matchweek param (line 25), fetchMatchweekList calls getMatchweekList (line 38) |
| `src/components/league-table/LeagueTableWrapper.tsx` | Integration point managing matchweek state, timeline rendering, and historical data | ✓ VERIFIED | Modified (111 lines), uses useMatchweek hook (line 25), fetches matchweek list, renders SeasonTimeline + HistoricalBanner + LeagueTableClient |
| `src/components/league-table/LeagueTableClient.tsx` | Accepts optional matchweek prop | ✓ VERIFIED | Modified, accepts matchweek prop (line 14), passes to fetchStandings (line 87), uses LayoutGroup for animation sync (line 204) |
| `package.json` | motion and @number-flow/react dependencies | ✓ VERIFIED | Contains motion@12.33.0 (line 25) and @number-flow/react@0.5.11 (line 16) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| SeasonTimeline | use-matchweek.ts | useMatchweek hook controls selected week state | ✓ WIRED | LeagueTableWrapper imports and calls useMatchweek (line 25), passes week state to SeasonTimeline via selectedWeek prop |
| SeasonTimeline | LeagueTableClient | passes selected matchweek prop to table | ✓ WIRED | LeagueTableWrapper passes matchweek to LeagueTableClient (line 106) when isHistorical is true |
| LeagueTableWrapper | SeasonTimeline | renders timeline above the table | ✓ WIRED | LeagueTableWrapper renders SeasonTimeline (lines 83-94) with all required props |
| use-matchweek.ts | nuqs | parseAsInteger for ?week= URL parameter | ✓ WIRED | use-matchweek.ts imports parseAsInteger from nuqs (line 3), uses with useQueryState (line 11) |
| useAutoPlay | use-matchweek.ts | advances week via setWeek on interval tick | ✓ WIRED | SeasonTimeline's handleAdvance callback calls onWeekChange which ultimately calls setWeek (LeagueTableWrapper lines 60-70) |
| AnimatedTableRow | motion/react | motion.div with layout='position' for FLIP animation | ✓ WIRED | AnimatedTableRow imports motion from motion/react (line 5), uses layout="position" (line 40) |
| AnimatedTableRow | AnimatedStatCell | renders AnimatedStatCell for numeric stats | ✓ WIRED | AnimatedTableRow imports AnimatedStatCell (line 7), renders for position, played, won, etc. (lines 70, 86, 91, etc.) |
| AnimatedStatCell | @number-flow/react | NumberFlow digit-spin animation | ✓ WIRED | AnimatedStatCell imports NumberFlow (line 3), renders with value prop (lines 17-23) |
| LeagueTableClient | LayoutGroup | wraps rows for synchronized layout animations | ✓ WIRED | LeagueTableClient imports LayoutGroup (line 4), wraps AnimatedTableRow components (line 204) |
| fetchStandings | getStandingsWithZones | passes matchweek parameter | ✓ WIRED | actions.ts calls getStandingsWithZones(league, undefined, matchweek) at line 26 |
| TimelineStrip NavArrow | onSelectWeek | navigation arrows should jump matchweek by ~5 weeks | ✗ NOT_WIRED | NavArrow onClick calls scrollByCircles (lines 159, 196) which only scrolls the strip. Does NOT call onSelectWeek. Git history shows f536af0 implemented jumpWeek correctly, but 2b5c055 reverted it |

### Requirements Coverage

| Requirement | Phase | Status | Blocking Issue |
|-------------|-------|--------|----------------|
| TIME-01: Interactive timeline bar showing all matchweeks (filled/empty circles) | 5 | ✓ SATISFIED | None |
| TIME-02: User can drag/tap to any matchweek to view historical table state | 5 | ✓ SATISFIED | None |
| TIME-03: Table animates smoothly when changing matchweek | 5 | ✓ SATISFIED | None |
| DATA-05: Table snapshots stored per matchweek for timeline feature | 5 | ✓ SATISFIED | getStandingsWithZones accepts matchweek param, sparkline data correctly bounded |

**Additional success criterion from ROADMAP (not in REQUIREMENTS.md):**
| Criterion | Status | Blocking Issue |
|-----------|--------|----------------|
| Navigation arrows at each end of the timeline strip that scroll the strip by ~5 circles | ✗ BLOCKED | NavArrow only scrolls strip, does not jump selectedWeek by 5 weeks as specified in 05-03-PLAN.md |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/timeline/TimelineStrip.tsx | 111-122 | scrollByCircles function that only scrolls strip visually instead of changing selected matchweek | 🛑 Blocker | Navigation arrows do not achieve their goal of providing quick 5-week jumps through the timeline. User must still click individual circles or use keyboard navigation. |
| src/components/timeline/TimelineStrip.tsx | 28 | aria-label says "Scroll ${direction} 5 matchweeks" instead of "Jump back/forward 5 matchweeks" | ⚠️ Warning | Accessibility label describes scroll action instead of intended navigation action, misleading screen reader users |
| src/components/timeline/TimelineStrip.tsx | 74-83, 159-161, 194-198 | canScrollLeft/canScrollRight based on scroll position, not selectedWeek boundaries | ⚠️ Warning | Disabled state logic does not match intended navigation behavior (arrows should disable at matchweek boundaries, not scroll boundaries) |

### Regression Analysis

**Commit History:**
1. `f536af0` (2026-02-05T20:06:17Z): Correctly implemented `jumpWeek` function with `Math.max(earliestCompleted, selectedWeek - step)` and `Math.min(latestCompleted, selectedWeek + step)` logic
2. `2b5c055` (2026-02-05T20:12:41Z): Intentionally reverted to `scrollByCircles` behavior with commit message "change nav arrows to scroll timeline strip instead of jumping matchweek"

**Root Cause:** The feature was implemented correctly according to plan 05-03, but then deliberately changed to scroll-only behavior. The SUMMARY.md (05-03-SUMMARY.md) still claims "jumpWeek logic with 5-week step and boundary clamping" (line 68), which is false. The previous VERIFICATION.md also incorrectly verified this feature as passed.

### Human Verification Required

#### 1. Visual Timeline Interaction

**Test:** Open the app, view the timeline strip above the league table. Click on a past matchweek circle.

**Expected:** The circle should highlight (scale up, bright fill, glow effect), the league table below should update to show standings from that historical matchweek, and table rows should slide smoothly to their new positions with a cascading stagger effect.

**Why human:** Visual polish, animation smoothness, and perceived responsiveness can't be verified programmatically.

#### 2. Auto-Play Feature

**Test:** Click the play button at the left of the timeline.

**Expected:** Matchweeks should advance automatically at ~1 second intervals. The table should animate on each change. The button should switch to a pause icon. Clicking pause should stop auto-advance. When reaching the end, the button should show a replay icon.

**Why human:** Timing-based behavior and multi-state UI transitions need manual verification.

#### 3. Historical Banner

**Test:** Select a historical matchweek (not the latest). Then click "Return to Current".

**Expected:** A colored banner should appear saying "Viewing Matchweek N". Clicking "Return to Current" should snap back to the latest matchweek and hide the banner.

**Why human:** UI state transitions and banner appearance/disappearance need visual confirmation.

#### 4. URL Shareability

**Test:** Select a historical matchweek, copy the URL from the address bar, open in a new tab or share with another device.

**Expected:** The URL should include `?week=N`. Opening the URL should load the page directly at that matchweek view with the correct standings data.

**Why human:** End-to-end URL state persistence across browser sessions requires manual verification.

#### 5. NumberFlow Digit-Spin Animation

**Test:** Switch between different matchweeks (e.g., matchweek 10 to matchweek 20).

**Expected:** Stat numbers (P, W, D, L, GF, GA, GD, Pts) should animate with a digit-spinning effect, not instantly snap to new values. The spin should be smooth and take ~300ms.

**Why human:** Animation quality and timing perception can't be programmatically verified.

### Gaps Summary

**1 gap blocking goal achievement:**

The navigation arrows at each end of the timeline strip only scroll the strip visually instead of jumping the selected matchweek by ~5 weeks as specified in the phase goal's 4th success criterion.

**Root Cause:** Commit 2b5c055 intentionally reverted the correct implementation from f536af0. The current `scrollByCircles` function (lines 111-122) scrolls the DOM element, it does not call `onSelectWeek` to change the selected matchweek.

**Impact:** Users cannot use the navigation arrows to quickly jump through the season. They must:
- Click individual matchweek circles (tedious for jumping 10+ weeks)
- Use auto-play and wait for each intermediate matchweek to animate (slow)
- Use keyboard left/right arrows which only advance one week at a time (tedious)

**Fix Required:**
1. Replace `scrollByCircles` with `jumpWeek` function that calls `onSelectWeek(Math.max(earliestCompleted, selectedWeek - 5))` for left, `onSelectWeek(Math.min(latestCompleted, selectedWeek + 5))` for right
2. Compute `earliestCompleted` from `matchweeks.filter(m => m.completed)`
3. Replace `canScrollLeft`/`canScrollRight` state with `canNavLeft`/`canNavRight` computed from `selectedWeek` boundaries
4. Update NavArrow aria-labels to "Jump back 5 matchweeks" and "Jump forward 5 matchweeks"
5. Remove scroll-related state tracking (lines 74-96) as it's no longer needed

**Note:** The rest of the timeline feature is correctly implemented and wired. Truths 1-3 are fully verified. This is a localized gap in TimelineStrip.tsx only.

---

_Verified: 2026-02-05T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
