---
created: 2026-02-06T00:05
title: Integrate display ads (Google AdSense and others)
area: general
files:
  - src/app/[locale]/layout.tsx
  - src/app/[locale]/page.tsx
  - src/app/[locale]/matches/[id]/page.tsx
  - src/app/[locale]/teams/[slug]/page.tsx
---

## Problem

The site currently has no display advertising. Affiliate links are the only monetisation channel, but they require users to click through and sign up with bookmakers — a high-friction conversion. Display ads provide passive revenue from pageviews alone, which is especially valuable while the site builds traffic.

### Why ads matter for this site
- Affiliate links need betting-intent users; display ads monetise ALL visitors
- Even at low traffic (1,000-5,000/mo), ads generate small but consistent revenue
- Combined with affiliate links, diversifies the revenue model
- Football content attracts high-CPM advertisers (sports betting, fantasy sports, sports apparel)

### Current state
- No ad infrastructure exists in the codebase
- No Google AdSense account or publisher ID
- No ad placement zones defined in the layout

## Solution

1. **Google AdSense** as primary ad network:
   - Sign up for AdSense account, get publisher ID
   - Add AdSense script tag to `layout.tsx` `<head>`
   - Create reusable `<AdUnit />` component wrapping ad slots
   - Place ad units strategically: between content sections, sidebar (if added), below match cards

2. **Ad placement zones** (non-intrusive):
   - Between league table and match preview section on homepage
   - Below match detail content
   - Between team tabs content sections
   - Sticky footer banner on mobile

3. **Consider alternatives/supplements**:
   - **Mediavine** or **Raptive** (higher CPM, but require 50k+ sessions/month)
   - **Carbon Ads** (developer/tech audience, cleaner aesthetic)
   - Start with AdSense, upgrade to premium networks when traffic qualifies

4. **GDPR/consent**: May need cookie consent banner for EU users (5 locales include FR, DE, IT, ES)
