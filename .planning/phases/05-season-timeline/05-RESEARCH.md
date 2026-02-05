# Phase 5: Season Timeline - Research

**Researched:** 2026-02-05
**Domain:** Interactive timeline UI, animated table transitions, historical standings retrieval, URL state management
**Confidence:** HIGH

## Summary

Phase 5 adds an interactive season timeline that lets users scrub through historical matchweeks to see how the league table looked at any point in the season, with animated row transitions. The research covers four key domains: (1) the data layer for historical standings retrieval, (2) the timeline UI component with drag/tap interaction, (3) animated table transitions using Motion (formerly Framer Motion), and (4) URL state management for shareable matchweek links using nuqs.

The most critical finding is that **CSS `transform` does not work reliably on native HTML `<table>`/`<tr>`/`<td>` elements** for layout animations. Since Motion's `layout` prop relies entirely on CSS `transform` for FLIP-based position animations, the current `<table>`-based league table must be converted to a `<div>`-based grid layout to support smooth row reorder animations. This is the single largest architectural decision for this phase.

The existing codebase already stores historical standings per matchweek in the `standings` table (computed during seeding via `compute-historical-standings.ts`), meaning DATA-05 is largely already satisfied. The existing `getStandingsWithZones` query needs a `matchweek` parameter added, and a lightweight endpoint listing available matchweeks is needed.

**Primary recommendation:** Convert the league table from `<table>` to a CSS Grid `<div>` layout, use Motion's `layout` prop for row position animations, use `@number-flow/react` for stat counter animations, build the timeline as a custom horizontal scrollable component using Motion's drag gesture, and use nuqs `parseAsInteger` for the `?week=` URL parameter.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` | ^12.26 | Row position animations, staggered transitions, drag gestures for timeline | Industry-standard React animation library (30k+ GitHub stars), MIT licensed, replaces `framer-motion`. Import from `motion/react`. |
| `@number-flow/react` | latest | Animated number counter for stat values (P, W, D, L, GF, GA, GD, Pts) | Free, MIT licensed, dependency-free, built on Web Animations API. Used by X and Dub.co. Apple-like digit spin transitions. Motion's `AnimateNumber` is paid (Motion+ only). |
| `nuqs` | ^2.8 (already installed) | URL state for `?week=14` parameter | Already used in project for `?league=` param. Provides `parseAsInteger` for type-safe integer URL state. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nuqs/server` | (bundled with nuqs) | Server-side search param parsing | When pre-rendering historical matchweek on the server via `createSearchParamsCache` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@number-flow/react` | `react-countup` | react-countup does numeric interpolation (smooth counting); NumberFlow does digit-spin transitions which better match the "scoreboard" aesthetic specified in CONTEXT |
| `@number-flow/react` | Motion `AnimateNumber` | AnimateNumber is behind Motion+ paywall (paid). NumberFlow is free MIT. |
| Custom timeline | `react-chrono` | react-chrono is a full event timeline component; overkill for a simple matchweek scrubber strip. Custom is more appropriate given the specific circle-based design. |
| `motion` `layout` prop | CSS transitions on `transform` | CSS transitions can animate `translateY` but require manual position calculation. Motion's FLIP engine handles this automatically and correctly, including sibling displacement. |

**Installation:**
```bash
npm install motion @number-flow/react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── league-table/
│   │   ├── LeagueTableClient.tsx    # Modified: accepts matchweek prop, renders animated grid
│   │   ├── LeagueTableWrapper.tsx   # Modified: reads ?week param, passes to client
│   │   ├── AnimatedTableRow.tsx     # NEW: motion.div-based row with layout prop
│   │   ├── AnimatedStatCell.tsx     # NEW: NumberFlow-powered stat cell
│   │   ├── HistoricalBanner.tsx     # NEW: "Viewing Matchweek 14" banner
│   │   └── ...existing files...
│   └── timeline/
│       ├── SeasonTimeline.tsx       # NEW: Main timeline container
│       ├── TimelineStrip.tsx        # NEW: Horizontal scrollable circle strip
│       ├── TimelineCircle.tsx       # NEW: Individual matchweek circle
│       ├── TimelineControls.tsx     # NEW: Play/pause button
│       └── useAutoPlay.ts          # NEW: Auto-advance hook with interval
├── lib/
│   ├── hooks/
│   │   ├── use-league.ts           # Existing
│   │   └── use-matchweek.ts        # NEW: nuqs hook for ?week= param
│   └── standings/
│       └── queries.ts              # Modified: add getStandingsForMatchweek()
```

### Pattern 1: Div-Based Table with CSS Grid (Required for Layout Animations)
**What:** Replace `<table>`/`<tr>`/`<td>` with `<div>` elements using CSS Grid to enable Motion layout animations.
**When to use:** Always, for the animated league table. The static `<table>` in `LeagueTable.tsx` (server component) can remain as-is for SEO/accessibility. The `LeagueTableClient.tsx` (client component used for interactive league switching) must convert to divs.
**Why required:** CSS `transform` is not reliably applicable to table-row and table-cell display elements. Motion's `layout` prop uses FLIP animations backed by CSS `transform`. Native `<tr>` elements have `display: table-row` which does not support `transform` in all browsers (MDN spec: "only transformable elements" can be transformed, and table-column/table-column-group boxes are explicitly excluded; table-row behavior varies by browser).
**Example:**
```tsx
// Source: Motion docs + MDN CSS transform spec
import { motion, LayoutGroup } from "motion/react"

function AnimatedLeagueTable({ standings }: { standings: EnhancedStandingsRow[] }) {
  return (
    <LayoutGroup>
      {/* Header row - static, no animation needed */}
      <div className="grid grid-cols-[auto_1fr_repeat(8,auto)_auto_auto_auto] gap-x-2 ...">
        <div>#</div>
        <div>Team</div>
        <div>P</div>
        {/* ...etc */}
      </div>

      {/* Animated body rows */}
      <div className="relative">
        {standings.map((row) => (
          <motion.div
            key={row.teamId}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
            className="grid grid-cols-[auto_1fr_repeat(8,auto)_auto_auto_auto] gap-x-2 ..."
          >
            <div>{row.position}</div>
            <div>{row.teamName}</div>
            <AnimatedStatCell value={row.played} />
            {/* ...etc */}
          </motion.div>
        ))}
      </div>
    </LayoutGroup>
  )
}
```

### Pattern 2: URL-Synced Matchweek State with nuqs
**What:** Store the selected matchweek in URL search params using nuqs `parseAsInteger`.
**When to use:** For the matchweek selection state, so that `?week=14` is shareable.
**Example:**
```tsx
// Source: nuqs docs, matching existing use-league.ts pattern
import { parseAsInteger, useQueryState } from 'nuqs';

export function useMatchweek(latestMatchweek: number | null) {
  const [week, setWeek] = useQueryState(
    'week',
    parseAsInteger.withDefault(latestMatchweek ?? 1)
  );
  return { week, setWeek };
}
```

### Pattern 3: NumberFlow for Stat Counter Animation
**What:** Use NumberFlow to animate stat value changes (scoreboard-style digit spin).
**When to use:** For all numeric stat cells (P, W, D, L, GF, GA, GD, Pts) that change when the user switches matchweeks.
**Example:**
```tsx
// Source: https://number-flow.barvian.me/
import NumberFlow from '@number-flow/react'

function AnimatedStatCell({ value }: { value: number }) {
  return (
    <NumberFlow
      value={value}
      transformTiming={{ duration: 300, easing: 'ease-out' }}
      spinTiming={{ duration: 300, easing: 'ease-out' }}
      trend={0}  // No forced direction; let digits find shortest path
    />
  )
}
```

### Pattern 4: Staggered Row Animation with `layout` and Custom Transition
**What:** Each row gets a slightly delayed transition to create a cascading effect.
**When to use:** When matchweek changes and all rows reorder simultaneously.
**Example:**
```tsx
// Source: Motion docs stagger + layout animations
import { motion } from "motion/react"

function AnimatedRow({ row, index }: { row: StandingsRow; index: number }) {
  return (
    <motion.div
      key={row.teamId}
      layout
      transition={{
        layout: {
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
          delay: index * 0.015,  // 15ms stagger per row = ~300ms total for 20 teams
        }
      }}
    >
      {/* row content */}
    </motion.div>
  )
}
```

### Pattern 5: Timeline Drag Scrubbing with Motion Drag
**What:** Use Motion's drag gesture to implement horizontal scrub interaction on the timeline strip.
**When to use:** Desktop click-and-drag scrubbing across matchweek circles.
**Example:**
```tsx
// Source: Motion docs drag gesture
import { motion, useMotionValue, useTransform } from "motion/react"

function TimelineStrip({ matchweeks, onSelect }: TimelineStripProps) {
  const x = useMotionValue(0);

  return (
    <div className="overflow-hidden" ref={containerRef}>
      <motion.div
        drag="x"
        dragConstraints={containerRef}
        style={{ x }}
        className="flex gap-2"
        onDragEnd={(event, info) => {
          // Calculate which circle is closest to center
          // Call onSelect(nearestWeek)
        }}
      >
        {matchweeks.map((week) => (
          <TimelineCircle
            key={week.number}
            week={week}
            onClick={() => onSelect(week.number)}
          />
        ))}
      </motion.div>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Using `<motion.tr>` with `layout` prop:** CSS `transform` does not work reliably on table-row elements. Use div-based grid layout instead.
- **Updating table during drag (live preview):** CONTEXT explicitly states "table updates on release, not live during drag." Updating during drag would cause excessive re-renders and animation conflicts.
- **Fetching historical standings from the API on every matchweek change:** The data is already in the database. Use a server action that queries by matchweek, not a full API round-trip.
- **Re-computing tiebreakers client-side:** Tiebreaker calculation requires H2H matrix from fixtures. Keep this server-side in the existing `calculateStandings` function.
- **Animating with CSS transitions instead of Motion:** CSS transitions cannot animate between arbitrary positions when DOM order changes. Motion's FLIP engine handles this correctly by measuring positions before and after re-render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number counting animation | Custom `requestAnimationFrame` counter | `@number-flow/react` | Handles digit spin, locale formatting, accessibility, reduced-motion preference. |
| Row position FLIP animation | Manual position measurement + CSS transform | Motion `layout` prop | FLIP technique requires measuring before/after positions, applying inverse transforms, and animating. Motion does this automatically and handles interruptions, spring physics, and nested elements. |
| URL search param sync | `window.history.pushState` + `useEffect` | nuqs `useQueryState` | Already used in project. Handles serialization, default values, batching, shallow routing, history mode. |
| Horizontal scroll with snap | Custom scroll event handlers | CSS `scroll-snap-type` + `scroll-behavior: smooth` | Native browser support, no JS needed for basic snap-to-circle behavior. Motion drag for desktop scrubbing. |
| Auto-play interval | `setTimeout` chain | `setInterval` in a `useEffect` with cleanup, or a custom `useAutoPlay` hook | Clean interval management with proper cleanup prevents memory leaks. Simple enough to not need a library. |

**Key insight:** The hardest part of this phase is the animated table, not the timeline UI. The table animation requires converting from `<table>` to `<div>` grid, integrating Motion layout animations, and adding NumberFlow for stat counters. The timeline itself is a straightforward horizontal scroll strip with circle buttons.

## Common Pitfalls

### Pitfall 1: Using `layout` on Native Table Elements
**What goes wrong:** Applying Motion's `layout` prop to `<motion.tr>` or `<motion.td>` produces no animation or visual glitches, because CSS `transform` is unreliable on table-display elements.
**Why it happens:** The CSS spec states that `transform` applies to "transformable elements," which excludes some table-related display types. Browser implementations vary (Chrome may partially support it, Safari may not).
**How to avoid:** Convert the league table from `<table>`/`<tr>`/`<td>` to `<div>` elements with CSS Grid. Use `role="table"`, `role="row"`, `role="cell"` ARIA attributes to preserve accessibility semantics.
**Warning signs:** Rows don't animate when data changes; rows snap to positions; layout animations work in Chrome but not Safari.

### Pitfall 2: Layout Animation Distortion on Child Elements
**What goes wrong:** When a parent `motion.div` (the row) animates its position via `transform`, child elements (stat cells, team names) can appear stretched or distorted during the animation.
**Why it happens:** Motion's FLIP technique applies `scaleX`/`scaleY` to simulate size changes. Children inherit the parent's transform, causing visual distortion.
**How to avoid:** Add `layout` prop to direct children that should not distort, or use `layout="position"` on the row to only animate position (not size). Since table rows don't change size when reordering, `layout="position"` is the correct choice.
**Warning signs:** Text and badges appear stretched/squished during transition.

### Pitfall 3: Missing `key` Prop or Wrong Key on Animated Rows
**What goes wrong:** Rows don't animate smoothly between positions; they fade in/out instead of sliding.
**Why it happens:** React unmounts and remounts elements when keys change. Motion needs the same key on the same `motion.div` across re-renders to track it and animate its position change.
**How to avoid:** Always use `key={row.teamId}` (the stable team identifier), never `key={index}` or `key={row.position}`.
**Warning signs:** Rows fade instead of slide; AnimatePresence exit animations fire unexpectedly.

### Pitfall 4: Drag-During-Fetch Race Conditions
**What goes wrong:** User scrubs the timeline rapidly, triggering multiple concurrent server action calls. Responses arrive out of order, showing wrong matchweek data.
**Why it happens:** Each matchweek change triggers a `fetchStandings` server action. Network latency varies per request.
**How to avoid:** Use an abort controller or request ID pattern. Only apply the response if the selected matchweek still matches the requested matchweek. Alternatively, debounce the fetch (table updates on release, not during drag, per CONTEXT).
**Warning signs:** Table briefly shows incorrect matchweek data before correcting; flickering between states.

### Pitfall 5: Re-renders Breaking Layout Animation Tracking
**What goes wrong:** Motion loses track of element positions when unrelated state changes cause re-renders mid-animation.
**Why it happens:** If the component tree re-renders between Motion measuring the "first" and "last" positions in the FLIP cycle, calculations are off.
**How to avoid:** Memoize the table rows with `React.memo`. Ensure the matchweek state change is the only trigger for re-rendering the table body. Use `LayoutGroup` to synchronize animations across components.
**Warning signs:** Rows jump to wrong positions momentarily; animations are janky or incomplete.

### Pitfall 6: Auto-play Not Cleaning Up Interval
**What goes wrong:** Multiple intervals stack when component remounts, causing accelerating playback.
**Why it happens:** `setInterval` not cleaned up in `useEffect` return function, or not cleared when auto-play is paused.
**How to avoid:** Return a cleanup function from `useEffect` that calls `clearInterval`. Use a ref to store the interval ID. Clear on pause, unmount, and matchweek change.
**Warning signs:** Playback speeds up over time; console shows rapid state updates after navigating away.

### Pitfall 7: Historical Sparklines and Form Badges Not Scoped
**What goes wrong:** Sparklines show position data up to the current matchweek even when viewing a historical matchweek. Form badges show current form, not form at that point.
**Why it happens:** The existing `getSparklineData` and `getPositionChanges` queries use the latest matchweek. They need to be parameterized by the selected matchweek.
**How to avoid:** Pass the selected matchweek to all query functions. Filter sparkline data to `<= selectedMatchweek`. Compute form from the standings row's form field at the selected matchweek.
**Warning signs:** Sparkline extends beyond the selected matchweek marker; form badges show results from future matchweeks.

## Code Examples

### Historical Standings Query (Server Action)
```typescript
// Source: Extending existing src/lib/standings/queries.ts pattern
// New server action: fetch standings for a specific matchweek

'use server';

import { getStandingsWithZones } from '@/lib/standings/queries';

export async function fetchHistoricalStandings(
  league: string,
  matchweek: number
): Promise<StandingsResult> {
  // getStandingsWithZones already queries by league and gets latest matchweek
  // Need to add matchweek parameter to the existing function
  const data = await getStandingsForMatchweek(league, matchweek);
  return {
    standings: data.standings,
    zones: data.zones,
    matchweek: data.matchweek,
    leagueName: data.league?.name ?? null,
    config: data.config,
  };
}
```

### Matchweek List Query
```typescript
// Source: Extending existing query patterns with Drizzle ORM
// Returns list of matchweeks with completion status

export async function getMatchweekList(leagueSlug: string, season?: string) {
  const league = await getLeagueBySlug(leagueSlug);
  if (!league) return { matchweeks: [], config: null };

  const targetSeason = season ?? league.currentSeason;
  const config = await getLeagueConfig(league.id, targetSeason);

  // Get distinct matchweeks that have standings data (completed)
  const completedWeeks = await getDb()
    .selectDistinct({ matchweek: standings.matchweek })
    .from(standings)
    .where(
      and(
        eq(standings.leagueId, league.id),
        eq(standings.season, targetSeason)
      )
    )
    .orderBy(asc(standings.matchweek));

  const completedSet = new Set(completedWeeks.map(w => w.matchweek));
  const totalWeeks = config?.matchweeksTotal ?? 38;

  return {
    matchweeks: Array.from({ length: totalWeeks }, (_, i) => ({
      number: i + 1,
      completed: completedSet.has(i + 1),
    })),
    config,
    latestCompleted: Math.max(...completedSet, 0),
  };
}
```

### useMatchweek Hook
```typescript
// Source: nuqs docs, matching existing use-league.ts pattern
'use client';

import { parseAsInteger, useQueryState } from 'nuqs';

export function useMatchweek(latestMatchweek: number) {
  const [week, setWeek] = useQueryState(
    'week',
    parseAsInteger.withDefault(latestMatchweek)
  );

  const isHistorical = week !== latestMatchweek;

  return { week, setWeek, isHistorical };
}
```

### Auto-Play Hook
```typescript
// Custom hook for auto-advance through matchweeks
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoPlay(
  currentWeek: number,
  maxWeek: number,
  onAdvance: (week: number) => void,
  intervalMs: number = 1000
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const weekRef = useRef(currentWeek);

  // Keep ref in sync
  weekRef.current = currentWeek;

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying(p => !p), []);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = weekRef.current + 1;
      if (next > maxWeek) {
        setIsPlaying(false);
        return;
      }
      onAdvance(next);
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxWeek, onAdvance, intervalMs]);

  return { isPlaying, play, pause, toggle };
}
```

### Animated Table Row with Layout
```tsx
// Source: Motion layout animations + NumberFlow
import { motion } from "motion/react"
import NumberFlow from '@number-flow/react'

interface AnimatedRowProps {
  row: EnhancedStandingsRow;
  index: number;
  zoneColor: string | null;
}

const STAGGER_DELAY = 0.015; // 15ms per row
const STAT_TIMING = { duration: 300, easing: 'ease-out' as const };

export function AnimatedTableRow({ row, index, zoneColor }: AnimatedRowProps) {
  return (
    <motion.div
      layout="position"
      key={row.teamId}
      transition={{
        layout: {
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
          delay: index * STAGGER_DELAY,
        }
      }}
      className="grid grid-cols-[2.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_2.5rem_3rem_3rem] items-center border-b border-white/5 py-3"
      role="row"
    >
      {/* Position with zone indicator */}
      <div className="relative text-center text-sm font-medium text-white/90" role="cell">
        {zoneColor && (
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: zoneColor }}
          />
        )}
        <NumberFlow value={row.position} transformTiming={STAT_TIMING} />
      </div>

      {/* Team name */}
      <div className="text-sm font-medium text-white" role="cell">
        {row.teamName}
      </div>

      {/* Stats with animated numbers */}
      <div className="text-center text-sm text-white/70" role="cell">
        <NumberFlow value={row.played} transformTiming={STAT_TIMING} />
      </div>
      {/* ...repeat for W, D, L, GF, GA, GD, Pts */}
    </motion.div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { motion } from "framer-motion"` | `import { motion } from "motion/react"` | Late 2024 | Package renamed from `framer-motion` to `motion`. Both still published on npm; `motion` is the canonical going forward. |
| `framer-motion` AnimatePresence for list reorder | `motion` `layout` prop on each item | Stable since Framer Motion v6+ (2022) | Layout animations are the recommended approach for reorder; AnimatePresence is for enter/exit. |
| Custom `requestAnimationFrame` number counters | `@number-flow/react` | 2024-2025 | Dependency-free, accessible, handles locale formatting, reduced-motion preference. 6.3k GitHub stars. |
| `react-countup` (numeric interpolation) | `@number-flow/react` (digit spin) | 2024-2025 | NumberFlow provides Apple-like digit spin which better matches "scoreboard" aesthetic. react-countup smoothly interpolates but doesn't give the digit-rolling effect. |
| `next/router` query params | `nuqs` type-safe URL state | 2023-2024 | Already adopted in project. nuqs provides type-safe parsers, batching, shallow routing. |

**Deprecated/outdated:**
- `framer-motion` package name: Still works but `motion` is the official package going forward. All docs at motion.dev reference `motion/react` imports.
- `Reorder.Group`/`Reorder.Item` for this use case: These are for user-initiated drag-to-reorder. Our reordering is data-driven (matchweek change), so `layout` prop is the correct approach.

## Open Questions

1. **Table refactor scope: LeagueTableClient only, or both server and client components?**
   - What we know: `LeagueTable.tsx` is a server component (for SEO), `LeagueTableClient.tsx` is the client component used for interactive league switching. The timeline is a client-only feature.
   - What's unclear: Whether to maintain two separate table implementations (server `<table>` for initial render, client `<div>` grid for interactive) or unify into one.
   - Recommendation: Convert only `LeagueTableClient.tsx` to div-based grid. The server component `LeagueTable.tsx` is not used in the current page (page.tsx uses `LeagueTableWrapper` which renders `LeagueTableClient`), so it may not need changes. Verify during planning.

2. **Leagues with different matchweek counts**
   - What we know: `leagueConfig.matchweeksTotal` stores the total (34 for Bundesliga, 38 for others). The timeline needs to adapt.
   - What's unclear: Whether all 34/38 circles fit on screen without scrolling, or if horizontal scroll is always needed.
   - Recommendation: Always make the timeline horizontally scrollable. Use `matchweeksTotal` from config to render the correct number of circles. At ~28px per circle with 4px gap, 38 circles = ~1,216px, which will overflow on most screens and require scrolling. This is the intended behavior per CONTEXT.

3. **Performance of historical standings query under rapid scrubbing**
   - What we know: Each matchweek change triggers a server action. The `standings` table has a composite index on `(league_id, season, matchweek)` which should be fast.
   - What's unclear: Whether Neon serverless cold starts could cause latency during rapid auto-play.
   - Recommendation: Implement client-side caching of fetched matchweek data (simple Map). Once a matchweek's standings are fetched, cache them. When auto-playing or scrubbing, serve cached data immediately. This eliminates repeated queries for already-visited matchweeks.

4. **Accessibility of the timeline drag interaction**
   - What we know: Drag interaction is specified for desktop. Mobile uses tap. CONTEXT mentions keyboard navigation as Claude's discretion.
   - What's unclear: Best ARIA pattern for the timeline strip.
   - Recommendation: Use `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` for the timeline. Support left/right arrow keys for keyboard navigation. This follows the WAI-ARIA slider pattern.

## Sources

### Primary (HIGH confidence)
- Motion (formerly Framer Motion) docs: layout animations, `layout` prop, `layout="position"`, `LayoutGroup`, stagger, drag gesture — https://motion.dev/docs/react-layout-animations, https://motion.dev/docs/react-reorder, https://motion.dev/docs/stagger
- NumberFlow official docs and API — https://number-flow.barvian.me/
- nuqs docs: `parseAsInteger`, `useQueryState`, `createSearchParamsCache` — https://nuqs.dev
- MDN CSS `transform` spec: transformable elements exclude some table display types — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform
- Existing codebase: `src/db/schema/standings.ts` (standings table with matchweek column), `src/lib/standings/queries.ts` (getStandingsWithZones), `src/lib/seed/compute-historical-standings.ts` (historical data computation), `src/lib/hooks/use-league.ts` (nuqs pattern)

### Secondary (MEDIUM confidence)
- Motion upgrade guide (framer-motion to motion) — https://motion.dev/docs/react-upgrade-guide
- StaticMania: Animate Layout Changes in Next.js Using Motion's layout Prop — https://staticmania.com/blog/animate-layout-in-next.js-using-motions-layout-prop
- Maxime Heckel: Everything about Framer Motion layout animations — https://blog.maximeheckel.com/posts/framer-motion-layout-animations/
- jstodev: Waterfall animation for table rows using Framer Motion — https://www.jstodev.com/how-to-create-a-waterfall-like-animation-for-table-rows-in-react-using-framer-motion/
- NumberFlow GitHub (6.3k stars, MIT) — https://github.com/barvian/number-flow

### Tertiary (LOW confidence)
- CodeSandbox: react-table-animated-with-framer-motion — https://codesandbox.io/s/react-table-animated-with-framer-motion-ppei8 (older example, uses framer-motion not motion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified against official documentation. Motion is the canonical successor to Framer Motion. NumberFlow is well-established. nuqs is already in use.
- Architecture: HIGH - The div-based table conversion is well-supported by Motion docs and MDN spec. The existing database schema already stores historical matchweek data. nuqs URL pattern matches existing codebase.
- Pitfalls: HIGH - The table element + CSS transform limitation is well-documented in the CSS spec. Layout animation distortion is documented in Motion's official docs. Race condition handling is a standard concurrent UI pattern.

**Research date:** 2026-02-05
**Valid until:** 2026-03-07 (30 days — stable libraries, no breaking changes expected)
