# Phase 15: Display Ads - Research

**Researched:** 2026-02-09
**Domain:** Google AdSense integration in Next.js 16 App Router
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Ads on all pages: homepage, league table, match detail, team detail
- Maximum 2 ad units per page
- Homepage: primary ad just before the 3 stat-highlight cards, second ad below the league table
- Match detail and team detail: ads placed between content sections (not at the bottom)
- League table page: between content sections
- Structural gap required: at least one full content section between any ad unit and odds/bookmaker content
- Ads and odds can coexist on the same page as long as separation is maintained
- On match detail pages, ads sit above the odds section (not below) to ensure natural structural gap
- No gambling ad category exclusions in AdSense settings
- Manual responsive ad units (not auto ads) -- we control placement, AdSense picks optimal size
- No fixed banner sizes -- responsive units adapt to mobile/desktop automatically
- Lazy load ads -- load only when user scrolls near the ad slot
- Skeleton placeholder in ad slots before ads load (glass-themed, matches site aesthetic) -- prevents layout shift
- Ad blocker handling: gracefully collapse -- slot disappears with no empty space, no message
- AdSense script loads component-driven: script loads when an AdUnit component mounts (not a global script tag)

### Claude's Discretion
- Sticky vs static ad behavior (one sticky unit allowed if it makes sense for UX)
- Ad slot visual treatment / container styling to integrate with dark glassmorphism theme
- Exact placement positions between content sections on match/team/table pages
- AdUnit component architecture and script loading implementation

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Summary

Google AdSense integration in a Next.js 16 App Router project is well-documented and uses a standard pattern: load the `adsbygoogle.js` script via Next.js `<Script>` component, then render `<ins class="adsbygoogle">` elements in client components that call `(window.adsbygoogle = window.adsbygoogle || []).push({})` on mount. The user's decision to use component-driven script loading (not a global script tag) adds a twist -- the script should load only when an `<AdUnit>` component mounts, not unconditionally on every page.

The main engineering challenges are: (1) lazy loading ads via IntersectionObserver so the script and push only fire when the slot scrolls near the viewport, (2) preventing Cumulative Layout Shift (CLS) with skeleton placeholders that reserve space, (3) gracefully collapsing slots when ad blockers prevent the AdSense script from executing, and (4) handling client-side route changes in the App Router so ads re-initialize on navigation.

The project already has a well-established pattern for skeleton components (glass-themed `animate-pulse` placeholders with `bg-white/5` and `bg-white/10`), so the ad skeleton should follow this exact pattern. No third-party libraries are needed -- this is pure `next/script` + IntersectionObserver + a small custom `<AdUnit>` client component.

**Primary recommendation:** Build a single `<AdUnit>` client component that handles script loading, IntersectionObserver-based lazy triggering, skeleton display, and ad blocker collapse. Place it in the existing page files at user-specified positions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/script` | Built into Next.js 16.1.6 | Load AdSense script with `afterInteractive` strategy | Official Next.js way to load third-party scripts; handles deduplication, timing, and hydration |
| IntersectionObserver API | Browser native | Lazy load ads when user scrolls near slot | No library needed; supported in all modern browsers; used for lazy ad loading across the industry |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` (`usePathname`) | Built into Next.js 16.1.6 | Detect route changes for ad re-initialization | Already used in project (Header, LanguagePicker); needed to key ad units for re-render on navigation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `<AdUnit>` component | `nextjs-google-adsense` npm package | Package uses global script loading (conflicts with user decision for component-driven loading), Pages Router focused, and adds dependency for minimal logic |
| Custom `<AdUnit>` component | `@eisberg-labs/next-google-adsense` | Similar wrapper; adds dependency for ~30 lines of custom code |

**Installation:**
```bash
# No new dependencies needed -- uses built-in Next.js APIs and browser APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ads/
      AdUnit.tsx          # Client component: script loader + IntersectionObserver + skeleton + collapse
      ad-config.ts        # Ad slot IDs, publisher ID env var, placement constants
  app/
    [locale]/
      page.tsx            # Homepage: 2 AdUnit placements
      matches/
        page.tsx          # League table page: 2 AdUnit placements
        [id]/
          page.tsx        # Match detail: 2 AdUnit placements
      teams/
        [slug]/
          page.tsx        # Team detail: 2 AdUnit placements
  app/
    globals.css           # Add unfilled ad collapse CSS rule
public/
  ads.txt                 # AdSense publisher verification file
.env.example              # Add NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
```

### Pattern 1: AdUnit Component Architecture
**What:** A single client component that encapsulates all ad logic
**When to use:** Every ad placement across all pages

The component lifecycle:
1. Render a glass-themed skeleton placeholder at mount
2. Use IntersectionObserver to detect when the slot is near the viewport (rootMargin: `200px`)
3. When intersecting: dynamically load the AdSense script (if not already loaded) and call `adsbygoogle.push({})`
4. When the ad fills, the skeleton is replaced by the ad content
5. If the ad script fails to load (ad blocker) or status is `unfilled`, collapse the wrapper to zero height

```typescript
// Source: Verified pattern from Next.js Script docs + AdSense integration guides
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Extend Window for TypeScript
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? '';

export function AdUnit({ slot, format = 'auto', className }: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const pathname = usePathname();

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Push ad when script is loaded and slot is visible
  useEffect(() => {
    if (!isVisible || !scriptLoaded) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      setAdFailed(true);
    }
  }, [isVisible, scriptLoaded, pathname]);

  // Detect ad blocker: if script hasn't loaded within timeout, collapse
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      if (!scriptLoaded) setAdFailed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, scriptLoaded]);

  // If ad failed or blocked, collapse to zero
  if (adFailed || !PUBLISHER_ID) return null;

  return (
    <div ref={containerRef} className={className}>
      {isVisible && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${PUBLISHER_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          onLoad={() => setScriptLoaded(true)}
          onError={() => setAdFailed(true)}
        />
      )}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={`ca-pub-${PUBLISHER_ID}`}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        key={`${slot}-${pathname}`}
      />
      {/* Skeleton shown while ad loads */}
      {isVisible && !scriptLoaded && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-white/5" />
      )}
    </div>
  );
}
```

### Pattern 2: Ad Slot Wrapper for CLS Prevention
**What:** A wrapper around the AdUnit that reserves min-height using ID-based CSS
**When to use:** All ad placements, to prevent layout shift before ads load

Important: Google AdSense JavaScript strips `min-height` when applied via class selectors on parent elements. Use ID-based selectors instead.

```typescript
// The container div uses an id-based approach for min-height
<div id={`ad-slot-${slotName}`} className="relative">
  <AdUnit slot={slotId} />
</div>
```

```css
/* globals.css */
[id^="ad-slot-"] {
  min-height: 100px; /* Reserve space to reduce CLS */
}

/* Collapse unfilled ads */
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}
```

### Pattern 3: Component-Driven Script Loading
**What:** The AdSense script loads only when an AdUnit component mounts and becomes visible, rather than being placed in the root layout
**When to use:** Per user decision -- script loads with component, not globally

The `next/script` component handles deduplication automatically. If multiple `<AdUnit>` components mount with the same `src`, Next.js only injects the script once. So each AdUnit can include the `<Script>` tag without worry of double-loading.

Source: [Next.js Script Component Docs](https://nextjs.org/docs/app/api-reference/components/script)

### Pattern 4: Route Change Re-initialization
**What:** When users navigate via client-side routing in the App Router, AdSense needs to re-initialize ad slots
**When to use:** All ad placements

Use `usePathname()` from `next/navigation` as part of the `key` prop on the `<ins>` element. When the pathname changes, React unmounts and remounts the `<ins>`, which triggers a fresh `adsbygoogle.push({})` call in the useEffect.

```typescript
const pathname = usePathname();
// ...
<ins key={`${slot}-${pathname}`} ... />
```

### Anti-Patterns to Avoid
- **Global script tag in root layout:** User explicitly decided against this. The script should load component-driven.
- **Auto ads:** User explicitly chose manual placement for control over betting content separation.
- **Using `display: none` on ads for responsive hiding:** Violates AdSense TOS unless using responsive ad formats.
- **Class-based min-height on ad wrappers:** Google's script strips `min-height` from class-targeted parents. Use ID selectors.
- **Multiple `adsbygoogle.push({})` for the same slot:** Can cause "adsbygoogle already has too many ads" errors. Ensure push is called once per slot per route.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Third-party script loading | Custom `<script>` injection | `next/script` with `afterInteractive` | Handles hydration timing, deduplication, cleanup |
| Viewport detection | Scroll event listeners | IntersectionObserver API | More performant, no scroll jank, native API |
| Route change detection | Custom history listener | `usePathname()` from `next/navigation` | Integrates with Next.js App Router, already used in project |

**Key insight:** The entire ad integration requires zero npm dependencies beyond what's already in the project. It's a small amount of custom code (~60 lines for the AdUnit component) using built-in browser and Next.js APIs.

## Common Pitfalls

### Pitfall 1: AdSense Script Doesn't Re-initialize on Client-Side Navigation
**What goes wrong:** Ads only show on the first page load; navigating to other pages shows empty slots.
**Why it happens:** Next.js App Router performs client-side navigation. AdSense only detects full page loads, not SPA route changes.
**How to avoid:** Key the `<ins>` element with `pathname` so React remounts it. Include `pathname` in the useEffect dependency array that calls `adsbygoogle.push({})`.
**Warning signs:** Ad impressions in AdSense dashboard are much lower than pageviews in analytics.

### Pitfall 2: Cumulative Layout Shift (CLS) from Ad Loading
**What goes wrong:** Responsive ad units load with 0px height, then expand, pushing content down.
**Why it happens:** AdSense calculates optimal size after script execution; the initial `<ins>` element has no inherent height.
**How to avoid:** Reserve space with a skeleton placeholder. Use ID-based CSS for `min-height` (Google's script strips class-based `min-height` from parents).
**Warning signs:** CLS score above 0.1 in Core Web Vitals; visible content jumping.

### Pitfall 3: Double Push Errors
**What goes wrong:** Console error "adsbygoogle already pushed too many ads in slot" or blank ad units.
**Why it happens:** Multiple `adsbygoogle.push({})` calls for the same `<ins>` element, often from React strict mode double-mount or missing cleanup.
**How to avoid:** Use a ref to track whether push has been called. Ensure `useEffect` cleanup properly handles unmounts. The `key={pathname}` approach helps because it forces a clean remount.
**Warning signs:** Console errors mentioning "too many ads" or duplicate ad requests.

### Pitfall 4: Ad Blocker Leaves Empty Space
**What goes wrong:** When ad blockers prevent the script from loading, the skeleton/placeholder remains visible, leaving an ugly gap.
**Why it happens:** The CSS `data-ad-status="unfilled"` approach only works when AdSense script runs. Ad blockers prevent the script entirely, so the attribute is never set.
**How to avoid:** Use a timeout-based fallback: if the script hasn't loaded within ~3 seconds after the slot becomes visible, collapse the wrapper by returning `null`. Also detect `onError` from the `<Script>` component.
**Warning signs:** Visible empty rectangles on pages when using an ad blocker.

### Pitfall 5: Betting Content Separation Violation
**What goes wrong:** Ad units render adjacent to or within odds/bookmaker content sections, risking compliance issues.
**Why it happens:** Developer places ad slot too close to the OddsComparisonTable or betting sections.
**How to avoid:** Enforce at least one full content section between any ad unit and betting content. On match detail pages, ads must sit ABOVE the odds section. Document the exact placement rules in ad-config.ts.
**Warning signs:** Ad unit renders immediately before or after OddsComparisonTable, ResponsibleGambling, or CompactOdds components.

### Pitfall 6: Environment Variable Not Set
**What goes wrong:** Ads don't render at all in production because `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` is missing.
**Why it happens:** Deployment misconfiguration; env var not added to hosting platform.
**How to avoid:** The AdUnit component should render `null` (not an error) when publisher ID is missing, but log a warning in development. Add the variable to `.env.example`.
**Warning signs:** No ad slots visible on any page in production.

## Code Examples

### Skeleton Placeholder (Matching Existing Project Pattern)
```typescript
// Source: Existing project skeleton pattern from StatHighlights, LeagueTableClient, etc.
function AdSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm">
      <div className="flex items-center justify-center py-8">
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
    </div>
  );
}
```

The project's existing skeleton pattern uses:
- `animate-pulse` for the shimmer effect
- `rounded-xl` or `rounded-lg` for corners
- `bg-white/5` as the primary skeleton background
- `bg-white/10` for individual shimmer bars
- `backdrop-blur-sm` for the glass effect
- `border border-white/10` for subtle borders

### ads.txt File
```
// public/ads.txt
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
Replace `pub-XXXXXXXXXXXXXXXX` with the actual publisher ID.

### Environment Variable
```
# .env.example
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=XXXXXXXXXXXXXXXX
```

### Homepage Ad Placement (Verified Against Current page.tsx)
```typescript
// Current homepage structure (src/app/[locale]/page.tsx):
// 1. StatHighlights (stat cards)
// 2. LeagueTabs (sticky nav)
// 3. LeagueTableWrapper
// 4. MatchPreviewSection
//
// Per user decision:
// - Ad 1: BEFORE StatHighlights
// - Ad 2: AFTER LeagueTableWrapper (before MatchPreviewSection)
```

### Match Detail Ad Placement (Verified Against Current page.tsx)

For **completed matches**:
```
ScoreHero
  [Ad slot 1 -- between ScoreHero and StatsComparison]
StatsComparison
EventsTimeline
  [Ad slot 2 -- between EventsTimeline and H2HSection]
H2HSection
```

For **upcoming matches**:
```
ScoreHero
FormGuide
  [Ad slot 1 -- between FormGuide and H2HSection]
H2HSection
ComparativeStats
  [Ad slot 2 -- between ComparativeStats and OddsComparisonTable]
OddsComparisonTable  <-- betting content; ad ABOVE this, separated by ComparativeStats
```

Note: On upcoming matches, the last ad (slot 2) sits above OddsComparisonTable with ComparativeStats as the structural separator. This maintains the required "at least one full content section" gap.

### Team Detail Ad Placement (Verified Against Current page.tsx)
```
TeamHero
  [Ad slot 1 -- between TeamHero and TeamTabs]
TeamTabs (contains Overview, Performance, Squad, Fixtures tabs)
  [Ad slot 2 -- after TeamTabs, at bottom of content area]
```

Note: Team detail fixtures tab can show CompactOdds within match cards. The ads sit outside the tab content (before and after TeamTabs), providing ample structural separation.

### League Table (Matches) Page Ad Placement (Verified Against Current page.tsx)
```
LeagueTabs (sticky nav)
h1 "Matches"
  [Ad slot 1 -- between h1 and ResultsFixturesTabs]
ResultsFixturesTabs
  [Ad slot 2 -- after ResultsFixturesTabs]
```

### Unfilled Ad Collapse CSS
```css
/* Source: Google AdSense official recommendation */
/* Add to globals.css */
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}
```

### TypeScript Type Declaration
```typescript
// Add to AdUnit.tsx or a separate types file
declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Max 3 ad units per page | No hard limit (quality-based) | Aug 2016 | User's 2-per-page limit is well within bounds |
| Global script tag in `<head>` | Component-driven loading with `next/script` | Next.js 11+ (2021) | Enables lazy loading and better performance |
| Fixed-size ad units (728x90, 300x250) | Responsive ad units (`data-ad-format="auto"`) | ~2019 | Adapts to container width automatically |
| Scroll event listeners for lazy loading | IntersectionObserver API | ~2020 widespread | More performant, no scroll handler overhead |

**Deprecated/outdated:**
- `adsbygoogle.js` without client param: The modern script URL includes `?client=ca-pub-XXX` as a query parameter
- `enable_page_level_ads`: Replaced by auto ads configuration in AdSense dashboard
- `data-ad-region`: Deprecated attribute, no longer needed

## Discretion Recommendations

### Sticky vs Static Ad Behavior
**Recommendation: All static, no sticky units.**
Rationale: The pages are data-dense (league tables, match stats, team charts). A sticky ad would compete with the sticky LeagueTabs navigation bar already present on homepage and matches pages. It would also complicate the betting content separation guarantee on match detail pages, since a sticky ad could visually overlap with odds content during scroll. Static ads between content sections are simpler and safer.

### Ad Slot Visual Treatment
**Recommendation: Minimal glass container with subtle border, matching existing card styling.**
The existing project uses `bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl` for glass cards. The ad wrapper should follow this pattern:
```
rounded-xl border border-white/5 bg-white/[0.02]
```
Keep it lighter than content cards so ads don't compete visually with actual content. A very subtle "Ad" label in `text-[10px] text-white/20 uppercase tracking-widest` above the slot helps with transparency without being obtrusive.

### Exact Placement Positions
See the "Code Examples" section above for verified placements. The key principle: place ads at natural break points between content sections, never within a section, and always ensure the betting content separation rule.

### AdUnit Component Architecture
**Recommendation: Single `<AdUnit>` component with IntersectionObserver baked in.**
The component handles: (1) lazy detection via IntersectionObserver, (2) script loading via `next/script`, (3) skeleton display, (4) ad blocker collapse, and (5) route change re-init via `usePathname`. This keeps all ad logic in one place. A separate `ad-config.ts` file maps slot names to AdSense slot IDs for easy management.

## Open Questions

1. **AdSense Publisher ID availability**
   - What we know: The env var `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` needs to be set
   - What's unclear: Whether the user already has an approved AdSense account and publisher ID
   - Recommendation: Build the component to gracefully render nothing when the env var is absent. Add it to `.env.example`. The actual ID is a deployment concern.

2. **Next.js `<Script>` deduplication with component-driven loading**
   - What we know: Next.js docs state Script component handles deduplication for the same `src`
   - What's unclear: Edge behavior with multiple AdUnit instances mounting simultaneously after IntersectionObserver triggers
   - Recommendation: The pattern is well-established and should work. If issues arise, a module-level `scriptLoaded` flag can serve as a fallback deduplication mechanism.

3. **Google AdSense approval timing**
   - What we know: AdSense requires site review before serving ads; new accounts may take days
   - What's unclear: Whether the site is already approved
   - Recommendation: Build the integration now; it will start serving ads once approved. Use `data-adtest="on"` during development to show test ads.

## Sources

### Primary (HIGH confidence)
- [Next.js Script Component Docs (App Router)](https://nextjs.org/docs/app/api-reference/components/script) - Script strategies, onLoad/onReady/onError callbacks, deduplication behavior
- [Google AdSense: Responsive Ad Unit Behavior](https://support.google.com/adsense/answer/9183362) - How responsive units auto-size, data attributes
- [Google AdSense: Hide Unfilled Ad Units](https://support.google.com/adsense/answer/10762946) - data-ad-status parameter, CSS collapse technique
- [Google AdSense: Ad Unit Code Placement](https://support.google.com/adsense/answer/9190028) - Where to place ad code in HTML

### Secondary (MEDIUM confidence)
- [VibeBerry: AdSense in Next.js App Router](https://vibeberry.io/blog/how-we-integrated-google-adsense-into-a-next-js-app-router-project-the-right-way) - Production implementation with Script component, AdSlot component, environment gating
- [Emile Choghi: Correct Way to Load AdSense in Next.js](https://emile.sh/blog/the-correct-way-to-load-adsense-in-next-js) - Route change detection, key-based remount, retry logic
- [Media Realm: Reducing CLS with AdSense](https://www.mediarealm.com.au/articles/google-adsense-reducing-cls-cumulative-layout-shift/) - ID-based min-height technique (Google strips class-based), CSS media queries
- [Labnol: Hide Empty AdSense Slots](https://www.labnol.org/hide-adsense-ad-units-220130) - CSS approach, data-ad-status attribute, ad blocker limitations

### Tertiary (LOW confidence)
- [DEV Community: Google AdSense in Next.js 13 App Router](https://dev.to/shriekdj/how-to-add-google-ad-sense-nextjs-13-with-app-router-auto-ads-and-unit-ads-hfa) - Class component approach (not recommended for this project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses only built-in Next.js and browser APIs; no third-party dependencies needed; patterns well-documented
- Architecture: HIGH - Component architecture verified against multiple production implementations; fits cleanly into existing project structure
- Pitfalls: HIGH - CLS prevention, ad blocker handling, and route change issues are widely documented with proven solutions
- Placement positions: HIGH - Verified against actual page source files; betting content separation rules are clear

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (stable domain; AdSense API rarely changes)
