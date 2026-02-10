---
phase: quick-5
type: execute
wave: 1
depends_on: []
files_modified: [src/components/matches/MatchPreviewSection.tsx]
autonomous: true
---

<objective>
Fix the match preview cards (Recent Results and Upcoming Fixtures) to have equal height with footers pinned to the bottom.

Purpose: After adding dates to recent result rows, the Recent Results card is now taller, causing the Upcoming Fixtures footer to float mid-card with empty space below.

Output: Both cards render at equal height with "View all" footers pinned to bottom.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Fix match preview card layout with flex column + footer pinning</name>
  <files>src/components/matches/MatchPreviewSection.tsx</files>
  <action>
In src/components/matches/MatchPreviewSection.tsx, update the match preview cards to use flexbox layout with pinned footers:

1. Line 252 (Recent Results card container): Add "flex flex-col" to existing className
   - Change: `"overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm"`
   - To: `"flex flex-col overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm"`

2. Line 258 (Recent Results content div): Add "flex-1" to existing className
   - Change: `"py-1"`
   - To: `"flex-1 py-1"`

3. Line 273 (Recent Results footer): Add "mt-auto" to existing className
   - Change: `"border-t border-white/5 px-4 py-2"`
   - To: `"mt-auto border-t border-white/5 px-4 py-2"`

4. Line 281 (Upcoming Fixtures card container): Add "flex flex-col" to existing className
   - Change: `"overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm"`
   - To: `"flex flex-col overflow-hidden rounded-lg bg-white/5 backdrop-blur-sm"`

5. Line 287 (Upcoming Fixtures content div): Add "flex-1" to existing className
   - Change: `"py-1"`
   - To: `"flex-1 py-1"`

6. Line 308 (Upcoming Fixtures footer): Add "mt-auto" to existing className
   - Change: `"border-t border-white/5 px-4 py-2"`
   - To: `"mt-auto border-t border-white/5 px-4 py-2"`

This is pure CSS layout — no component logic changes.
  </action>
  <verify>
npm run dev and navigate to homepage. Inspect the Recent Results and Upcoming Fixtures sections:
- Both cards should render with equal height (forced by parent grid)
- Both "View all" footers should be pinned to the bottom of their cards
- No empty space visible at the bottom of either card
- Content in shorter card should not have gaps
  </verify>
  <done>
Both match preview cards have equal height with footers pinned to bottom, matching the grid constraint without visual gaps.
  </done>
</task>

</tasks>

<verification>
Visual inspection on homepage: both match cards equal height, no whitespace under shorter card's footer.
</verification>

<success_criteria>
- Both match preview cards render at equal height
- "View all" footers are pinned to bottom of each card
- No visible empty space below either footer
- Layout remains responsive
</success_criteria>

<output>
After completion, create `.planning/quick/5-make-both-match-preview-cards-equal-heig/5-SUMMARY.md`
</output>
