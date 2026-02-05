# FootballPulse — MVP Product Specification

**Version:** 1.0  
**Date:** February 2026  
**Author:** Product Team

---

## Executive Summary

FootballPulse is a modern football league table and statistics platform inspired by CoinMarketCap's information-dense dashboard aesthetic. The platform provides real-time league standings, match data, historical trends, and betting odds for Europe's top 5 leagues, with automated social media content generation for organic growth.

**Core differentiators:**
- CoinMarketCap-style visual density with sparklines and trend indicators
- Interactive season timeline with historical table states
- Full-page theming per league (colours, branding)
- Mobile-first responsive design
- Automated AI-powered social media presence

---

## Table of Contents

1. [Supported Leagues](#1-supported-leagues)
2. [Site Architecture](#2-site-architecture)
3. [Page Specifications](#3-page-specifications)
4. [Data Models](#4-data-models)
5. [Team Detail Page — Stats](#5-team-detail-page--stats)
6. [Match Detail Pages](#6-match-detail-pages)
7. [Interactive Season Timeline](#7-interactive-season-timeline)
8. [League Theming System](#8-league-theming-system)
9. [Localisation](#9-localisation)
10. [Data Pipeline Architecture](#10-data-pipeline-architecture)
11. [Caching Strategy](#11-caching-strategy)
12. [Betting/Odds Integration](#12-bettingodds-integration)
13. [Social Media Automation](#13-social-media-automation)
14. [Technical Stack](#14-technical-stack)
15. [API Providers](#15-api-providers)
16. [Monetisation Strategy](#16-monetisation-strategy)
17. [MVP Feature Prioritisation](#17-mvp-feature-prioritisation)

---

## 1. Supported Leagues

### MVP Launch Leagues

| League | Country | Teams | Season | Tiebreaker Priority |
|--------|---------|-------|--------|---------------------|
| Premier League | England | 20 | Aug–May | GD → GF → H2H |
| La Liga | Spain | 20 | Aug–May | H2H → GD → GF |
| Bundesliga | Germany | 18 | Aug–May | GD → GF → H2H |
| Serie A | Italy | 20 | Aug–May | H2H → GD → GF |
| Ligue 1 | France | 18 | Aug–May | GD → GF → H2H |

### League Zone Configuration

Each league has specific qualification/relegation zones:

**Premier League:**
- Positions 1–4: Champions League (green)
- Position 5: Europa League (blue)
- Position 6: Conference League (light blue)
- Positions 18–20: Relegation (red)

**La Liga:**
- Positions 1–4: Champions League
- Position 5: Europa League
- Position 6: Conference League
- Positions 18–20: Relegation

**Bundesliga:**
- Positions 1–4: Champions League
- Position 5: Europa League
- Position 6: Conference League
- Position 16: Relegation playoff (amber)
- Positions 17–18: Relegation

**Serie A:**
- Positions 1–4: Champions League
- Position 5: Europa League
- Position 6: Conference League
- Positions 18–20: Relegation

**Ligue 1:**
- Positions 1–3: Champions League
- Position 4: Champions League qualifying
- Position 5: Europa League
- Positions 16: Relegation playoff
- Positions 17–18: Relegation

---

## 2. Site Architecture

### URL Structure

```
/                           → Default league (Premier League) or last selected
/[league-slug]              → League home (e.g., /premier-league, /la-liga)
/[league-slug]/team/[team-slug]    → Team detail page
/[league-slug]/match/[match-id]    → Match detail page
/[league-slug]/history/[matchweek] → Historical table at specific point
/settings                   → User preferences (language, default league)
```

### Global State

```typescript
interface GlobalState {
  currentLeague: LeagueSlug;
  language: SupportedLanguage;
  theme: LeagueTheme;  // Derived from currentLeague
}
```

League selection persists across navigation via localStorage and URL.

---

## 3. Page Specifications

### 3.1 League Home Page

The primary view containing three expandable table sections.

#### Layout (Mobile-First)

```
┌─────────────────────────────────────┐
│  Logo    [League Tabs]    [Lang 🌐] │
├─────────────────────────────────────┤
│  Season Timeline Bar (interactive)  │
├─────────────────────────────────────┤
│                                     │
│     LEAGUE TABLE (expandable)       │
│     - All teams with stats          │
│     - Trend indicators              │
│     - Position sparklines           │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   RECENT MATCHES (expandable)       │
│     - Last 10 matches               │
│     - Scores, key events            │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   UPCOMING MATCHES (expandable)     │
│     - Next 10 fixtures              │
│     - Odds, H2H preview             │
│                                     │
└─────────────────────────────────────┘
```

#### Expandable Table Behaviour

Each table section has three states:
1. **Collapsed** — Shows header + 5 rows
2. **Default** — Shows header + 10 rows
3. **Expanded** — Full height, covers entire viewport below header

**Animation:** CSS transform with 300ms ease-out transition. When expanding, other sections animate to minimised state.

### 3.2 League Table Component

#### Columns (Desktop)

| Column | Description | Width |
|--------|-------------|-------|
| # | Position with zone colour | 40px |
| Δ | Position change indicator | 40px |
| Team | Logo + Name (clickable) | flex |
| P | Played | 40px |
| W | Won | 40px |
| D | Drawn | 40px |
| L | Lost | 40px |
| GF | Goals For | 40px |
| GA | Goals Against | 40px |
| GD | Goal Difference | 50px |
| Pts | Points | 50px |
| Form | Last 5 results (WDLWW) | 100px |
| Trend | Sparkline (position over season) | 80px |

#### Columns (Mobile — Condensed)

| Column | Description |
|--------|-------------|
| # | Position with zone colour |
| Team | Logo + abbreviated name |
| P | Played |
| GD | Goal Difference |
| Pts | Points |
| Trend | Sparkline |

Form column accessible via row expansion on tap.

#### Position Change Indicator (Δ)

```
▲ +3  (green, moved up 3 since last match)
▼ -1  (red, moved down 1)
─     (grey, unchanged)
```

Show three granularities on hover/tap:
- Since last match
- Since 3 matches ago
- Since same point last season

#### Form Display

Visual dots with colour coding:
- Green circle: Win
- Grey circle: Draw  
- Red circle: Loss

On hover: Show opponent and score for each match.

#### Sparkline

Mini line chart showing position (inverted Y-axis, so 1st is at top) over the season. 
- X-axis: Matchweeks
- Y-axis: Position (1 at top, 20 at bottom)
- Colour: League accent colour

### 3.3 Recent Matches Table

#### Columns

| Column | Description |
|--------|-------------|
| Date | Match date, relative if < 7 days |
| Home | Team logo + name |
| Score | Final score (clickable to match page) |
| Away | Team logo + name |
| Key Event | Most significant event (hat-trick, red card, late winner) |

#### Row Detail (on click/tap)

Expands to show:
- H2H summary: "Arsenal lead 8-5-3 in last 16 meetings"
- Trend: "Home team has won 4 of last 5 at this venue"
- Link to full match page

### 3.4 Upcoming Matches Table

#### Columns

| Column | Description |
|--------|-------------|
| Date/Time | Kickoff time in user's timezone |
| Home | Team logo + name |
| vs | Separator |
| Away | Team logo + name |
| Odds | Best odds display with affiliate links |
| H2H | Quick stat (e.g., "H: 5 D: 3 A: 2") |

#### Odds Display

Show odds from primary affiliate in decimal format:
```
Home: 2.10  |  Draw: 3.40  |  Away: 3.80
        [Bet365 logo]
```

Multiple bookmaker comparison available on row expansion.

---

## 4. Data Models

### 4.1 Core Entities

```typescript
// League
interface League {
  id: string;
  slug: string;  // e.g., "premier-league"
  name: string;
  country: string;
  teamCount: number;
  currentSeason: string;  // e.g., "2025-26"
  tiebreakers: TiebreakerOrder[];
  zones: ZoneConfig[];
  theme: LeagueTheme;
}

// Team
interface Team {
  id: string;
  slug: string;
  name: string;
  shortName: string;  // For mobile
  abbreviation: string;  // 3-letter
  logo: string;  // URL
  leagueId: string;
  stadiumName: string;
  founded: number;
}

// Standing (calculated/cached)
interface Standing {
  teamId: string;
  leagueId: string;
  season: string;
  matchweek: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: MatchResult[];  // Last 5
  positionHistory: number[];  // Position at each matchweek
  pointsAdjustment: number;  // For deductions
  homeRecord: { w: number; d: number; l: number; gf: number; ga: number };
  awayRecord: { w: number; d: number; l: number; gf: number; ga: number };
  lastUpdated: Date;
}

// Match
interface Match {
  id: string;
  leagueId: string;
  season: string;
  matchweek: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: Date;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  homeScore: number | null;
  awayScore: number | null;
  events: MatchEvent[];
  stats: MatchStats | null;
  odds: MatchOdds | null;
}

// Match Event
interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'own_goal' | 'penalty' | 'missed_penalty' | 'yellow' | 'red' | 'substitution';
  minute: number;
  addedTime?: number;
  playerId: string;
  teamId: string;
  assistPlayerId?: string;
}

// Match Stats
interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  xG?: { home: number; away: number };
}

// Head to Head
interface HeadToHead {
  team1Id: string;
  team2Id: string;
  lastMeetings: Match[];  // Last 5
  allTime: {
    team1Wins: number;
    draws: number;
    team2Wins: number;
    team1Goals: number;
    team2Goals: number;
  };
  atVenue: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
}
```

### 4.2 Historical Data

```typescript
// Snapshot of table at specific matchweek
interface TableSnapshot {
  leagueId: string;
  season: string;
  matchweek: number;
  standings: Standing[];
  capturedAt: Date;
}

// Previous season comparison
interface SeasonComparison {
  teamId: string;
  currentSeason: {
    matchweek: number;
    position: number;
    points: number;
  };
  previousSeason: {
    matchweek: number;  // Same matchweek
    position: number;
    points: number;
    finalPosition: number;
  };
}
```

---

## 5. Team Detail Page — Stats

Based on research into what football fans actively seek, the team page prioritises:

### 5.1 Hero Section

```
┌─────────────────────────────────────┐
│  [Logo]  ARSENAL                    │
│          Premier League             │
│          Emirates Stadium           │
│                                     │
│  Position: 1st  |  Points: 56       │
│  Form: ● ● ● ○ ●                    │
└─────────────────────────────────────┘
```

### 5.2 Stats Sections (Tab Navigation)

#### Overview Tab
- **Season Summary:** P, W, D, L, GF, GA, GD, Pts
- **Position Chart:** Line graph of position over season
- **Points Chart:** Cumulative points over season vs last season overlay
- **Form Run:** Current streak (e.g., "Unbeaten in 8")

#### Performance Tab
- **Home vs Away Split:**
  - Table showing home record vs away record
  - Home PPG vs Away PPG
- **Goals by Period:**
  - Bar chart: Goals scored/conceded by 15-min intervals
  - Shows when team is most dangerous/vulnerable
- **xG Analysis (if available):**
  - xG vs Actual Goals
  - xG table position vs actual position
  - xG trend over season
- **Clean Sheets:** Count and percentage
- **Scoring First:** Record when scoring first vs conceding first

#### Squad Tab
- **Top Scorers:** Player, goals, assists
- **Top Assisters:** Player, assists, key passes
- **Cards:** Yellow and red card counts
- **Minutes Distribution:** Who's playing most

#### Fixtures Tab
- **Upcoming Fixtures:** Next 5 with odds
- **Fixture Difficulty:** Visual indicator of remaining schedule strength
- **Recent Results:** Last 10 with expandable detail

#### Head-to-Head Tab (contextual)
When accessed from a match preview, shows H2H stats with the opponent.

### 5.3 Key Stats Cards (Always Visible)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ PPG      │ │ Goals/   │ │ Clean    │ │ xG Diff  │
│ 2.31     │ │ Match    │ │ Sheets   │ │ +8.4     │
│ (1st)    │ │ 2.4      │ │ 12       │ │ (1st)    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 5.4 Why These Stats?

Research indicates football fans want:

1. **Context over raw numbers** — PPG is more meaningful than total points when teams have games in hand
2. **Trend visualisation** — Sparklines and charts show trajectory, not just current state
3. **Comparative data** — "At this point last season" gives perspective
4. **Home/Away splits** — Critical for understanding true strength
5. **Goals by time period** — Fans want to know when their team scores/concedes
6. **xG metrics** — Growing mainstream adoption; shows underlying performance vs luck
7. **Fixture difficulty** — "Easy" or "hard" run-in affects expectations
8. **H2H history** — Essential context for any upcoming match

---

## 6. Match Detail Pages

### 6.1 Completed Match Page

```
┌─────────────────────────────────────┐
│         ARSENAL  3 - 2  MAN UTD     │
│         Premier League • MW 24      │
│         Emirates • 15 Feb 2026      │
├─────────────────────────────────────┤
│  Timeline:                          │
│  23' ⚽ Saka                        │
│  45' ⚽ Rashford                    │
│  67' ⚽ Saka                        │
│  89' ⚽ Rashford                    │
│  90+4' ⚽ MARTINELLI (Winner)       │
├─────────────────────────────────────┤
│  Stats                              │
│  Possession:     55% ━━━━━ 45%     │
│  Shots:          18 ━━━━━━━ 12     │
│  Shots on Target: 8 ━━━━━━ 5       │
│  xG:            2.4 ━━━━━━ 1.8     │
├─────────────────────────────────────┤
│  Head to Head                       │
│  Last 5: Arsenal 3 • Draws 1 • ...  │
└─────────────────────────────────────┘
```

**Elements:**
- Final score with team logos
- Match metadata (competition, date, venue)
- Event timeline (goals with scorers, cards)
- Match stats with visual bars
- xG (if available)
- H2H summary

### 6.2 Upcoming Match Page

```
┌─────────────────────────────────────┐
│         ARSENAL  vs  MAN UTD        │
│         Premier League • MW 25      │
│         Emirates • 22 Feb 2026      │
│         Kickoff: 15:00 GMT          │
├─────────────────────────────────────┤
│  Odds Comparison                    │
│  ┌────────┬────────┬────────┐       │
│  │ Home   │ Draw   │ Away   │       │
│  ├────────┼────────┼────────┤       │
│  │ Bet365 │ 2.10   │ 3.40   │ 3.80  │ [Bet]
│  │ Sky    │ 2.15   │ 3.30   │ 3.75  │ [Bet]
│  │ Unibet │ 2.05   │ 3.50   │ 3.90  │ [Bet]
│  └────────┴────────┴────────┴───────┘
├─────────────────────────────────────┤
│  Form Guide                         │
│  Arsenal: ● ● ● ○ ●  (4th, 56 pts) │
│  Man Utd: ○ ● ○ ● ○  (8th, 41 pts) │
├─────────────────────────────────────┤
│  Head to Head (Last 5)              │
│  Arsenal: 3 wins • Draws: 1 • ...   │
│  Last meeting: Arsenal 2-1 (H)      │
├─────────────────────────────────────┤
│  Key Stats                          │
│  Arsenal: 2.4 goals/game, 12 CS     │
│  Man Utd: 1.6 goals/game, 6 CS      │
└─────────────────────────────────────┘
```

**Elements:**
- Teams and match info
- Odds comparison table with multiple bookmakers (affiliate links)
- Current form for both teams
- League positions
- H2H last 5 meetings
- Key comparative stats
- Predicted lineups (if available from API)

---

## 7. Interactive Season Timeline

### Visual Design

```
◀ │●───●───●───●───●───●───○───○───○───○│ ▶
  MW1  MW5  MW10 MW15 MW20 MW24 MW25 ... MW38
                              ▲
                           Current
```

- Filled circles: Completed matchweeks
- Empty circles: Future matchweeks
- Current position highlighted
- Draggable/tappable to any point

### Functionality

1. **Drag/tap to any matchweek** — Table updates to show standings at that point
2. **Hover shows matchweek info** — Date range, key results
3. **Visual indicator of current week**
4. **Smooth animation** on table updates when changing week

### Data Requirements

Store `TableSnapshot` for each completed matchweek to enable instant historical lookups.

---

## 8. League Theming System

### Theme Structure

```typescript
interface LeagueTheme {
  primary: string;      // Main brand colour
  secondary: string;    // Accent colour
  background: string;   // Page background
  surface: string;      // Card/table background
  text: string;         // Primary text
  textMuted: string;    // Secondary text
  gradient: string;     // Header gradient
  zones: {
    championsLeague: string;
    europaLeague: string;
    conferenceLeague: string;
    playoff: string;
    relegation: string;
  };
}
```

### League Themes

| League | Primary | Secondary | Background |
|--------|---------|-----------|------------|
| Premier League | #3D195B | #00FF85 | #1a0a2e |
| La Liga | #EE8707 | #FFFFFF | #1a1a1a |
| Bundesliga | #D20515 | #FFFFFF | #1a0000 |
| Serie A | #024494 | #009246 | #001428 |
| Ligue 1 | #091C3E | #DAFF00 | #060d1a |

### Transition Animation

When switching leagues:
1. Current theme fades out (200ms)
2. New theme fades in (200ms)
3. Content refreshes during transition

CSS custom properties enable instant theme switching:

```css
:root {
  --color-primary: var(--league-primary);
  --color-background: var(--league-background);
  /* etc */
}
```

---

## 9. Localisation

### Supported Languages

| Language | Code | Market |
|----------|------|--------|
| English | en | UK, US, Global |
| Spanish | es | Spain, Latin America |
| German | de | Germany, Austria |
| Italian | it | Italy |
| French | fr | France |

### Localised Content

- UI strings (navigation, labels, buttons)
- Date/time formats (DD/MM vs MM/DD, 24h vs 12h)
- Number formats (1.000 vs 1,000)
- Team names (where official translations exist)
- Competition names

### Implementation

Use i18n library (react-i18next) with namespaced JSON files:

```
/locales
  /en
    common.json
    teams.json
    matches.json
  /es
    common.json
    ...
```

### Language Detection

Priority:
1. User preference (stored)
2. Browser language
3. Geolocation (fallback)
4. English (default)

---

## 10. Data Pipeline Architecture

### Event Flow

```
┌─────────────────┐
│  Football API   │
│  (API-Football) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Polling Worker │────▶│  Event Detector │
│  (60s interval) │     │  (match ended?) │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐
          │  Match Complete │       │  No Change      │
          │  Event          │       │  (skip)         │
          └────────┬────────┘       └─────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Recalculation  │
          │  Job Queue      │
          └────────┬────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│ Update Database │ │ Invalidate      │
│ (standings,     │ │ Cache           │
│  snapshots)     │ │ (Redis)         │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
          ┌─────────────────┐
          │ Push to Clients │
          │ (WebSocket/SSE) │
          └─────────────────┘
```

### Match Completion Detection

```typescript
interface MatchCompletionChecker {
  // Poll running matches every 60 seconds
  // Detect status change to 'FT' (full time)
  // Debounce: If multiple matches end within 2 minutes, batch updates
}
```

**Edge cases to handle:**
- Extra time / penalties (cup matches — not MVP but architect for it)
- Abandoned matches (mark as such, don't include in calculations)
- Postponed matches (update fixture list)
- Score corrections (rare but possible)

### Recalculation Job

On match completion:

1. **Update match record** with final score and events
2. **Recalculate affected team standings:**
   - Increment played, update W/D/L
   - Update GF, GA, GD
   - Calculate new points
   - Update form array
3. **Sort league table** with correct tiebreakers
4. **Calculate position changes** vs previous state
5. **Store table snapshot** for this matchweek
6. **Update season comparison** data
7. **Invalidate cache** for:
   - League table
   - Both team detail pages
   - Recent matches
8. **Trigger social post** if newsworthy (see Section 13)

### Scheduled Jobs

| Job | Frequency | Purpose |
|-----|-----------|---------|
| Live match poll | 60s | Detect match completions |
| Fixture sync | 6 hours | Update upcoming fixtures |
| Odds refresh | 15 mins | Update betting odds |
| Full resync | Daily 4am | Catch any missed updates |
| Snapshot backup | Daily | Archive table states |

---

## 11. Caching Strategy

### Cache Layers

```
User Request
     │
     ▼
┌─────────────────┐
│  CDN Edge Cache │  (Vercel Edge)
│  TTL: 60s       │
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│  Redis Cache    │  (Upstash)
│  TTL: varies    │
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│  Database       │  (Planetscale/Neon)
└─────────────────┘
```

### Cache Keys and TTLs

| Key Pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `league:{slug}:table` | 30 min | On match complete |
| `league:{slug}:recent` | 30 min | On match complete |
| `league:{slug}:upcoming` | 1 hour | On fixture sync |
| `team:{id}:detail` | 30 min | On team's match complete |
| `match:{id}:detail` | 24 hours | On match update |
| `odds:{matchId}` | 15 min | On odds refresh |
| `h2h:{team1}:{team2}` | 24 hours | On match between them |
| `snapshot:{league}:{mw}` | Forever | Never (historical) |

### Cache Warming

Pre-compute and cache on every update:
- Full serialised table JSON per league
- Derived stats (PPG, form strings, position deltas)
- Sparkline data points

### Write-Through Pattern

```typescript
async function onMatchComplete(match: Match) {
  // 1. Update database
  await db.matches.update(match);
  await recalculateStandings(match.leagueId);
  
  // 2. Write new cache immediately
  const table = await getFullTable(match.leagueId);
  await redis.set(`league:${match.leagueSlug}:table`, JSON.stringify(table), 'EX', 1800);
  
  // 3. Broadcast to connected clients
  await broadcast(match.leagueId, { type: 'TABLE_UPDATE', data: table });
}
```

---

## 12. Betting/Odds Integration

### Odds API Selection

**Recommended for MVP:** The Odds API
- Free tier: 500 requests/month
- Paid: From $25/month for 20,000 requests
- Coverage: All Big 5 leagues, major bookmakers
- Simple integration, JSON format

**Alternative:** API-Football (already used for match data, includes odds)

### Supported Bookmakers

| Bookmaker | Region | Affiliate Programme |
|-----------|--------|---------------------|
| Bet365 | UK/EU | Yes |
| Sky Bet | UK | Yes |
| William Hill | UK | Yes |
| Unibet | EU | Yes |
| Betway | UK/EU | Yes |
| 888sport | UK/EU | Yes |
| DraftKings | US | Yes |
| FanDuel | US | Yes |
| BetMGM | US | Yes |

### Odds Display

Show odds in user's preferred format:
- Decimal (2.50) — Default for EU
- Fractional (3/2) — UK traditional
- American (+150) — US

### Affiliate Link Structure

```typescript
interface AffiliateLink {
  bookmaker: string;
  baseUrl: string;
  affiliateId: string;
  deepLinkTemplate: string;  // For direct bet links
}

// Example deep link
`https://www.bet365.com/dl/sportsbookredirect?affiliate=${affiliateId}&bet=${matchId}&market=1x2`
```

### Odds Refresh Strategy

- Pre-match: Every 15 minutes
- Day of match: Every 5 minutes
- Live (future feature): Every 30 seconds

---

## 13. Social Media Automation

### Architecture

```
Match Complete Event
        │
        ▼
┌─────────────────┐
│ Newsworthiness  │
│ Scorer          │
└────────┬────────┘
         │
         ▼ (score > threshold)
┌─────────────────┐
│ Content         │
│ Generator (LLM) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ X Post │ │ IG/FB  │
│ Queue  │ │ Queue  │
└────────┘ └────────┘
```

### Newsworthiness Scoring

```typescript
function calculateNewsworthinessScore(match: Match): number {
  let score = 0;
  
  // High-scoring match
  const totalGoals = match.homeScore + match.awayScore;
  if (totalGoals >= 6) score += 30;
  else if (totalGoals >= 4) score += 15;
  
  // Comeback (team won after being 2+ down)
  if (detectComeback(match)) score += 25;
  
  // Late winner (85+ minute)
  if (detectLateWinner(match)) score += 20;
  
  // Late equaliser (85+ minute)
  if (detectLateEqualiser(match)) score += 15;
  
  // Upset (position difference > 10)
  if (detectUpset(match)) score += 20;
  
  // Derby/rivalry
  if (isDerby(match)) score += 15;
  
  // Hat-trick
  if (detectHatTrick(match)) score += 20;
  
  // Red card drama
  if (match.events.filter(e => e.type === 'red').length >= 2) score += 10;
  
  // Title/relegation implications
  if (affectsTableTop(match) || affectsRelegation(match)) score += 15;
  
  // Clean sheet in big match
  if (isBigMatch(match) && isCleanSheet(match)) score += 10;
  
  // Streak extended/broken
  if (detectStreakEvent(match)) score += 10;
  
  return score;
}

const POSTING_THRESHOLD = 30;  // Adjust based on volume desired
```

### Content Generation

#### Prompt Template

```
You are a football social media manager. Generate engaging posts about match results.

Match data:
- Competition: {league}
- Home: {homeTeam} ({homePosition})
- Away: {awayTeam} ({awayPosition})  
- Score: {homeScore} - {awayScore}
- Key events: {events}
- Context: {context}

Generate:
1. X post (max 280 chars, punchy, 1-2 relevant emojis max)
2. Instagram caption (slightly longer, include hashtags)

Tone: Exciting but not over-the-top. Focus on the story/drama.
Never: Use excessive emojis, clichés like "scenes!", or AI-sounding phrases.
```

#### Example Output

**X:**
> Martinelli 90+4'. Arsenal snatch it at the death.
> 
> 3-2 winners. Top of the table. What a finish. 🔴

**Instagram:**
> Stoppage time drama at the Emirates. Martinelli with the winner in the 94th minute as Arsenal come from behind to beat Man United 3-2.
> 
> Gunners go top of the Premier League.
> 
> #Arsenal #PremierLeague #Martinelli #FootballPulse

### Posting Schedule

**Timing rules:**
- Post within 5-10 minutes of full time
- If multiple matches end within 3 minutes, stagger posts 2 minutes apart
- Maximum 6 posts per day to avoid spam perception
- No posts between 11pm-7am local time (queue for morning)

**Saturday 3pm handling:**
- Up to 10 matches may end within 15 minutes
- Rank by newsworthiness score
- Post top 4 matches
- Mention others in thread/follow-up

### Platform APIs

**X (Twitter):**
- API v2 Free tier: 1,500 posts/month
- Sufficient for ~50 posts/month
- Rate limit: 17 requests per 15 minutes

**Meta (Instagram/Facebook):**
- Graph API via Business account
- Requires Facebook Page linked to Instagram
- No strict posting limits but quality over quantity

### Image Generation (Phase 2)

Generate match result cards using Canvas/Sharp:
- Team logos
- Score
- Key scorer
- League branding

Increases engagement significantly over text-only posts.

---

## 14. Technical Stack

### Frontend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | Vercel-native, good DX |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Rapid development, theming |
| State | Zustand | Simple, performant |
| Data Fetching | TanStack Query | Caching, refetching |
| Charts | Recharts | Lightweight, React-native |
| Animations | Framer Motion | Smooth transitions |
| i18n | next-intl | Built for Next.js |

### Backend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| API | Next.js API Routes | Unified deployment |
| Database | Planetscale (MySQL) | Serverless, branching |
| Cache | Upstash Redis | Serverless, Vercel integration |
| Queue | Upstash QStash | Serverless job queue |
| Real-time | Upstash SSE | Simple push updates |

### Infrastructure

| Service | Provider | Cost Estimate |
|---------|----------|---------------|
| Hosting | Vercel (Pro) | $20/month |
| Database | Planetscale (Scaler) | $29/month |
| Cache | Upstash Redis (Pay-as-go) | ~$5/month |
| Queue | Upstash QStash | ~$5/month |
| Football API | API-Football | $0-50/month |
| Odds API | The Odds API | $25/month |
| LLM | OpenAI (GPT-4o-mini) | ~$10/month |
| Domain | Cloudflare | $10/year |

**Total estimated:** ~$100-150/month at launch

### Deployment

```
GitHub Push
     │
     ▼
┌─────────────────┐
│  Vercel Build   │
│  (Next.js)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Preview│ │ Prod   │
│ (PR)   │ │ (main) │
└────────┘ └────────┘
```

---

## 15. API Providers

### Primary Data: API-Football (RapidAPI)

**Endpoints needed:**

| Endpoint | Purpose | Call Frequency |
|----------|---------|----------------|
| /leagues | League metadata | Daily |
| /teams | Team info, logos | Daily |
| /standings | League tables | On match complete |
| /fixtures | Match schedule/results | 60s (live), 6h (upcoming) |
| /fixtures/events | Goals, cards | On match complete |
| /fixtures/statistics | Match stats | On match complete |
| /fixtures/headtohead | H2H data | On demand |
| /predictions | Predicted lineups | Day of match |

**Pricing:**
- Free: 100 requests/day
- Basic ($9.99): 7,500/month
- Pro ($49.99): 120,000/month

**Recommendation:** Start with Pro tier to have headroom.

### Odds Data: The Odds API

**Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| /sports | Available sports/leagues |
| /odds | Live odds by sport |
| /historical | Historical odds |

**Pricing:**
- Free: 500 requests/month
- $25: 20,000/month
- $75: 75,000/month

### Backup/Supplement: Football-Data.org

- Free tier: 10 calls/minute
- Good for validation/cross-reference
- Covers Big 5 leagues

---

## 16. Monetisation Strategy

### Revenue Streams (Priority Order)

#### 1. Betting Affiliates (Primary)

**Expected revenue:** £50-150 CPA per new customer

| Partner | CPA | Markets |
|---------|-----|---------|
| Bet365 | £80-100 | UK/EU |
| Sky Bet | £50-70 | UK |
| William Hill | £40-60 | UK/EU |
| DraftKings | $100-150 | US |
| FanDuel | $100-150 | US |
| BetMGM | $75-100 | US |

**Implementation:**
- Odds comparison widget with affiliate links
- "Best odds" highlighting
- Deep links to pre-filled bet slips
- Geo-targeted bookmaker display

**Projected:** 
- 50,000 monthly visitors
- 0.5% conversion to signup = 250 signups
- Average CPA £70 = £17,500/month potential

#### 2. Display Advertising (Secondary)

**Options:**
- Google AdSense: £1-3 CPM
- Mediavine (requires 50k sessions): £15-25 CPM
- Direct sponsorship: £500-2000/month

**Implementation:**
- Leaderboard ad above tables
- Rectangle ads in sidebar (desktop)
- In-feed ads between matches (mobile)

**Projected:**
- 50,000 visitors, 3 pageviews average = 150,000 impressions
- £10 CPM (blended) = £1,500/month

#### 3. Premium Features (Tertiary)

**Potential premium tier (£4.99/month):**
- Ad-free experience
- Advanced scenario modelling
- API access for personal projects
- Export data to CSV
- Custom alerts

**Projected:** 
- 1% conversion = 500 subscribers
- £2,500/month

#### 4. Data Licensing (Future)

- Embeddable widgets for blogs
- Derived metrics for podcasts/media
- White-label solutions

### Revenue Projection (Year 1)

| Month | Traffic | Affiliates | Ads | Premium | Total |
|-------|---------|------------|-----|---------|-------|
| 1-3 | 2,000 | £100 | £20 | £0 | £120 |
| 4-6 | 10,000 | £500 | £100 | £50 | £650 |
| 7-9 | 30,000 | £2,000 | £300 | £200 | £2,500 |
| 10-12 | 50,000 | £5,000 | £500 | £400 | £5,900 |

**Year 1 Total:** ~£25,000-30,000

---

## 17. MVP Feature Prioritisation

### Phase 1: Core Launch (Weeks 1-4)

**Must Have:**
- [ ] League table with basic stats (P, W, D, L, GF, GA, GD, Pts)
- [ ] Position change indicators (since last match)
- [ ] Form column (last 5 results)
- [ ] Recent matches table (10 matches)
- [ ] Upcoming matches table (10 fixtures)
- [ ] League switching (tab navigation)
- [ ] League theming (colour schemes)
- [ ] Mobile responsive layout
- [ ] Basic team detail page
- [ ] Match detail page (completed matches)

**Technical:**
- [ ] API integration (API-Football)
- [ ] Database schema and seeding
- [ ] Cache layer (Redis)
- [ ] Match completion detection
- [ ] Table recalculation on match end

### Phase 2: Enhancement (Weeks 5-8)

**Should Have:**
- [ ] Sparkline trend charts
- [ ] Position history (3 matches, season)
- [ ] H2H data on match pages
- [ ] Odds display (single bookmaker)
- [ ] Expandable table animations
- [ ] Localisation (5 languages)
- [ ] Interactive season timeline

**Technical:**
- [ ] Odds API integration
- [ ] Historical table snapshots
- [ ] Real-time updates (SSE)

### Phase 3: Monetisation (Weeks 9-12)

**Should Have:**
- [ ] Multi-bookmaker odds comparison
- [ ] Affiliate links with tracking
- [ ] Display advertising integration
- [ ] Social media automation
- [ ] Advanced team stats (xG, home/away splits)

**Technical:**
- [ ] Affiliate link management
- [ ] Social posting queue
- [ ] LLM integration for content
- [ ] Analytics/tracking

### Phase 4: Refinement (Post-Launch)

**Nice to Have:**
- [ ] Scenario modelling ("what if" calculator)
- [ ] User accounts and preferences
- [ ] Watchlist/favourites
- [ ] Push notifications
- [ ] Premium tier
- [ ] Additional leagues

---

## Appendix A: Database Schema

```sql
-- Leagues
CREATE TABLE leagues (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  team_count INT NOT NULL,
  current_season VARCHAR(10) NOT NULL,
  api_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  abbreviation VARCHAR(5) NOT NULL,
  logo_url VARCHAR(255),
  league_id VARCHAR(36) NOT NULL,
  stadium_name VARCHAR(100),
  api_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id)
);

-- Standings (current)
CREATE TABLE standings (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  league_id VARCHAR(36) NOT NULL,
  season VARCHAR(10) NOT NULL,
  matchweek INT NOT NULL,
  position INT NOT NULL,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  drawn INT DEFAULT 0,
  lost INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  goal_difference INT DEFAULT 0,
  points INT DEFAULT 0,
  points_adjustment INT DEFAULT 0,
  form JSON,
  position_history JSON,
  home_record JSON,
  away_record JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  UNIQUE KEY (team_id, league_id, season)
);

-- Table Snapshots (historical)
CREATE TABLE table_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  league_id VARCHAR(36) NOT NULL,
  season VARCHAR(10) NOT NULL,
  matchweek INT NOT NULL,
  standings JSON NOT NULL,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  UNIQUE KEY (league_id, season, matchweek)
);

-- Matches
CREATE TABLE matches (
  id VARCHAR(36) PRIMARY KEY,
  league_id VARCHAR(36) NOT NULL,
  season VARCHAR(10) NOT NULL,
  matchweek INT,
  home_team_id VARCHAR(36) NOT NULL,
  away_team_id VARCHAR(36) NOT NULL,
  kickoff TIMESTAMP NOT NULL,
  status ENUM('scheduled', 'live', 'finished', 'postponed', 'cancelled') DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  events JSON,
  stats JSON,
  api_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Odds
CREATE TABLE match_odds (
  id VARCHAR(36) PRIMARY KEY,
  match_id VARCHAR(36) NOT NULL,
  bookmaker VARCHAR(50) NOT NULL,
  market VARCHAR(20) NOT NULL,
  home_odds DECIMAL(5,2),
  draw_odds DECIMAL(5,2),
  away_odds DECIMAL(5,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id),
  UNIQUE KEY (match_id, bookmaker, market)
);

-- Social Posts
CREATE TABLE social_posts (
  id VARCHAR(36) PRIMARY KEY,
  match_id VARCHAR(36) NOT NULL,
  platform ENUM('twitter', 'instagram', 'facebook') NOT NULL,
  content TEXT NOT NULL,
  status ENUM('queued', 'posted', 'failed') DEFAULT 'queued',
  post_id VARCHAR(100),
  scheduled_at TIMESTAMP,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Indexes
CREATE INDEX idx_matches_kickoff ON matches(kickoff);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_standings_league_season ON standings(league_id, season);
CREATE INDEX idx_match_odds_match ON match_odds(match_id);
```

---

## Appendix B: API Response Examples

### League Table Response

```json
{
  "league": {
    "id": "premier-league",
    "name": "Premier League",
    "season": "2025-26",
    "matchweek": 24
  },
  "standings": [
    {
      "position": 1,
      "team": {
        "id": "arsenal",
        "name": "Arsenal",
        "logo": "https://...",
        "abbreviation": "ARS"
      },
      "played": 24,
      "won": 18,
      "drawn": 4,
      "lost": 2,
      "goalsFor": 56,
      "goalsAgainst": 22,
      "goalDifference": 34,
      "points": 58,
      "form": ["W", "W", "D", "W", "W"],
      "positionChange": {
        "lastMatch": 0,
        "last3Matches": 0,
        "lastSeason": 2
      },
      "positionHistory": [3, 2, 1, 1, 1, 2, 1, 1, 1, ...]
    },
    ...
  ],
  "updatedAt": "2026-02-15T17:45:00Z"
}
```

---

*End of specification document.*
