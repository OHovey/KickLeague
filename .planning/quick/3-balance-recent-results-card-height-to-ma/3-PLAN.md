---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/matches/MatchPreviewSection.tsx
autonomous: true
must_haves:
  truths:
    - "Recent Results card height roughly matches Upcoming Fixtures card height in the homepage grid"
  artifacts:
    - path: "src/components/matches/MatchPreviewSection.tsx"
      provides: "Match preview with balanced card heights"
      contains: "fetchRecentMatches(league, 10)"
  key_links: []
---

<objective>
Balance the Recent Results card height to match the Upcoming Fixtures card on the homepage.

Purpose: The two side-by-side cards in the homepage grid have mismatched heights -- Recent Results shows 5 compact rows (~200px content) while Upcoming Fixtures shows 5 rows with odds (~600px content), leaving ugly whitespace in the results card.

Output: A single-line change increasing the recent results fetch limit from 5 to 10, filling the card with content that roughly matches the fixtures card height.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
@/Users/oliverhovey/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/matches/MatchPreviewSection.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Increase recent results limit from 5 to 10</name>
  <files>src/components/matches/MatchPreviewSection.tsx</files>
  <action>
    In `src/components/matches/MatchPreviewSection.tsx`, line 213, change the recent matches fetch limit from 5 to 10:

    Before: `fetchRecentMatches(league, 5),`
    After:  `fetchRecentMatches(league, 10),`

    This is the ONLY change needed. Do not modify the upcoming fixtures limit (keep at 5). Do not change any styling or layout. The grid's implicit row height alignment handles the rest -- 10 compact result rows (~40px each = ~400px) will better match 5 fixture rows with odds (~120px each = ~600px).
  </action>
  <verify>
    Run `npx tsc --noEmit` to confirm no type errors.
    Run `grep -n "fetchRecentMatches" src/components/matches/MatchPreviewSection.tsx` to confirm the limit is 10.
  </verify>
  <done>fetchRecentMatches is called with limit 10 instead of 5, balancing the visual height of both homepage cards.</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- The fetchRecentMatches call uses limit 10
- The fetchUpcomingFixtures call remains at limit 5 (unchanged)
</verification>

<success_criteria>
Recent Results card on the homepage displays 10 matches instead of 5, visually balancing its height against the Upcoming Fixtures card.
</success_criteria>

<output>
After completion, create `.planning/quick/3-balance-recent-results-card-height-to-ma/3-SUMMARY.md`
</output>
