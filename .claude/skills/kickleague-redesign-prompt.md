# KickLeague Frontend Redesign Brief

> This document is a complete design brief for the `/frontend-design` skill. It captures KickLeague's full design system, page architecture, component hierarchy, and design philosophy. Use this to produce project-aware redesign proposals that push the aesthetics further while maintaining information density and respecting the existing tech stack.

---

## 1. Project Identity and Purpose

**KickLeague** is a football league statistics dashboard inspired by CoinMarketCap -- the same way crypto traders have dense, data-rich dashboards for tracking markets, football fans should have the same for tracking leagues.

- **Target audience:** Data-hungry football fans who want more information density than typical sports sites (BBC Sport, FotMob, etc.). These users want sparklines, form runs, position history, H2H bars, and comparative stats all visible at a glance.
- **Leagues covered:** 5 top European leagues -- Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **Monetisation:** Betting affiliate links (geo-gated, odds comparison tables on match detail pages) and display ads (Google AdSense, 8 slots across pages)
- **Locales:** 5 languages (en, es, de, it, fr) via next-intl

---

## 2. Current Design System

### 2.1 Theme System

Five league-specific color themes are applied via CSS custom properties and a `data-theme` attribute on root-level elements. Each theme defines four custom properties:

| League | Primary | Accent | BG Start | BG End | Character |
|---|---|---|---|---|---|
| **Premier League** | `#3d195b` | `#00ff87` | `#3d195b` | `#1a0a2e` | Deep purple with neon green -- regal, electric |
| **La Liga** | `#ee8707` | `#1a1a1a` | `#ee8707` | `#5a3200` | Warm orange with dark accent -- earthy, bold |
| **Serie A** | `#024494` | `#ffffff` | `#024494` | `#001d40` | Royal blue with white -- classic, authoritative |
| **Bundesliga** | `#d20515` | `#ffffff` | `#d20515` | `#5a0208` | Red with white -- intense, direct |
| **Ligue 1** | `#091c3e` | `#daff02` | `#091c3e` | `#030810` | Navy with neon yellow -- sleek, modern |

CSS custom properties used:
- `--league-primary` -- the league's signature color
- `--league-accent` -- contrasting accent for highlights and stat emphasis
- `--league-bg-start` -- gradient start for background
- `--league-bg-end` -- gradient end for background

These are defined in `globals.css` under `@layer base` selectors like `[data-theme="premier-league"]`.

Tailwind CSS 4 bridges these via `@theme inline`:
```css
@theme inline {
  --color-primary: var(--league-primary);
  --color-accent: var(--league-accent);
  --color-bg-gradient-start: var(--league-bg-start);
  --color-bg-gradient-end: var(--league-bg-end);
}
```

### 2.2 Background Treatment

**Base:** Flat dark `#0a0a0f` (not pure black -- slightly warm/blue)

**Theme layer:** The `ThemeBackground` component renders fixed-position radial gradients from the league's `bgStart` color at all four corners/edges, each at ~40% opacity. This creates a subtle environmental glow that changes character with each league.

**Transition:** When the user switches leagues, a crossfade transition (300ms) blends between the old and new theme gradients. Two layers are stacked with `z-index: -20` and `-10` to enable this.

**Gradient formula:**
```
radial-gradient(ellipse 80% 60% at 0% 0%, var(--league-bg-start) 0%, transparent 50%),
radial-gradient(ellipse 60% 80% at 100% 0%, var(--league-bg-start) 0%, transparent 40%),
radial-gradient(ellipse 50% 40% at 100% 100%, var(--league-bg-start) 0%, transparent 35%),
radial-gradient(ellipse 40% 50% at 0% 100%, var(--league-bg-start) 0%, transparent 30%)
```

### 2.3 Surface Treatment (Glassmorphism)

All card surfaces use a consistent glassmorphism pattern:

| Property | Value | Notes |
|---|---|---|
| Background | `bg-white/5` | 5% white opacity -- just enough to separate from background |
| Blur | `backdrop-blur-sm` | Subtle blur for glass effect |
| Border | `border border-white/10` | 10% white border for edge definition |
| Hover | `hover:bg-white/[0.08]` or `hover:bg-white/10` | Brighten on interaction |
| Corners | `rounded-lg` or `rounded-xl` | Depends on component scale |

**Depth hierarchy:**
- Background environment: 40% opacity radial gradients
- Card surfaces: 5% white with blur
- Inner sections: `border-white/5` or `border-white/10` dividers
- Interactive rows: hover to 8-10% white
- Loading states: `animate-pulse` with `bg-white/10` or `bg-white/20`

### 2.4 Typography

**Font stack:**
- Primary: **Geist Sans** (`--font-geist-sans`) -- loaded via `next/font/google`
- Monospace: **Geist Mono** (`--font-geist-mono`) -- used for code-like elements
- Body element has `antialiased` applied

**Text color scale (opacity-based):**
```
text-white          -- primary headings, scores, key stats (100%)
text-white/90       -- team names, important labels
text-white/80       -- secondary text, kickoff times
text-white/70       -- descriptions, navigation links (inactive)
text-white/60       -- context lines, supplementary info
text-white/50       -- labels, subtle text, inactive states
text-white/40       -- dates, timestamps, very subtle context
text-white/30       -- decorative text, ultra-subtle labels
```

**Label pattern:** Uppercase, tracking-widest, 10-11px (`text-[11px] font-semibold uppercase tracking-widest text-white/50`)

**Data numbers:** `tabular-nums` class for consistent digit width in scores, stats, table columns

### 2.5 Sticky Navigation

The league tabs bar is sticky to the top of the viewport:
```
sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md
```
This creates a translucent nav bar that blurs the content scrolling behind it.

### 2.6 Data Density Patterns

These patterns make KickLeague feel like a data terminal rather than a sports blog:

- **Tabular numbers:** `tabular-nums` on all numeric data for column alignment
- **Sparkline charts:** Inline SVG mini-charts in league table rows showing position history over the season (Recharts-based)
- **Form badges:** Compact W/D/L colored dots (green/gray/red) showing recent match results. Each dot is ~6x6px with a single-letter label
- **Position change indicators:** Arrows or numbers showing position movement since last matchweek
- **H2H bars:** Compact horizontal stacked bars showing head-to-head record (blue for team 1, gray for draws, orange for team 2)
- **Expandable rows on mobile:** Full stats hidden by default, tap to expand (instead of paginating or removing data)
- **Compact odds:** Small odds display inline within match cards (1 / X / 2 format)

### 2.7 Layout

- **Container:** `max-w-7xl mx-auto px-4` -- 7xl (80rem) centered with 16px padding
- **Responsive approach:** Mobile-first with `md:` and `sm:` breakpoints
- **Grid usage:** 2-column grids for match preview section (`grid grid-cols-2 gap-6`)
- **Mobile adaptations:** Homepage match preview section hidden on mobile (`hidden md:block`) -- users navigate via header link instead. League table hides secondary columns on mobile with expandable rows

---

## 3. Page Architecture

### 3.1 Homepage (`/[locale]/page.tsx`)

The homepage is the primary dashboard view. Component tree:

```
<Suspense fallback={LoadingFallback}>
  <HomeContent>
    <ThemeBackground theme={league} />
    <div min-h-screen>
      <div max-w-7xl>
        <AdUnit slotId="HOMEPAGE_TOP" />
        <StatHighlights />                    -- 3 hero stat cards in a row
      </div>
      <div sticky-nav>
        <LeagueTabs />                        -- Radix tabs, sticky top-0
      </div>
      <main max-w-7xl>
        <Suspense fallback={TableSkeleton}>
          <LeagueTableWrapper />              -- Full league standings table
        </Suspense>
        <AdUnit slotId="HOMEPAGE_BOTTOM" />
        <MatchPreviewSection>                 -- 2-column grid (hidden on mobile)
          [Recent Results]                    -- 10 compact result rows
          [Upcoming Fixtures]                 -- 5 compact fixture rows with odds
        </MatchPreviewSection>
      </main>
    </div>
  </HomeContent>
</Suspense>
```

**Visual flow:** Hero stat cards at top (eye-catching, accent-colored) --> sticky league switcher --> dense standings table --> match previews at bottom.

### 3.2 Matches Page (`/[locale]/matches/page.tsx`)

Full match listing with tab switching between results and fixtures:

```
<Suspense fallback={LoadingFallback}>
  <MatchesContent>
    <ThemeBackground theme={league} />
    <div min-h-screen>
      <div sticky-nav>
        <LeagueTabs />
      </div>
      <main max-w-7xl>
        <h1>Matches</h1>
        <AdUnit slotId="MATCHES_TOP" />
        <ResultsFixturesTabs league={league}>  -- Tab switcher (Results | Fixtures)
          [MatchCard list]                      -- Cards with team logos, scores, form,
                                                   H2H bars, compact odds
        </ResultsFixturesTabs>
        <AdUnit slotId="MATCHES_BOTTOM" />
      </main>
    </div>
  </MatchesContent>
</Suspense>
```

### 3.3 Match Detail Page (`/[locale]/matches/[id]/page.tsx`)

Server-rendered detail page for a single match. Two variants based on status:

**Completed match:**
```
<ThemeBackground theme={leagueSlug} />
<div min-h-screen>
  <div max-w-3xl>                              -- Narrower container (3xl)
    <Link back-to-matches />
    <ScoreHero />                              -- Team logos, score, venue, matchweek
    <AdUnit slotId="MATCH_DETAIL_1" />
    <StatsComparison />                        -- Side-by-side match stats bars
    <EventsTimeline />                         -- Goals, cards, subs timeline
    <AdUnit slotId="MATCH_DETAIL_2" />
    <H2HSection />                             -- Historical head-to-head
  </div>
</div>
```

**Upcoming match:**
```
<ThemeBackground theme={leagueSlug} />
<div min-h-screen>
  <div max-w-3xl>
    <Link back-to-matches />
    <ScoreHero />                              -- Team logos, kickoff time, venue
    <FormGuide />                              -- Recent form for both teams
    <AdUnit slotId="MATCH_DETAIL_1" />
    <H2HSection />                             -- Historical head-to-head
    <AdUnit slotId="MATCH_DETAIL_2" />
    <ComparativeStats />                       -- Season stat comparison
    <OddsComparisonTable />                    -- Full odds table (geo-gated)
  </div>
</div>
```

### 3.4 Team Detail Page (`/[locale]/teams/[slug]/page.tsx`)

Wider container (6xl) with hero + tabbed content:

```
<ThemeBackground theme={leagueSlug} />
<div min-h-screen>
  <div max-w-6xl>
    <TeamHero>                                 -- Logo, name, stadium, league badge
      [Position callout]  #N                   -- 3xl extrabold
      [Points callout]    NN                   -- 3xl extrabold
      [Played callout]    NN                   -- 3xl extrabold, /80 opacity
      [GD callout]        +/-NN               -- 3xl extrabold, /80 opacity
      [Form badges]       W W D L W           -- Colored dots
    </TeamHero>
    <AdUnit slotId="TEAM_DETAIL_1" />
    <TeamTabs>                                 -- Radix tabs
      [Overview]                               -- Quick stats summary
      [Performance]                            -- Charts section:
        BumpChart                              -- Position over time (Recharts)
        CumulativePointsChart                  -- Points accumulation line
        CumulativeXgChart                      -- Expected goals line
        GoalsByPeriodChart                     -- Goals by time period (bars)
        HomeAwayBars                           -- Home vs Away performance
      [Squad]                                  -- Player list
      [Fixtures]                               -- Team's match schedule
    </TeamTabs>
    <AdUnit slotId="TEAM_DETAIL_2" />
  </div>
</div>
```

---

## 4. Key Component Design Patterns

### 4.1 StatCard

The hero stat cards on the homepage. Each highlights one league-wide statistic.

**Structure:**
- Accent-colored left border (3px, `borderLeftColor: accentColor`)
- Subtle gradient overlay (7% opacity, 135deg from accent to transparent)
- Icon + label row: icon tinted to accent color, label in uppercase tracking-widest 11px at white/50
- Primary stat: `text-2xl md:text-3xl font-bold text-white`
- Subject line: team logo (28x28) + team name in accent color, `text-lg font-semibold`
- Optional context line: `text-sm text-white/60`

**Card surface:** `rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm hover:bg-white/10`

### 4.2 MatchCard

Used on the matches listing page. Symmetric team layout.

**Structure:**
- Date header: centered, `text-[11px] font-medium uppercase tracking-wider text-white/30`
- Teams + score row: `[homeName] [homeLogo] -- [score/time] -- [awayLogo] [awayName]`
  - Team names: `text-sm font-medium text-white/90`, clickable to team page
  - Logos: 32x32
  - Score: `text-lg font-bold tabular-nums text-white` (finished) or `text-sm font-medium text-white/80` (time)
- Form badges row: home form left, away form right
- H2H bar: lazy-loaded, blue/gray/orange stacked bar
- Compact odds: 1/X/2 format for upcoming fixtures

**Card surface:** `rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/[0.08]`

### 4.3 LeagueTable

Full standings table with extensive data columns.

**Desktop columns:** #, Team, P, W, D, L, GF, GA, GD, Pts, Form, Position Change, Trend (sparkline)
**Mobile columns:** #, Team, P, GD, Pts + expand indicator

**Key patterns:**
- Zone colors indicated via left border on position number (Champions League blue, Europa League orange, etc.)
- Zone legend at bottom
- FLIP-animated row reordering via Motion library (`layout="position"`)
- Animated number transitions via NumberFlow
- Sparklines in trend column via Recharts

**Table surface:** `rounded-lg bg-white/5 backdrop-blur-sm`, with `border-b border-white/10` header, `divide-y divide-white/5` rows

### 4.4 ScoreHero

The centered hero section on match detail pages.

**Structure:**
- Card: `rounded-xl bg-gradient-to-b from-white/10 to-white/5 p-6`
- Top line: matchweek + venue, `text-xs text-white/50`, centered
- Center: `[homeLogo + name] -- [score or time] -- [awayLogo + name]`
  - Logos: 48x48
  - Score: `text-3xl font-bold tabular-nums text-white`
  - Kickoff: `text-lg font-semibold text-white/80`
- Bottom: formatted match date, `text-xs text-white/40`

### 4.5 TeamHero

The team identity section at the top of team detail pages.

**Structure:**
- Team logo: 80x80, `rounded-lg object-contain`
- Team name: `text-2xl font-bold text-white`
- Stadium name: `text-sm text-white/60`
- League badge: `rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/70`
- Callout numbers: `text-3xl font-extrabold text-white` with label below in `text-xs text-white/50`
- Form badges: colored dots with "Current Form" label

**Layout:** Mobile stacked, desktop side-by-side (`flex-col sm:flex-row`)

### 4.6 Header

Minimal site header with brand identity and navigation.

**Structure:**
- Full-width bar: `border-b border-white/10 bg-black/20 backdrop-blur-md`
- Left: Wordmark -- SVG football icon (circle with pentagon seam pattern, 28x28) + italic bold "KickLeague" (`text-lg font-extrabold italic tracking-tight`)
- Right: "Matches" nav link + LanguagePicker dropdown
- Container: `max-w-7xl mx-auto px-4 py-3`

---

## 5. Tech Stack Constraints

Any redesign proposals MUST work within these constraints:

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | RSC + client components, no Pages Router |
| React | **React 19** | Server components by default |
| Language | **TypeScript** | Strict mode |
| Styling | **Tailwind CSS 4** | CSS-first config via `@theme inline` in globals.css, NOT tailwind.config.js |
| Primitives | **Radix UI** | Tabs, dropdown menu -- accessible, unstyled |
| Animation | **Motion** (framer-motion) | FLIP animations, layout transitions, `layout="position"` |
| Numbers | **NumberFlow** | Animated number transitions in stats |
| Charts | **Recharts** | All chart components (BumpChart, CumulativePoints, CumulativeXg, GoalsByPeriod, HomeAwayBars) |
| i18n | **next-intl** | 5 locales (en, es, de, it, fr), translation keys in JSON files |
| URL state | **nuqs** | League selection persisted in URL query params |
| Class merging | **clsx** | Conditional class composition |
| ORM | **Drizzle** | PostgreSQL (Neon) -- not relevant to frontend redesign |

**DO NOT propose:**
- Switching to a different CSS framework (e.g., vanilla CSS, styled-components, CSS modules)
- Replacing Radix with another component library
- Switching from Recharts to a different charting library
- Adding new major dependencies without strong justification
- Removing TypeScript or next-intl

---

## 6. Design Philosophy -- The Soul of the Project

### Core Principle: "CoinMarketCap for football"

**Information density is the PRIMARY design value.** Every pixel should communicate data, not decoration. This is a premium data terminal for power users, not a casual sports blog.

### Non-negotiable values:

1. **Dark theme is permanent.** League gradient backgrounds look wrong on light backgrounds. The dark base (`#0a0a0f`) is foundational, not a preference toggle.

2. **League theming must remain.** The 5-color theme system with CSS custom properties and `data-theme` attributes is a core feature. Each league should feel distinct.

3. **Data over decoration.** If a design choice reduces the amount of visible data, it must be justified by a significant improvement in comprehension or usability.

4. **Glassmorphism creates depth.** The layered glass card system (background glow > card surface > inner content) creates visual hierarchy without visual noise.

5. **Animation serves comprehension.** Table row reordering (FLIP), number transitions (NumberFlow), and theme crossfades all help users understand data changes. Decorative animation is avoided.

6. **Mobile: compress, don't hide.** Expandable table rows beat pagination. Showing 5 essential columns beats showing 13 in a horizontal scroll. Data should be accessible, not removed.

### The feel we want:

Think of the aesthetic of: Bloomberg Terminal meets Dark Mode Figma meets Crypto trading dashboard. Premium. Dense. Precise. The kind of UI where a power user feels in control and can absorb information at a glance.

---

## 7. Areas for Design Enhancement

These are the specific areas where the current design is functional but could push further into "premium data terminal" territory. **Focus redesign efforts here.**

### 7.1 Homepage Visual Hierarchy

**Current state:** StatHighlights (3 hero cards) sit above the league table with a sticky tab bar between them. The transition from hero cards to the dense table feels abrupt.

**Opportunity:** Create a stronger visual bridge between the hero cards and the table. Consider subtle section dividers, a more dramatic stat card presentation, or spatial composition that guides the eye down the page.

### 7.2 Match Cards

**Current state:** Functional symmetric layout (team-score-team) with form badges, H2H bar, and optional odds. Works well but feels flat -- every card looks the same regardless of match significance.

**Opportunity:** Add visual personality. Derby matches, top-of-table clashes, or high-stakes relegation battles could feel different. Subtle visual cues for match importance without breaking the card grid layout.

### 7.3 League Tab Switcher

**Current state:** Radix tabs inside a `rounded-lg bg-white/10 p-1` container. Selected tab gets `bg-white/20`. Purely utilitarian.

**Opportunity:** This is the most-used control on the site. It could carry more brand identity -- perhaps league-specific styling on the selected tab, league logo integration, or a more distinctive interaction pattern.

### 7.4 Team Detail Hero

**Current state:** Logo + name + callout numbers laid out side-by-side. Clean but generic -- could be any team on any site.

**Opportunity:** Make it dramatic. The team hero is the moment to create impact -- the user has chosen to drill into a specific team. Consider background effects using the team's league colors, more impactful stat presentation, or a more distinctive composition.

### 7.5 Chart Components

**Current state:** Using default Recharts styling (grid lines, axis labels, tooltips). Functional but visually disconnected from the glassmorphism design system.

**Opportunity:** Style the charts to feel native to the dark glassmorphism theme. Custom tooltip designs, branded grid lines, accent-colored data series, glass-style chart containers. The charts should look like they belong on a Bloomberg terminal, not a default dashboard template.

### 7.6 Loading States

**Current state:** Generic pulse animations (`animate-pulse`) with `bg-white/10` or `bg-white/20` rectangles. Standard skeleton screens.

**Opportunity:** Branded loading states. Consider a shimmer effect that uses the league accent color, or skeleton shapes that more closely match the actual content layout. Loading should feel like part of the experience, not a placeholder.

### 7.7 Header / Brand Identity

**Current state:** Minimal bar with SVG football icon + italic bold "KickLeague" wordmark + Matches link + language picker. Serves its purpose but doesn't establish strong brand presence.

**Opportunity:** The header is the persistent brand touchpoint across all pages. It could carry more personality while remaining compact. Consider the wordmark treatment, the relationship between the header and the sticky league tabs, or subtle brand details.

### 7.8 Overall Visual Character

**Current state:** The design is clean, consistent, and highly functional. It reads as "professional dark dashboard" but doesn't yet have the distinctive character that makes it immediately recognizable.

**Opportunity:** Push toward "premium data terminal" with more intentional:
- **Micro-interactions:** Hover effects on data rows that reveal additional context
- **Typography refinement:** More deliberate use of the opacity scale, possibly introducing a display font for hero moments
- **Spatial composition:** More intentional use of negative space vs. density
- **Visual effects:** Subtle grain, more dramatic accent color usage, refined glass effects
- **Personality:** Something that makes KickLeague visually memorable -- a signature element or treatment that becomes "the KickLeague look"

---

## 8. Instructions for the Frontend-Design Skill

When using this brief with the `/frontend-design` skill:

1. **Propose specific component redesigns with working code** (Tailwind CSS + React/TypeScript). Show the exact classes, styles, and structure.

2. **Respect the tech stack.** All proposals must use Tailwind CSS 4, work with Next.js App Router components (both RSC and client), and integrate with the existing theme system.

3. **Work within the design system.** Proposals should enhance the existing glassmorphism/dark/accent-color system, not replace it. The `data-theme` attribute system, CSS custom properties, and opacity-based text colors are foundational.

4. **Maintain information density.** Never sacrifice data visibility for aesthetics. If anything, proposals should find ways to show MORE useful data in the same space.

5. **DO NOT propose structural/architectural changes.** Only visual/aesthetic enhancements. The page layouts, component hierarchy, data flow, and routing are not in scope.

6. **Show before/after.** For each component redesign, describe what changes and why it improves the experience.

7. **Be specific about league theming.** Show how proposals look across different league themes (especially Premier League with its distinctive purple/neon-green, and Ligue 1 with navy/neon-yellow). The design must look intentional across all 5 color palettes.
