---
phase: 13-i18n-completeness
plan: 06
subsystem: i18n
tags: [next-intl, translations, football-terminology, icu-plurals, unicode]

# Dependency graph
requires:
  - phase: 13-02
    provides: "Component i18n wiring with all en.json keys for league table, matches, odds"
  - phase: 13-03
    provides: "Match detail i18n wiring with ICU plural keys"
  - phase: 13-04
    provides: "Team detail, header, stat highlights i18n keys"
provides:
  - "Complete translations for ES, DE, IT, FR (229 keys each, matching EN)"
  - "Football-accurate terminology per locale"
  - "Fixed German ASCII umlaut approximations to proper Unicode"
affects: [14-seo, 15-display-ads]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ICU plural format for count-dependent strings across all locales"
    - "Football-domain terminology per locale (not generic translations)"

key-files:
  created: []
  modified:
    - src/messages/es.json
    - src/messages/de.json
    - src/messages/it.json
    - src/messages/fr.json

key-decisions:
  - "Preserved existing high-quality translations (83 keys per locale) and added 146 new keys"
  - "Used domain-specific football terminology: Torschuetzenkoenig (DE), Capocannoniere (IT), Maximo goleador (ES), Meilleur buteur (FR)"
  - "Fixed all ASCII umlaut approximations in German (Zurueck -> Zurueck with umlaut, Uebersicht -> Uebersicht with umlaut, etc.)"
  - "French clean sheets kept as-is (commonly used in French football press)"

patterns-established:
  - "All 5 locale files maintain identical key structure -- any future key additions must be added to all 5 files"

# Metrics
duration: 5min
completed: 2026-02-08
---

# Phase 13 Plan 06: Translation Completeness Summary

**Complete football-accurate translations for ES/DE/IT/FR with 229 keys each, ICU plural validation, and German umlaut corrections**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-08T08:12:44Z
- **Completed:** 2026-02-08T08:17:54Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- All 5 locale files now have identical key sets (229 keys each) -- requirement I18N-03 fully satisfied
- Football-specific terminology used throughout (not generic translations): Jornada/Spieltag/Giornata/Journee for Matchweek
- German file corrected from ASCII umlaut approximations to proper Unicode characters
- ICU plural syntax validated across all locales (basedOnMeetings, draws, wins)

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate Spanish and German translations** - `381c5db` (feat)
2. **Task 2: Generate Italian and French translations** - `3f29a87` (feat)

## Files Created/Modified
- `src/messages/es.json` - Complete Spanish translations (229 keys, football terminology)
- `src/messages/de.json` - Complete German translations (229 keys, proper Unicode umlauts)
- `src/messages/it.json` - Complete Italian translations (229 keys, Serie A terminology)
- `src/messages/fr.json` - Complete French translations (229 keys, Ligue 1 terminology)

## Decisions Made
- Preserved all 83 existing translations per locale file (no overwrites of quality content)
- Used football-domain terminology per locale rather than generic translations (e.g., CAPOCANNONIERE not "miglior marcatore" for top scorer in Italian)
- Fixed German ASCII umlaut approximations (ue->u-umlaut, oe->o-umlaut, ae->a-umlaut) in all existing translations
- Kept "clean sheets" in French as-is (commonly used in French football press, more recognizable than "matchs sans but encaisse")
- Used locale-appropriate abbreviations for stats columns (e.g., PJ/G/E/P in Spanish, Sp/S/U/N in German)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing accent marks in existing Spanish translations**
- **Found during:** Task 1
- **Issue:** Existing es.json had ASCII approximations for accented characters (e.g., "Clasificacion" without accent, "Arbitro" without accent)
- **Fix:** Added proper Unicode accents (Clasificacion -> Clasificacion with accent, Arbitro -> Arbitro with accent)
- **Files modified:** src/messages/es.json
- **Verification:** Visual inspection of accent characters in output file
- **Committed in:** 381c5db (Task 1 commit)

**2. [Rule 1 - Bug] Fixed missing accent marks in existing French translations**
- **Found during:** Task 2
- **Issue:** Existing fr.json had ASCII approximations for accented characters (e.g., "Resultats" without accent, "Equipe" without accent)
- **Fix:** Added proper Unicode accents throughout
- **Files modified:** src/messages/fr.json
- **Verification:** Visual inspection of accent characters in output file
- **Committed in:** 3f29a87 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed Italian apostrophe approximation**
- **Found during:** Task 2
- **Issue:** Existing it.json used ASCII apostrophe for "e'" instead of proper Unicode "e with grave accent"
- **Fix:** Corrected to proper Unicode character
- **Files modified:** src/messages/it.json
- **Verification:** Visual inspection in output file
- **Committed in:** 3f29a87 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 bugs - accent/character corrections)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 13 (i18n Completeness) is now COMPLETE -- all 6 plans executed
- All UI text is translatable and translated across 5 locales
- Ready for Phase 14 (SEO) and Phase 15 (Display Ads)
- No blockers or concerns

## Self-Check: PASSED

---
*Phase: 13-i18n-completeness*
*Completed: 2026-02-08*
