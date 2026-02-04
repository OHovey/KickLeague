---
phase: 02
plan: 02
subsystem: theming-navigation
tags: [tailwindcss, nuqs, radix-ui, css-variables]

dependency-graph:
  requires: []
  provides: [league-themes, use-league-hook, theme-background, league-tabs]
  affects: [02-03, 02-04, 02-05]

tech-stack:
  added: [recharts, nuqs, @radix-ui/react-tabs, clsx]
  patterns: [data-attribute-theming, url-state-persistence, opacity-gradient-transition]

key-files:
  created:
    - src/lib/themes/league-themes.ts
    - src/lib/hooks/use-league.ts
    - src/components/ThemeBackground.tsx
    - src/components/league-nav/LeagueTabs.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - package.json

decisions:
  - "Spread LEAGUES array for nuqs parseAsStringEnum to avoid readonly type issue"
  - "Added Suspense boundary in page.tsx to prevent useSearchParams hydration error"
  - "Dual-layer opacity technique for gradient transitions (CSS cannot transition gradients directly)"

metrics:
  duration: 5 min
  completed: 2026-02-04
---

# Phase 02 Plan 02: League Theming Infrastructure Summary

**One-liner:** TailwindCSS 4 data-attribute theming with nuqs URL persistence and 300ms opacity-based gradient transitions.

## What Was Built

### League Theme System
- **LEAGUES const array:** Type-safe readonly array of 5 league slugs
- **LEAGUE_THEMES object:** Full theme definitions with name, slug, logoUrl placeholder, and colors (primary, accent, bgStart, bgEnd)
- **CSS variables:** @theme inline block maps Tailwind utilities to CSS custom properties
- **Data-theme selectors:** [data-theme="premier-league"], [data-theme="la-liga"], etc. in @layer base

### URL State Persistence
- **useLeague hook:** Wraps nuqs useQueryState with parseAsStringEnum for type-safe league selection
- **NuqsAdapter:** Wraps app in layout.tsx for Next.js App Router compatibility
- **Default value:** premier-league when no query param present

### Animated Theme Background
- **ThemeBackground component:** Dual-layer fixed position gradient backgrounds
- **Opacity transition:** 300ms crossfade between previous and current theme
- **State tracking:** prevTheme state enables smooth transition without gradient flash

### League Tab Navigation
- **LeagueTabs component:** Radix UI Tabs with horizontal tab bar
- **Visual styling:** Glass-morphism effect with white/10 background and backdrop-blur
- **Selection indicator:** Active tab has white/20 background and full opacity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed readonly array type for nuqs**
- **Found during:** Task 2
- **Issue:** LEAGUES as const creates readonly tuple, nuqs parseAsStringEnum expects mutable string[]
- **Fix:** Spread LEAGUES array: `parseAsStringEnum([...LEAGUES])`
- **Files modified:** src/lib/hooks/use-league.ts
- **Commit:** 6bbbcf7

**2. [Rule 3 - Blocking] Added Suspense boundary for useSearchParams**
- **Found during:** Task 3
- **Issue:** Next.js 15 requires Suspense boundary around useSearchParams usage for static generation
- **Fix:** Created HomeContent component wrapped in Suspense with LoadingFallback skeleton
- **Files modified:** src/app/page.tsx
- **Commit:** e64a7e5

## Task Commits

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Install dependencies and configure theming | 2a01c60 | package.json, globals.css, league-themes.ts |
| 2 | Create nuqs league hook and NuqsAdapter | 6bbbcf7 | use-league.ts, layout.tsx |
| 3 | Create LeagueTabs and ThemeBackground | e64a7e5 | LeagueTabs.tsx, ThemeBackground.tsx, page.tsx |

## Success Criteria Verification

- [x] **LEAG-01:** User can switch between all 5 leagues via tab navigation
- [x] **LEAG-02:** Full-page theme changes per league (gradient background)
- [x] **LEAG-03:** Theme transitions animate smoothly (~300ms fade)
- [x] **LEAG-04:** Selected league persists via URL (?league=la-liga)

## Technical Notes

### TailwindCSS 4 Theming Pattern
```css
@theme inline {
  --color-primary: var(--league-primary);
}

@layer base {
  [data-theme="premier-league"] {
    --league-primary: #3d195b;
  }
}
```

This maps CSS variables to Tailwind utilities, enabling `bg-primary` to use league-specific colors.

### Gradient Transition Technique
CSS cannot transition between two gradients. The solution uses two layers:
1. Base layer shows previous theme at full opacity
2. Overlay layer fades in new theme over 300ms
3. After transition, base layer updates to new theme

## Next Phase Readiness

Phase 02-03 (League Table Component) can proceed. All theming infrastructure is in place:
- `useLeague()` hook available for any component
- Theme variables accessible via Tailwind utilities or CSS custom properties
- Background gradient handled by ThemeBackground component
