---
created: 2026-02-10T04:34:39.418Z
title: Investigate empty biggest upset card on homepage
area: ui
files:
  - src/app/[locale]/page.tsx
  - src/app/[locale]/actions.ts
---

## Problem

The "biggest upset" card in the three-card hero row on the homepage is currently empty/blank. This is one of the key engagement metrics displayed to fans and having it empty looks broken. Need to investigate whether:

1. The data query is returning no results (e.g. filtering too aggressively, missing fixture data)
2. The component isn't rendering the data correctly
3. The metric calculation has an edge case (e.g. no upsets detected yet this season)

## Solution

1. Trace the data flow from server action -> component to find where data drops off
2. If easy to fix (data query issue, missing null handling, etc.) — fix it directly
3. If the "biggest upset" metric is fundamentally unreliable (e.g. requires odds data we don't have), replace with another fan-relatable metric such as:
   - Most goals in a single match this week
   - Longest winning/unbeaten streak
   - Biggest comeback
   - Most clean sheets
