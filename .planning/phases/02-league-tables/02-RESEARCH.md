# Phase 2: League Tables & Navigation - Research

**Researched:** 2026-02-04
**Domain:** React data tables, sparkline charts, CSS theming, URL state management
**Confidence:** HIGH

## Summary

This phase requires building information-dense league tables with interactive sparklines, responsive mobile layouts, league-specific theming with smooth transitions, and URL-based state persistence. The research identified a clear technology stack that integrates well with the existing Next.js 15 + TailwindCSS 4 foundation.

Key findings:
- **Recharts** is the standard for sparklines with tooltips in React - use it via shadcn/ui chart components for consistency
- **TailwindCSS 4 @theme directive** with CSS variables enables seamless multi-theme switching via data attributes
- **nuqs** provides type-safe URL state management that works with Next.js 15 App Router (searchParams Promise types)
- **Pseudo-element opacity technique** is required for smooth gradient transitions (CSS cannot natively transition gradients)
- Build responsive tables with CSS/Tailwind - avoid heavy table libraries for this use case

**Primary recommendation:** Use Recharts (via shadcn/ui charts) for sparklines with tooltips, nuqs for league selection persistence, and TailwindCSS 4 data-attribute theming with opacity-based gradient transitions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.x | Sparkline charts with tooltips | Composable, lightweight, built-in tooltip support, shadcn/ui uses it |
| nuqs | ^2.x | URL state management | Type-safe, 6kb gzipped, works with Next.js 15 Promise searchParams |
| TailwindCSS | ^4.x | Theming and responsive layout | Already in stack, @theme directive perfect for multi-theme |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-tabs | latest | Tab navigation component | League selector tabs |
| clsx | latest | Conditional class names | Zone styling, theme classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | @mui/x-charts SparkLineChart | MUI requires heavier bundle, recharts more flexible |
| recharts | react-sparklines | Limited tooltip support, less maintained |
| nuqs | native useSearchParams | No type safety, manual serialization, no defaults |
| custom table | TanStack Table | Overkill for static league table, adds complexity |

**Installation:**
```bash
npm install recharts nuqs @radix-ui/react-tabs clsx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx                    # NuqsAdapter wrapper
│   ├── globals.css                   # Theme CSS variables
│   └── [league]/
│       └── page.tsx                  # League page with dynamic theme
├── components/
│   ├── league-table/
│   │   ├── LeagueTable.tsx           # Main table component
│   │   ├── TableRow.tsx              # Row with zone styling
│   │   ├── FormBadges.tsx            # WWDLW form display
│   │   ├── PositionChange.tsx        # Arrow + number indicator
│   │   └── Sparkline.tsx             # Points over time chart
│   ├── league-nav/
│   │   ├── LeagueTabs.tsx            # Tab navigation
│   │   └── LeagueLogo.tsx            # League badge/logo
│   └── ui/
│       └── chart.tsx                 # shadcn/ui chart wrapper
├── lib/
│   ├── themes/
│   │   ├── league-themes.ts          # Theme definitions per league
│   │   └── theme-provider.tsx        # Theme context if needed
│   └── hooks/
│       └── use-league.ts             # nuqs hook for league state
└── styles/
    └── themes.css                    # League-specific CSS variables
```

### Pattern 1: Data-Attribute Theming (TailwindCSS 4)
**What:** Define CSS variables per league, switch via data-theme attribute on html/body
**When to use:** Multi-theme support with smooth color transitions
**Example:**
```css
/* globals.css */
@import "tailwindcss";

@theme inline {
  --color-primary: var(--league-primary);
  --color-accent: var(--league-accent);
  --color-bg-gradient-start: var(--league-bg-start);
  --color-bg-gradient-end: var(--league-bg-end);
}

@layer base {
  :root {
    /* Default/Premier League */
    --league-primary: #3d195b;
    --league-accent: #00ff87;
    --league-bg-start: #3d195b;
    --league-bg-end: #1a0a2e;
  }

  [data-theme="la-liga"] {
    --league-primary: #ee8707;
    --league-accent: #1a1a1a;
    --league-bg-start: #ee8707;
    --league-bg-end: #5a3200;
  }

  [data-theme="serie-a"] {
    --league-primary: #024494;
    --league-accent: #ffffff;
    --league-bg-start: #024494;
    --league-bg-end: #001d40;
  }

  [data-theme="bundesliga"] {
    --league-primary: #d20515;
    --league-accent: #ffffff;
    --league-bg-start: #d20515;
    --league-bg-end: #5a0208;
  }

  [data-theme="ligue-1"] {
    --league-primary: #091c3e;
    --league-accent: #daff02;
    --league-bg-start: #091c3e;
    --league-bg-end: #030810;
  }
}
```

### Pattern 2: nuqs for League Selection State
**What:** Type-safe URL state for selected league with localStorage sync
**When to use:** League persistence across page reloads
**Example:**
```typescript
// lib/hooks/use-league.ts
import { parseAsStringEnum, useQueryState } from 'nuqs';

const LEAGUES = ['premier-league', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1'] as const;
type League = typeof LEAGUES[number];

export function useLeague() {
  const [league, setLeague] = useQueryState(
    'league',
    parseAsStringEnum(LEAGUES).withDefault('premier-league')
  );

  return { league, setLeague, leagues: LEAGUES };
}
```

### Pattern 3: Sparkline with Recharts
**What:** Minimal line chart with hover tooltip showing matchweek/points
**When to use:** Points-over-time visualization per team
**Example:**
```tsx
// components/league-table/Sparkline.tsx
'use client';

import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: { matchweek: number; points: number }[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 120, height = 32 }: SparklineProps) {
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="points"
            stroke="currentColor"
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const { matchweek, points } = payload[0].payload;
              return (
                <div className="bg-background border rounded px-2 py-1 text-xs shadow">
                  <div>MW {matchweek}</div>
                  <div className="font-semibold">{points} pts</div>
                </div>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Pattern 4: Gradient Transition via Opacity
**What:** Smooth background gradient transitions using pseudo-element
**When to use:** Theme switching animation (300ms as per requirements)
**Example:**
```tsx
// components/ThemeBackground.tsx
'use client';

import { useEffect, useState } from 'react';

export function ThemeBackground({ theme }: { theme: string }) {
  const [prevTheme, setPrevTheme] = useState(theme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (theme !== prevTheme) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPrevTheme(theme);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [theme, prevTheme]);

  return (
    <>
      {/* Base layer: previous theme */}
      <div
        data-theme={prevTheme}
        className="fixed inset-0 -z-20 bg-gradient-to-b from-[var(--league-bg-start)] to-[var(--league-bg-end)]"
      />
      {/* Overlay layer: new theme fading in */}
      <div
        data-theme={theme}
        className={`fixed inset-0 -z-10 bg-gradient-to-b from-[var(--league-bg-start)] to-[var(--league-bg-end)] transition-opacity duration-300 ${
          isTransitioning ? 'opacity-100' : theme !== prevTheme ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </>
  );
}
```

### Pattern 5: Responsive Table with Expandable Rows
**What:** Desktop shows all columns, mobile shows condensed view with tap-to-expand
**When to use:** Mobile-friendly data tables
**Example:**
```tsx
// components/league-table/TableRow.tsx
'use client';

import { useState } from 'react';
import { Sparkline } from './Sparkline';

interface TeamRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string;
  sparklineData: { matchweek: number; points: number }[];
  positionChange: number;
}

export function TableRow({ row, zoneColor }: { row: TeamRow; zoneColor?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="md:cursor-default cursor-pointer hover:bg-white/5"
      >
        {/* Zone indicator */}
        <td className="relative">
          {zoneColor && (
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: zoneColor }}
            />
          )}
          <span className="pl-3">{row.position}</span>
        </td>

        {/* Always visible */}
        <td>{row.team}</td>
        <td className="text-center">{row.played}</td>

        {/* Desktop only */}
        <td className="hidden md:table-cell text-center">{row.won}</td>
        <td className="hidden md:table-cell text-center">{row.drawn}</td>
        <td className="hidden md:table-cell text-center">{row.lost}</td>
        <td className="hidden md:table-cell text-center">{row.gf}</td>
        <td className="hidden md:table-cell text-center">{row.ga}</td>

        {/* Always visible */}
        <td className="text-center">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
        <td className="text-center font-bold">{row.points}</td>

        {/* Desktop only */}
        <td className="hidden md:table-cell">
          <FormBadges form={row.form} />
        </td>

        {/* Always visible */}
        <td className="hidden sm:table-cell">
          <Sparkline data={row.sparklineData} />
        </td>

        {/* Mobile expand indicator */}
        <td className="md:hidden text-center">
          <span className={expanded ? 'rotate-180' : ''}>^</span>
        </td>
      </tr>

      {/* Expanded row for mobile */}
      {expanded && (
        <tr className="md:hidden bg-white/5">
          <td colSpan={6} className="px-4 py-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>W: {row.won}</div>
              <div>D: {row.drawn}</div>
              <div>L: {row.lost}</div>
              <div>GF: {row.gf}</div>
              <div>GA: {row.ga}</div>
              <div><FormBadges form={row.form} /></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Importing full charting libraries for sparklines:** Use only LineChart, Line, Tooltip from recharts - tree-shakable
- **Using useSearchParams without Suspense:** In Next.js 15, wrap in Suspense boundary or use nuqs which handles this
- **Direct localStorage access on render:** Causes hydration mismatch - use useEffect or nuqs (handles SSR correctly)
- **CSS transition on gradient property:** Does not work - use opacity transition on layered elements instead
- **Heavy table libraries (TanStack/MUI Data Grid):** Overkill for static display - simple HTML table with Tailwind is sufficient

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state sync | Custom searchParams parsing | nuqs | Type safety, SSR handling, defaults, history management |
| Sparkline tooltips | Custom hover handlers | Recharts Tooltip | Edge cases (touch, positioning, z-index) |
| Theme switching | Manual CSS variable toggling | TailwindCSS data-theme + @theme | Utility class generation, dark mode compat |
| Responsive tables | Media query JS detection | Tailwind responsive classes | SSR-safe, simpler, no layout shift |
| Gradient transitions | CSS transition: background | Pseudo-element opacity technique | CSS cannot transition gradients |

**Key insight:** The challenge is not building the features - it's avoiding hydration mismatches, maintaining type safety, and ensuring responsive layouts work SSR. Libraries handle these edge cases.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage
**What goes wrong:** Reading localStorage on first render causes server/client HTML mismatch
**Why it happens:** localStorage is client-only, server returns null/undefined
**How to avoid:** Use nuqs (handles SSR) or wrap localStorage reads in useEffect
**Warning signs:** Console errors about hydration mismatch, flickering on page load

### Pitfall 2: Missing Suspense for useSearchParams
**What goes wrong:** Build fails with "Missing Suspense boundary with useSearchParams"
**Why it happens:** Next.js 15 requires Suspense for static rendering compatibility
**How to avoid:** Use nuqs (wraps this automatically) or add explicit Suspense boundaries
**Warning signs:** Works in dev, fails in production build

### Pitfall 3: Gradient Transition Not Working
**What goes wrong:** Theme background jumps instantly instead of transitioning
**Why it happens:** CSS cannot animate between two gradients
**How to avoid:** Use opacity transition on layered pseudo-elements (see Pattern 4)
**Warning signs:** transition-all or transition-colors on gradient element

### Pitfall 4: Sparkline Performance in Large Tables
**What goes wrong:** Table with 20 sparklines re-renders slowly
**Why it happens:** Each sparkline is a full SVG chart component
**How to avoid:** Memoize sparkline components, ensure data arrays are stable references
**Warning signs:** Laggy scroll, high CPU when switching leagues

### Pitfall 5: Zone Color Logic Errors
**What goes wrong:** Wrong teams highlighted for zones
**Why it happens:** Off-by-one errors, forgetting zones are position ranges inclusive
**How to avoid:** Use data from league_zones table directly, test edge cases (position 1, position 20)
**Warning signs:** CL zone shows 5 teams instead of 4, relegation starts at wrong position

### Pitfall 6: Mobile Tap Target Size
**What goes wrong:** Rows hard to tap on mobile, wrong row expands
**Why it happens:** Insufficient padding, touch targets overlap
**How to avoid:** Minimum 44px row height, use entire row as tap target
**Warning signs:** Misclicks, accessibility audit failures

## Code Examples

Verified patterns from official sources:

### NuqsAdapter Setup (Next.js App Router)
```typescript
// app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

### Form Badges Component
```tsx
// components/league-table/FormBadges.tsx
const RESULT_COLORS = {
  W: 'bg-green-500',
  D: 'bg-gray-400',
  L: 'bg-red-500',
} as const;

export function FormBadges({ form }: { form: string }) {
  // form is "WWDLW" string
  return (
    <div className="flex gap-1">
      {form.split('').map((result, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white ${
            RESULT_COLORS[result as keyof typeof RESULT_COLORS] || 'bg-gray-300'
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
```

### Position Change Indicator
```tsx
// components/league-table/PositionChange.tsx
export function PositionChange({ change }: { change: number }) {
  if (change === 0) {
    return <span className="text-gray-400">-</span>;
  }

  const isUp = change > 0;
  return (
    <span className={isUp ? 'text-green-500' : 'text-red-500'}>
      {isUp ? '↑' : '↓'} {Math.abs(change)}
    </span>
  );
}
```

### Zone Color Lookup
```typescript
// lib/zones.ts
import { leagueZones } from '@/db/schema/leagues';

type ZoneType = 'champions_league' | 'europa_league' | 'conference_league' | 'relegation' | 'relegation_playoff';

const ZONE_COLORS: Record<ZoneType, string> = {
  champions_league: '#22c55e',      // green-500
  champions_league_qualifying: '#86efac', // green-300
  europa_league: '#f97316',         // orange-500
  conference_league: '#a855f7',     // purple-500
  relegation_playoff: '#fbbf24',    // amber-400
  relegation: '#ef4444',            // red-500
};

export function getZoneColor(zones: typeof leagueZones.$inferSelect[], position: number): string | null {
  for (const zone of zones) {
    if (position >= zone.startPosition && position <= zone.endPosition) {
      return zone.color; // Use stored color from DB
    }
  }
  return null;
}
```

### Server Component with nuqs Cache
```typescript
// app/[league]/page.tsx
import { createSearchParamsCache, parseAsStringEnum } from 'nuqs/server';

const LEAGUES = ['premier-league', 'la-liga', 'serie-a', 'bundesliga', 'ligue-1'] as const;

const searchParamsCache = createSearchParamsCache({
  league: parseAsStringEnum(LEAGUES).withDefault('premier-league'),
});

export default async function LeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league } = await searchParamsCache.parse(searchParams);

  // Fetch standings for selected league
  const standings = await getStandings(league);

  return (
    <div data-theme={league}>
      <LeagueTable standings={standings} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useSearchParams manual parsing | nuqs type-safe parsers | 2024 | Type safety, SSR handling |
| tailwind.config.js themes | TailwindCSS 4 @theme directive | 2024 | CSS-first, simpler multi-theme |
| react-sparklines | Recharts minimal LineChart | 2023 | Better tooltip support, maintained |
| class="dark" toggle | data-theme attribute | 2024 | Multi-theme beyond light/dark |
| searchParams as object | searchParams as Promise (Next.js 15) | 2024 | Must await in server components |

**Deprecated/outdated:**
- `tailwind.config.js` extend.theme approach: Replaced by @theme directive in TailwindCSS 4
- react-sparklines for interactive sparklines: Limited tooltip support, prefer Recharts
- Next.js 14 searchParams object pattern: Now Promise in Next.js 15+

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal sparkline data points**
   - What we know: CONTEXT.md specifies 10 matchweeks rolling window
   - What's unclear: How to handle early season when < 10 matchweeks exist
   - Recommendation: Show all available points if < 10, pad with null for consistent width

2. **Tiebreaker visualization**
   - What we know: H2H for La Liga/Serie A, GD for others (from prior decisions)
   - What's unclear: Whether to show tiebreaker indicator in UI
   - Recommendation: Sort correctly server-side, no UI indicator needed initially

3. **Sparkline on very small mobile**
   - What we know: MOBI-01 requires sparkline in condensed view
   - What's unclear: Minimum usable width for sparkline on 320px screens
   - Recommendation: Start with 80px width, test on real devices

## Sources

### Primary (HIGH confidence)
- [TailwindCSS Theme Variables Docs](https://tailwindcss.com/docs/theme) - @theme directive, CSS variables
- [nuqs GitHub](https://github.com/47ng/nuqs) - Installation, adapters, parsers, server-side usage
- [Next.js useSearchParams Docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - Promise type, Suspense requirements
- [Recharts GitHub](https://github.com/recharts/recharts) - Omitting axes for sparklines, hide prop

### Secondary (MEDIUM confidence)
- [CSS-Tricks Transitioning Gradients](https://css-tricks.com/transitioning-gradients/) - Pseudo-element opacity technique
- [shadcn/ui Chart Docs](https://ui.shadcn.com/docs/components/chart) - Recharts integration patterns
- [TailwindCSS v4 Multi-Theme Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15222) - Data-attribute theming pattern

### Tertiary (LOW confidence)
- WebSearch results for sparkline comparison - General ecosystem patterns
- WebSearch results for localStorage hydration - Community solutions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs verified for all libraries
- Architecture: HIGH - Patterns derived from official documentation
- Pitfalls: MEDIUM - Mix of official docs and community experience

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable ecosystem)
