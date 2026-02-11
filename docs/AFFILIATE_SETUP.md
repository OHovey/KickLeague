# Affiliate Program Setup Checklist

Step-by-step guide to configuring affiliate tracking for KickLeague's 5 bookmaker programs. The codebase already constructs affiliate links automatically -- bookmakers without configured IDs gracefully fall back to plain links.

**Source files:**
- Affiliate config: `src/lib/affiliate/config.ts`
- Link builder: `src/lib/affiliate/link-builder.ts`
- Env var template: `.env.example`

---

## 1. Overview

- KickLeague supports **5 affiliate programs** covering **6 bookmakers**
- Affiliate IDs are stored as environment variables, never in code
- Links are constructed by `src/lib/affiliate/link-builder.ts` using config from `src/lib/affiliate/config.ts`
- Each program can be enabled independently; bookmakers without configured IDs use plain links with no tracking
- All env vars are optional -- the site functions fully without any affiliate configuration

---

## 2. Program-by-Program Signup

### 2.1 Paddy Power (Flutter Partners)

- [ ] Sign up at the [Flutter Partners](https://www.flutterpartners.com/) affiliate program (Paddy Power)
- [ ] Wait for account approval
- [ ] After approval: find your **AFF_ID** in the Flutter Partners dashboard
- [ ] Set the env var:

| Variable | Value | Source |
|---|---|---|
| `PADDY_POWER_AFF_ID` | Your AFF_ID value | Flutter Partners dashboard |

**Details:**
- Tracking parameter: `AFF_ID`
- Bookmaker key: `paddypower`
- Homepage: `https://www.paddypower.com/football`

---

### 2.2 Entain Partners (Coral + Ladbrokes)

- [ ] Sign up at the [Entain Partners](https://www.entainpartners.com/) affiliate program
- [ ] Wait for account approval
- [ ] After approval: find your **btag** in the Entain Partners dashboard
- [ ] Set the env var:

| Variable | Value | Source |
|---|---|---|
| `ENTAIN_BTAG` | Your btag value | Entain Partners dashboard |

**Details:**
- Tracking parameter: `btag`
- Bookmaker keys: `coral`, `ladbrokes_uk` (shared program, single btag covers both)
- Homepages: `https://www.coral.co.uk/football`, `https://www.ladbrokes.com/football`

> **Note:** Entain Partners is a shared program. One btag value is used for both Coral and Ladbrokes links.

---

### 2.3 Kindred Group (Unibet)

- [ ] Sign up at the [Kindred Affiliates](https://www.kindredaffiliates.com/) program (Unibet)
- [ ] Wait for account approval
- [ ] After approval: find your **affiliate ID** in the Kindred Affiliates dashboard
- [ ] Set the env var:

| Variable | Value | Source |
|---|---|---|
| `KINDRED_AFF_ID` | Your affiliate ID | Kindred Affiliates dashboard |

**Details:**
- Tracking parameter: `utm_source`
- Bookmaker key: `unibet_uk`
- Homepage: `https://www.unibet.co.uk/football`

---

### 2.4 888sport (888 Affiliates)

- [ ] Sign up at the [888 Affiliates](https://www.888affiliates.com/) program
- [ ] Wait for account approval
- [ ] After approval: find your **a_aid** in the 888 Affiliates dashboard
- [ ] Set the env var:

| Variable | Value | Source |
|---|---|---|
| `888_AFF_ID` | Your a_aid value | 888 Affiliates dashboard |

**Details:**
- Tracking parameter: `a_aid`
- Bookmaker key: `sport888`
- Homepage: `https://www.888sport.com/football`

---

### 2.5 William Hill

- [ ] Sign up at the [William Hill Affiliates](https://www.williamhillaffiliates.com/) program
- [ ] Wait for account approval
- [ ] After approval: find your **btag** in the William Hill Affiliates dashboard
- [ ] Set the env var:

| Variable | Value | Source |
|---|---|---|
| `WILLIAM_HILL_BTAG` | Your btag value | William Hill Affiliates dashboard |

**Details:**
- Tracking parameter: `btag`
- Bookmaker key: `williamhill`
- Homepage: `https://sports.williamhill.com/betting/en-gb/football`

---

## 3. Vercel Configuration

- [ ] Go to **Vercel > Project Settings > Environment Variables**
- [ ] Add each affiliate env var for the **Production** environment:

```
PADDY_POWER_AFF_ID=your-aff-id
ENTAIN_BTAG=your-btag
KINDRED_AFF_ID=your-affiliate-id
888_AFF_ID=your-a-aid
WILLIAM_HILL_BTAG=your-btag
```

- [ ] Trigger a redeployment after adding or changing any values

> All affiliate env vars are optional. You can configure programs one at a time -- bookmakers without a configured ID will display plain links without tracking parameters.

---

## 4. Verification

For each configured program:

- [ ] Visit a match page that displays odds from the bookmaker
- [ ] Click the bookmaker link
- [ ] Verify the tracking parameter appears in the outbound URL:
  - Paddy Power: URL contains `AFF_ID=<your-value>`
  - Coral/Ladbrokes: URL contains `btag=<your-value>`
  - Unibet: URL contains `utm_source=<your-value>`
  - 888sport: URL contains `a_aid=<your-value>`
  - William Hill: URL contains `btag=<your-value>`
- [ ] Check the affiliate click analytics endpoint tracks the click correctly

---

## 5. Summary Table

| Program | Bookmaker(s) | Env Var | Tracking Param | Status |
|---|---|---|---|---|
| Flutter Partners | Paddy Power | `PADDY_POWER_AFF_ID` | `AFF_ID` | [ ] |
| Entain Partners | Coral, Ladbrokes | `ENTAIN_BTAG` | `btag` | [ ] |
| Kindred Affiliates | Unibet UK | `KINDRED_AFF_ID` | `utm_source` | [ ] |
| 888 Affiliates | 888sport | `888_AFF_ID` | `a_aid` | [ ] |
| William Hill | William Hill | `WILLIAM_HILL_BTAG` | `btag` | [ ] |

> Check off each row as you complete signup, approval, ID collection, and Vercel configuration.
