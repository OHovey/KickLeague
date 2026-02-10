---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/matches/MatchPreviewSection.tsx
autonomous: true
must_haves:
  truths:
    - "Each recent result row shows the match date (e.g. 'Sat 1 Feb') below the score line"
    - "Date is locale-aware via formatMatchDateShort"
    - "Recent Results card rows are taller, better balancing height with Upcoming Fixtures"
  artifacts:
    - path: "src/components/matches/MatchPreviewSection.tsx"
      provides: "CompactResultRow with date line"
      contains: "formatMatchDateShort"
  key_links:
    - from: "CompactResultRow"
      to: "formatMatchDateShort"
      via: "import and call with match.kickoff + locale"
      pattern: "formatMatchDateShort\\(match\\.kickoff"
---

<objective>
Add match date to each Recent Results row on the homepage and balance card heights with Upcoming Fixtures.

Purpose: Users want to know when matches took place, and the Recent Results card is much shorter than the Upcoming Fixtures card (which has odds/bookmaker rows). Adding a date line to each result row provides useful context and increases row height for better visual balance.

Output: Updated CompactResultRow component with a date subtitle line.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
@/Users/oliverhovey/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/matches/MatchPreviewSection.tsx
@src/lib/dates/format.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add date line to CompactResultRow</name>
  <files>src/components/matches/MatchPreviewSection.tsx</files>
  <action>
Three changes in `src/components/matches/MatchPreviewSection.tsx`:

1. **Add import** for `formatMatchDateShort` from `@/lib/dates/format` (line 6 already imports `formatKickoffTime` from there -- add `formatMatchDateShort` to the same import).

2. **Update CompactResultRow** (lines 40-74):
   - Change props from `{ match }` to `{ match, locale }` with types `{ match: MatchWithTeams; locale: string }`.
   - Change the Link's className from `"flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"` to `"block rounded-lg px-3 py-2 transition-colors hover:bg-white/5"` (use `block` like CompactFixtureRow does).
   - Wrap the existing teams + score flex row in a `<div className="flex items-center gap-2">` container.
   - Below that container, add a date line:
     ```tsx
     <p className="mt-1 text-center text-[11px] text-white/40" suppressHydrationWarning>
       {formatMatchDateShort(match.kickoff, locale)}
     </p>
     ```
   - Include `suppressHydrationWarning` because date formatting can differ between server and client timezones.

3. **Update the render call** (line 263) to pass `locale`:
   Change `<CompactResultRow key={match.id} match={match} />`
   to `<CompactResultRow key={match.id} match={match} locale={locale} />`
   (The `locale` variable is already available from `useLocale()` on line 4/201.)
  </action>
  <verify>
Run `npx tsc --noEmit` to confirm no type errors. Run `npm run build` to confirm the page builds. Visually: the Recent Results rows should each show a date like "Sat 1 Feb" centered below the score line.
  </verify>
  <done>
Every CompactResultRow displays a locale-aware date below the score. The rows are taller, better matching the height of CompactFixtureRow which includes odds. No type errors, build succeeds.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
- CompactResultRow renders date via `formatMatchDateShort(match.kickoff, locale)`
- Date text is styled `text-[11px] text-white/40` with `suppressHydrationWarning`
- Link uses `block` layout (not `flex`) matching CompactFixtureRow pattern
</verification>

<success_criteria>
Recent Results rows on the homepage show match dates and have increased height for better visual balance with the Upcoming Fixtures card.
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-date-to-recent-result-rows-and-balan/4-SUMMARY.md`
</output>
