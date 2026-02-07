# Phase 11: Rebrand to KickLeague - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace every user-facing and developer-facing reference from "FootballPulse" or "KickData" to "KickLeague". Create a KickLeague wordmark/logo SVG, favicon, PWA icons, and social preview image. The rename covers source code, config, planning docs, environment variables, package name, and GitHub repo.

</domain>

<decisions>
## Implementation Decisions

### Wordmark/logo design
- Sporty italic/slant typography — dynamic, athletic feel (ESPN/DAZN energy)
- Football icon + text — minimal outline football icon to the left of the wordmark
- White on dark — single-color white wordmark designed for dark backgrounds
- Icon style: minimal outline — simple line-art football, scales well to small sizes

### Brand voice & tone
- Personality: Smart sports companion — knowledgeable but approachable, data-rich but not intimidating
- Tagline: "Football intelligence, visualized"
- Naming: "KickLeague" (one word) in code/logos, "Kick League" (two words) acceptable in prose/descriptions
- No specific brand reference to emulate — build its own identity

### Favicon & meta assets
- Favicon: reuse the minimal outline football icon from the wordmark
- Full PWA icon set: 192x192, 512x512, apple-touch-icon — make the site installable
- Social preview (og:image): create now (not deferred to Phase 14)
- OG image style: dark card with wordmark centered, tagline below, matching site dark theme

### Rename scope
- Package name: rename to "kickleague" in package.json
- GitHub repo: rename from KickData to KickLeague
- Database/Neon project: rename to "kickleague" (full consistency, requires re-provisioning)
- Planning docs: find-and-replace in .planning/ files — full consistency
- Environment variables: rename any containing "KICKDATA" or "FOOTBALLPULSE" to use KICKLEAGUE prefix
- Source code: all strings, comments, config referencing old names updated

### Claude's Discretion
- Exact SVG design and proportions for the wordmark
- Specific icon sizing and padding for PWA icons
- How to handle the Neon re-provisioning (document steps vs automate)
- OG image dimensions and layout details

</decisions>

<specifics>
## Specific Ideas

- Sporty italic/slant like ESPN or DAZN — conveys motion and energy
- Football icon should be minimal outline, not filled or photorealistic
- "Football intelligence, visualized" as the tagline
- OG image: dark background matching site theme, wordmark centered, tagline below

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-rebrand-to-kickleague*
*Context gathered: 2026-02-06*
