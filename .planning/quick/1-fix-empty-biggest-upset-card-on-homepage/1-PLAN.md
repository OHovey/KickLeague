---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/stats/queries.ts
  - src/components/stat-highlights/StatHighlights.tsx
  - src/components/stat-highlights/actions.ts
  - src/messages/en.json
  - src/messages/es.json
  - src/messages/fr.json
  - src/messages/it.json
  - src/messages/de.json
autonomous: true
must_haves:
  truths:
    - "Biggest upset card on homepage displays a real match result, not empty/no-data"
    - "Upset is identified using standings position data (not odds), which we reliably have"
    - "Card shows matchweek, score line, winner team logo, and context about the position gap"
  artifacts:
    - path: "src/lib/stats/queries.ts"
      provides: "getBiggestUpset query using standings position gap"
      exports: ["getBiggestUpset", "BiggestUpsetResult"]
    - path: "src/components/stat-highlights/StatHighlights.tsx"
      provides: "Updated upset card rendering with position-based context"
  key_links:
    - from: "src/lib/stats/queries.ts"
      to: "standings + fixtures tables"
      via: "position gap calculation"
      pattern: "standings.*position"
    - from: "src/components/stat-highlights/StatHighlights.tsx"
      to: "BiggestUpsetResult"
      via: "data.biggestUpset"
      pattern: "upset\\."
---

<objective>
Fix the empty "Biggest Upset" stat highlight card on the homepage.

Purpose: The card renders empty because `getBiggestUpset()` uses an INNER JOIN on the `fixture_odds` table, but odds are only seeded for upcoming/scheduled fixtures (via The Odds API), never for finished fixtures. The query filters for `status: 'finished'` AND requires odds data -- these conditions are mutually exclusive, so the join always returns 0 rows.

The fix replaces the odds-based upset detection with a standings-position-based approach. We have reliable standings data (position at each matchweek) for all leagues and seasons. "Biggest upset" = a lower-ranked team beating a higher-ranked team, with the largest position gap. This is equally fan-relatable (20th place beating 1st place is clearly an upset) and works with data we actually have.

Output: Working biggest upset card showing real match data on the homepage.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
@/Users/oliverhovey/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/stats/queries.ts
@src/components/stat-highlights/StatHighlights.tsx
@src/components/stat-highlights/actions.ts
@src/components/stat-highlights/StatCard.tsx
@src/db/schema/fixtures.ts
@src/db/schema/standings.ts
@src/messages/en.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite getBiggestUpset query to use standings position gap</name>
  <files>src/lib/stats/queries.ts</files>
  <action>
Replace the `getBiggestUpset` function in `src/lib/stats/queries.ts` with a standings-position-based approach. Remove the `fixtureOdds` import since it is no longer needed by any query in this file.

**Updated BiggestUpsetResult type:** Replace `winningOdds: number` with `positionGap: number` (the difference in league position between the two teams). Keep all other fields the same (fixtureId, homeTeamId, homeTeamName, homeTeamLogoUrl, awayTeamId, awayTeamName, awayTeamLogoUrl, homeScore, awayScore, matchweek).

**New query logic:**
1. Find finished fixtures (non-draw) for the given league+season
2. For each fixture, look up the standings positions of both teams at that fixture's matchweek (join standings twice -- once for home team, once for away team, matching on leagueId + season + matchweek + teamId)
3. Determine winner: if homeScore > awayScore then home won, else away won
4. Calculate position gap: `ABS(homePosition - awayPosition)` but only where the winner had a WORSE (higher number) position than the loser
5. Order by position gap DESC, limit 1
6. Enrich with team names/logos via the existing alias pattern (homeTeam/awayTeam aliases)

**SQL approach using Drizzle:**
- Use `alias(standings, 'home_standings')` and `alias(standings, 'away_standings')` for the two standings joins
- Join condition: `home_standings.teamId = fixtures.homeTeamId AND home_standings.leagueId = fixtures.leagueId AND home_standings.season = fixtures.season AND home_standings.matchweek = fixtures.matchweek`
- Same pattern for away_standings
- WHERE: fixtures.status = 'finished', homeScore != awayScore, fixtures.matchweek IS NOT NULL
- Add condition that the WINNER had a worse position (higher number): use a CASE expression
- Compute `position_gap` as: `CASE WHEN homeScore > awayScore THEN home_position - away_position ELSE away_position - home_position END`
- Only include rows where position_gap > 0 (winner was lower-ranked)
- ORDER BY position_gap DESC, LIMIT 1

**Important:** The `fixtureOdds` import at the top of the file should be removed entirely since no other function in this file uses it. Keep the `standings` import (already imported).
  </action>
  <verify>
Run `npx tsc --noEmit` to verify no type errors. Check that BiggestUpsetResult no longer has `winningOdds` and instead has `positionGap`.
  </verify>
  <done>
`getBiggestUpset` returns a result using standings position data instead of odds data. The `fixtureOdds` import is removed from queries.ts. TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update component and translations for position-based upset context</name>
  <files>
    src/components/stat-highlights/StatHighlights.tsx
    src/components/stat-highlights/actions.ts
    src/messages/en.json
    src/messages/es.json
    src/messages/fr.json
    src/messages/it.json
    src/messages/de.json
  </files>
  <action>
**1. Update StatHighlights.tsx (lines ~192-196):**

The `context` prop for the biggest upset card currently shows `t('winnerAtOdds', { odds: upset.winningOdds.toFixed(1) })`. Change this to use a new translation key that shows the position gap instead:

```tsx
context={
  upset
    ? t('positionGapContext', { gap: upset.positionGap })
    : undefined
}
```

No other changes needed in the component -- the score line, matchweek, team names, and winner logo logic all remain the same.

**2. Update actions.ts:**
No code changes needed -- the `BiggestUpsetResult` type is imported from queries.ts and the action just passes data through. But verify it still compiles since the type shape changed (winningOdds -> positionGap). The localization section (lines 79-83) that reads `biggestUpset.homeTeamId` and `biggestUpset.awayTeamId` remains unchanged.

**3. Update translation files -- replace `winnerAtOdds` key with `positionGapContext`:**

In each message file under the `"StatHighlights"` section:

- `en.json`: Remove `"winnerAtOdds": "Winner at {odds} odds"`, add `"positionGapContext": "{gap} places apart"`
- `es.json`: Remove `"winnerAtOdds": "Ganador a cuota de {odds}"`, add `"positionGapContext": "{gap} puestos de diferencia"`
- `fr.json`: Remove `"winnerAtOdds": "Vainqueur a la cote de {odds}"`, add `"positionGapContext": "{gap} places d\u0027\u00e9cart"`
- `it.json`: Remove `"winnerAtOdds": "Vincitore a quota {odds}"`, add `"positionGapContext": "{gap} posizioni di distacco"`
- `de.json`: Remove `"winnerAtOdds": "Sieger bei Quote {odds}"`, add `"positionGapContext": "{gap} Pl\u00e4tze Unterschied"`
  </action>
  <verify>
Run `npx tsc --noEmit` to verify no type errors across the full chain (queries -> actions -> component). Run `npm run build` to verify the app builds successfully. Then start the dev server with `npm run dev` and verify in the terminal that no runtime errors appear on the homepage route.
  </verify>
  <done>
The biggest upset card renders with position-based context ("{gap} places apart") instead of odds-based context. All 5 locale files updated. The full data flow compiles and builds without errors.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. The homepage loads without errors (no empty card, no "No data available" on the biggest upset card)
4. The biggest upset card shows: matchweek label, score line (e.g. "Wolves 2-1 Arsenal"), winner team logo, and position gap context (e.g. "14 places apart")
</verification>

<success_criteria>
- Biggest upset stat highlight card on the homepage shows real match data instead of being empty
- The upset metric uses standings position gap (reliable, always-available data) instead of fixture odds (not available for finished matches)
- All 5 locale translation files updated with the new context string
- No TypeScript errors, app builds and runs successfully
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-empty-biggest-upset-card-on-homepage/1-SUMMARY.md`
</output>
