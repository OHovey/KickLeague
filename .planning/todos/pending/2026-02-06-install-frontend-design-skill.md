---
created: 2026-02-06T00:03
title: Install and use frontend-design Claude skill
area: tooling
files:
  - .claude/skills/frontend-design/SKILL.md
---

## Problem

The project currently has no Claude Code skills installed (`.claude/skills/` doesn't exist). The official `frontend-design` skill from Anthropic provides design guidance that would improve UI work quality — it pushes Claude to create distinctive, production-grade interfaces rather than generic AI-generated aesthetics.

This is especially relevant given the upcoming hero cards and homepage improvements in the todo backlog.

### What the skill does

Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design

The `frontend-design` skill activates when Claude works on UI/styling tasks. It instructs Claude to:

1. **Establish a bold aesthetic direction** before coding — consider purpose, audience, tone (minimalist/maximalist/retro/brutalist/etc.), and a memorable differentiator
2. **Use distinctive typography** — avoid generic fonts
3. **Commit to a color scheme** using CSS variables
4. **Add strategic animations** and micro-interactions
5. **Break predictable layouts** — use asymmetry, overlap, grid-breaking spatial composition
6. **Avoid generic AI aesthetics** — no cliché gradients, overused fonts, cookie-cutter layouts

### Skill contents

- `SKILL.md` — the skill instructions (loaded automatically by Claude Code when relevant)
- `LICENSE.txt` — license file

## Solution

1. Create `.claude/skills/frontend-design/` directory
2. Download `SKILL.md` and `LICENSE.txt` from `https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/`
3. Verify skill is recognized by Claude Code in future sessions
4. Apply the skill's design philosophy when working on UI todos (hero cards, header, etc.)
