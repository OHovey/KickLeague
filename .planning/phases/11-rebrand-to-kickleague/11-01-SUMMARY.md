---
phase: 11-rebrand-to-kickleague
plan: 01
subsystem: ui, infra
tags: [branding, metadata, next-metadata, title-template, rename]

# Dependency graph
requires: []
provides:
  - "All source files reference KickLeague (zero FootballPulse/KickData)"
  - "title.template metadata pattern in layout.tsx for automatic brand suffix"
  - "npm package name kickleague"
  - "All planning docs reference KickLeague"
affects:
  - "11-02 (brand assets)"
  - "11-03 (PWA manifest, OG image, header wordmark)"
  - "11-04 (infrastructure renames)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js title.template pattern: layout sets template '%s | KickLeague', child pages return bare titles"

key-files:
  created: []
  modified:
    - "src/app/[locale]/layout.tsx"
    - "src/app/[locale]/matches/[id]/page.tsx"
    - "src/app/[locale]/teams/[slug]/page.tsx"
    - "src/components/header/Header.tsx"
    - "src/messages/en.json"
    - "src/messages/es.json"
    - "src/messages/fr.json"
    - "src/messages/de.json"
    - "src/messages/it.json"
    - "src/lib/seed/index.ts"
    - "package.json"
    - "package-lock.json"
    - "30 .planning/ markdown files"

key-decisions:
  - "title.template pattern replaces hardcoded brand suffix in child page metadata"
  - "11-CONTEXT.md and 11-RESEARCH.md preserved as historical records (not renamed)"
  - "11-01-PLAN.md retains old brand names in task descriptions (meta-references to what was renamed)"

patterns-established:
  - "title.template: Child pages return bare title strings, layout appends ' | KickLeague' via template"

# Metrics
duration: 12min
completed: 2026-02-07
---

# Phase 11 Plan 01: Text Rename Summary

**Full codebase rebrand from KickData/FootballPulse to KickLeague with Next.js title.template metadata upgrade**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-07
- **Completed:** 2026-02-07
- **Tasks:** 2/2
- **Files modified:** 42 (12 source + 30 planning docs)

## Accomplishments
- Eliminated all KickData and FootballPulse references from source code and planning docs
- Upgraded metadata architecture from flat title strings to Next.js title.template pattern
- Child pages (matches, teams) no longer hardcode brand suffix -- layout template auto-appends " | KickLeague"
- npm package name updated from kickdata to kickleague
- 30 planning docs updated to reference KickLeague consistently

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename KickData to KickLeague in source files + upgrade title metadata** - `b618a71` (feat)
2. **Task 2: Rename FootballPulse and KickData to KickLeague in planning docs** - `8cc2194` (feat)

## Files Created/Modified

### Source files (Task 1)
- `src/app/[locale]/layout.tsx` - Upgraded to title.template pattern with KickLeague branding
- `src/app/[locale]/matches/[id]/page.tsx` - Removed 5 hardcoded "| KickData" suffixes
- `src/app/[locale]/teams/[slug]/page.tsx` - Removed 3 hardcoded "| KickData" suffixes
- `src/components/header/Header.tsx` - Changed "KickData" text to "KickLeague"
- `src/messages/{en,es,fr,de,it}.json` - Changed appName from "KickData" to "KickLeague"
- `src/lib/seed/index.ts` - Updated CLI description and banner text
- `package.json` - Changed name from "kickdata" to "kickleague"
- `package-lock.json` - Regenerated via npm install

### Planning docs (Task 2)
- `.planning/PROJECT.md` - Project name and description
- `.planning/ROADMAP.md` - Roadmap header
- `.planning/REQUIREMENTS.md` - Requirement descriptions
- `.planning/MILESTONES.md` - Milestone references
- `.planning/milestones/v1-REQUIREMENTS.md` - Archived requirements title
- `.planning/milestones/v1-ROADMAP.md` - Archived roadmap
- `.planning/milestones/v1-MILESTONE-AUDIT.md` - Audit references
- `.planning/todos/pending/2026-02-06-rebrand-kickdata-to-kickleague.md` - Todo references
- `.planning/research/{SUMMARY,PITFALLS,ARCHITECTURE,STACK,FEATURES}.md` - Research docs
- `.planning/phases/01-data-foundation/{01-01-PLAN,01-03-PLAN,01-RESEARCH,01-USER-SETUP}.md`
- `.planning/phases/02-league-tables/02-03-PLAN.md`
- `.planning/phases/03-match-fixture-pages/{03-02-PLAN,03-03-PLAN,03-03-SUMMARY,03-VERIFICATION}.md`
- `.planning/phases/04-team-detail-pages/{04-01-PLAN,04-02-PLAN,04-RESEARCH}.md`
- `.planning/phases/06-live-data-pipeline/06-RESEARCH.md`
- `.planning/phases/07-betting-odds-localisation/07-RESEARCH.md`
- `.planning/phases/11-rebrand-to-kickleague/{11-01-PLAN,11-03-PLAN,11-04-PLAN}.md`

## Decisions Made
- **title.template pattern:** Upgraded from flat `title: 'KickData'` to `title: { template: '%s | KickLeague', default: 'KickLeague' }`. This means child pages just set a bare title and the brand suffix is auto-appended by Next.js.
- **Historical preservation:** 11-CONTEXT.md and 11-RESEARCH.md were intentionally excluded from renaming as they document the research/context gathering for this phase and serve as historical records.
- **Lowercase variants included:** Also replaced lowercase "footballpulse" in STACK.md (install commands, env vars), 01-USER-SETUP.md (Neon project name), and 01-01-PLAN.md (Neon task description).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Lowercase variant replacement in planning docs**
- **Found during:** Task 2 (planning docs rename)
- **Issue:** Plan mentioned lowercase "footballpulse" -> "kickleague" as a possibility. Found 4 occurrences in STACK.md (install command, database URL, base URL) and 2 more in 01-USER-SETUP.md and 01-01-PLAN.md.
- **Fix:** Replaced all lowercase variants: `footballpulse` -> `kickleague` in the 3 affected files
- **Files modified:** .planning/research/STACK.md, .planning/phases/01-data-foundation/01-USER-SETUP.md, .planning/phases/01-data-foundation/01-01-PLAN.md
- **Verification:** `grep -r "footballpulse" .planning/ | grep -v 11-CONTEXT | grep -v 11-RESEARCH | grep -v 11-01-PLAN` returns zero
- **Committed in:** 8cc2194 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Auto-fix ensured complete brand consistency including lowercase variants. No scope creep.

## Issues Encountered
None - plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All text references to KickLeague are in place
- Ready for Plan 02 (brand asset creation: wordmark SVG, favicon, PWA icons)
- Header currently shows "KickLeague" as plain text -- Plan 03 will replace with SVG wordmark
- title.template established so all future pages automatically get brand suffix

## Self-Check: PASSED

---
*Phase: 11-rebrand-to-kickleague*
*Completed: 2026-02-07*
