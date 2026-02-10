---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/standings/queries.ts
  - src/messages/en.json
  - src/messages/de.json
  - src/messages/fr.json
  - src/messages/it.json
  - src/messages/es.json
  - src/components/league-table/LeagueTable.tsx
  - src/components/league-table/LeagueTableClient.tsx
  - src/components/league-table/ExpandedRowDetail.tsx
autonomous: true
must_haves:
  truths:
    - "Position change column queries the actual previous matchweek with data, not hardcoded currentMatchweek - 1"
    - "When only one matchweek exists, position change shows dash (no comparison possible)"
    - "Column header clearly indicates position movement, not goal difference"
  artifacts:
    - path: "src/lib/standings/queries.ts"
      provides: "Fixed getPositionChanges that finds actual previous matchweek"
      contains: "ORDER BY matchweek DESC"
    - path: "src/messages/en.json"
      provides: "Clear column header label"
  key_links:
    - from: "src/lib/standings/queries.ts"
      to: "standings table"
      via: "query for max matchweek < current"
      pattern: "lte.*matchweek.*currentMatchweek"
---

<objective>
Fix the league table position change column: (1) query the actual previous matchweek with data instead of assuming currentMatchweek - 1, and (2) rename the ambiguous "+/-" column header to a clear position-movement label with tooltip.

Purpose: The column currently shows "-" for all teams because the seed only stores one matchweek snapshot, and `getPositionChanges` hardcodes `currentMatchweek - 1` which has no data. The "+/-" header is also confusable with goal difference.
Output: Working position change query + clear column labeling across all 5 locales.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
@/Users/oliverhovey/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/standings/queries.ts
@src/components/league-table/PositionChange.tsx
@src/components/league-table/LeagueTable.tsx
@src/components/league-table/LeagueTableClient.tsx
@src/components/league-table/ExpandedRowDetail.tsx
@src/messages/en.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix getPositionChanges to find actual previous matchweek</name>
  <files>src/lib/standings/queries.ts</files>
  <action>
In `src/lib/standings/queries.ts`, rewrite the `getPositionChanges` function (lines 191-245) to find the actual previous matchweek that has data, rather than hardcoding `currentMatchweek - 1`.

Replace the "Get previous matchweek positions" query (lines 218-230) with a two-step approach:

1. First, find the highest matchweek LESS THAN `currentMatchweek` that has standings data for this league/season. Use a query like:
```sql
SELECT MAX(matchweek) FROM standings
WHERE leagueId = ? AND season = ? AND matchweek < currentMatchweek
```
In Drizzle:
```ts
const prevResult = await getDb()
  .select({ maxWeek: max(standings.matchweek) })
  .from(standings)
  .where(
    and(
      eq(standings.leagueId, leagueId),
      eq(standings.season, season),
      lte(standings.matchweek, currentMatchweek - 1)
    )
  );
const previousMatchweek = prevResult[0]?.maxWeek;
```

2. If `previousMatchweek` is null (no earlier matchweek exists), return the empty map immediately (same as the `currentMatchweek <= 1` early return).

3. If `previousMatchweek` exists, query positions for that matchweek (replacing the hardcoded `currentMatchweek - 1`).

Also remove the `currentMatchweek <= 1` early return guard since the "find max matchweek < current" approach handles that case naturally (it will return null when there's no earlier data).

Import `lte` if not already imported (it IS already imported on line 2 -- confirm it's in the destructured imports from drizzle-orm).
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors. Review the function to confirm it queries for actual previous matchweek, not `currentMatchweek - 1`.</verify>
  <done>getPositionChanges finds the real previous matchweek with data. When only one matchweek exists, returns empty map (all teams show "-"). When matchweeks are non-consecutive (e.g., 18 and 20 but not 19), still works correctly.</done>
</task>

<task type="auto">
  <name>Task 2: Rename column header and add tooltip across all locales</name>
  <files>
    src/messages/en.json
    src/messages/de.json
    src/messages/fr.json
    src/messages/it.json
    src/messages/es.json
    src/components/league-table/LeagueTable.tsx
    src/components/league-table/LeagueTableClient.tsx
    src/components/league-table/ExpandedRowDetail.tsx
  </files>
  <action>
**1. Update all 5 locale files** -- change the `positionChange` value in the `LeagueTable` section AND add a new `positionChangeTooltip` key:

- `en.json`: `"positionChange": "Mov"`, `"positionChangeTooltip": "Position change from previous matchweek"`
- `de.json`: `"positionChange": "Mov"`, `"positionChangeTooltip": "Positionswechsel seit letztem Spieltag"`
- `fr.json`: `"positionChange": "Mov"`, `"positionChangeTooltip": "Changement de position depuis la derniere journee"`
- `it.json`: `"positionChange": "Mov"`, `"positionChangeTooltip": "Variazione di posizione dalla giornata precedente"`
- `es.json`: `"positionChange": "Mov"`, `"positionChangeTooltip": "Cambio de posicion desde la jornada anterior"`

Use "Mov" (short for "movement") in all locales -- it's a universally understood abbreviation in football contexts and keeps the column narrow.

**2. Update `LeagueTable.tsx`** (server component, line 82) -- add a `title` attribute to the `<th>` for the positionChange column:
```tsx
<th className="hidden py-3 px-2 text-center font-medium md:table-cell" title={t('positionChangeTooltip')}>{t('positionChange')}</th>
```

**3. Update `LeagueTableClient.tsx`** (client component, line 201) -- add a `title` attribute to the `<div role="columnheader">` for the positionChange column:
```tsx
<div role="columnheader" className="hidden py-3 px-2 text-center font-medium md:block" title={t('positionChangeTooltip')}>{t('positionChange')}</div>
```

**4. Update `ExpandedRowDetail.tsx`** (line 44) -- the mobile expanded row also shows `{t('positionChange')}` as a label. This is fine since "Mov" is clear enough in context with the arrow indicators below it. No structural change needed here, it will pick up the new translation automatically.
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors. Visually check that all 5 locale JSON files have valid JSON (no trailing commas, proper quoting). Confirm the tooltip attribute is present on both the `<th>` in LeagueTable.tsx and the `<div>` in LeagueTableClient.tsx.</verify>
  <done>All 5 locales show "Mov" instead of "+/-" for the position change column header. Hovering over the column header shows a tooltip explaining the column's meaning. Mobile expanded row label also shows "Mov".</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` completes without errors
3. In browser: league table column header shows "Mov" (not "+/-")
4. In browser: hovering "Mov" header shows tooltip "Position change from previous matchweek"
5. Position change still shows "-" for all teams when only one matchweek of data exists (correct behavior -- no comparison available)
</verification>

<success_criteria>
- getPositionChanges queries actual previous matchweek, not hardcoded currentMatchweek - 1
- Column header reads "Mov" in all 5 locales with tooltip explaining meaning
- No TypeScript or build errors
- When multiple matchweeks eventually exist, position changes will compute correctly even with non-consecutive matchweek numbers
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-league-table-column-showing-blanks-a/2-SUMMARY.md`
</output>
