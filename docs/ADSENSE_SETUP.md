# Google AdSense Setup Checklist

Step-by-step guide to configuring Google AdSense for KickLeague. The codebase already supports AdSense -- ads render automatically once the publisher ID and slot IDs are set via environment variables.

**Source files:**
- Ad configuration: `src/components/ads/ad-config.ts`
- Ad unit component: `src/components/ads/AdUnit.tsx`
- Publisher ads.txt: `public/ads.txt`
- Env var template: `.env.example`

---

## 1. Account Creation

- [ ] Go to [Google AdSense](https://adsense.google.com) and sign in with your Google account
- [ ] Click "Get Started" and enter your site URL (e.g. `kickleague.com`)
- [ ] Select your payment country and accept the Terms of Service
- [ ] AdSense will provide a verification snippet -- this is already handled by the `AdUnit` component which loads the AdSense script (`pagead2.googlesyndication.com`) when a publisher ID is configured
- [ ] Wait for account approval (typically 1-3 days for new sites; Google reviews site content and compliance)

> **Note:** Your site must have sufficient original content and comply with [AdSense Program Policies](https://support.google.com/adsense/answer/48182) before approval.

---

## 2. Publisher ID Configuration

Once your account is approved:

- [ ] In AdSense, go to **Account > Account Information**
- [ ] Copy your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
- [ ] In Vercel, go to **Project Settings > Environment Variables**
- [ ] Add the variable:

| Variable Name | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | `ca-pub-XXXXXXXXXXXXXXXX` | Production |

- [ ] Trigger a redeployment for the change to take effect

---

## 3. Ad Unit Creation (8 Slots)

In AdSense, go to **Ads > By ad unit > Display ads** and create each of the following ad units:

| # | Slot Key | Suggested Ad Unit Name | Format | Env Var |
|---|---|---|---|---|
| 1 | `HOMEPAGE_TOP` | KL Homepage Top | Responsive | `NEXT_PUBLIC_AD_SLOT_HOMEPAGE_TOP` |
| 2 | `HOMEPAGE_BOTTOM` | KL Homepage Bottom | Responsive | `NEXT_PUBLIC_AD_SLOT_HOMEPAGE_BOTTOM` |
| 3 | `MATCHES_TOP` | KL Matches Top | Responsive | `NEXT_PUBLIC_AD_SLOT_MATCHES_TOP` |
| 4 | `MATCHES_BOTTOM` | KL Matches Bottom | Responsive | `NEXT_PUBLIC_AD_SLOT_MATCHES_BOTTOM` |
| 5 | `MATCH_DETAIL_1` | KL Match Detail 1 | Responsive | `NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_1` |
| 6 | `MATCH_DETAIL_2` | KL Match Detail 2 | Responsive | `NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_2` |
| 7 | `TEAM_DETAIL_1` | KL Team Detail 1 | Responsive | `NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_1` |
| 8 | `TEAM_DETAIL_2` | KL Team Detail 2 | Responsive | `NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_2` |

For each ad unit:

1. Click **"Display ads"** in the ad unit creation panel
2. Enter the suggested name (e.g. "KL Homepage Top")
3. Select **Responsive** as the ad size
4. Click **Create**
5. From the generated ad code, copy the `data-ad-slot` value (a numeric string like `1234567890`)
6. This value goes into the corresponding env var listed above

---

## 4. Vercel Environment Variables

Set all 9 environment variables in **Vercel > Project Settings > Environment Variables**:

```
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX

NEXT_PUBLIC_AD_SLOT_HOMEPAGE_TOP=1234567890
NEXT_PUBLIC_AD_SLOT_HOMEPAGE_BOTTOM=1234567891
NEXT_PUBLIC_AD_SLOT_MATCHES_TOP=1234567892
NEXT_PUBLIC_AD_SLOT_MATCHES_BOTTOM=1234567893
NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_1=1234567894
NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_2=1234567895
NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_1=1234567896
NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_2=1234567897
```

> Replace the example values above with the actual slot IDs from your AdSense account. Set all variables for the **Production** environment. Redeploy after saving.

---

## 5. ads.txt Update

The file `public/ads.txt` currently contains a placeholder publisher ID:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

- [ ] Replace `pub-XXXXXXXXXXXXXXXX` with your real publisher ID (the numeric part after `ca-pub-`)
- [ ] Commit and deploy the change
- [ ] After deployment, verify the file is accessible at `https://kickleague.com/ads.txt`
- [ ] The format should be: `google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0`

> **Important:** The `ads.txt` file must be served at the root of your domain. Vercel serves files from `public/` at the root automatically.

---

## 6. Verification Checklist

After completing all steps above, verify everything is working:

- [ ] AdSense account is approved and active
- [ ] `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` is set in Vercel and matches your AdSense account
- [ ] All 8 ad unit slot IDs are created in AdSense and set in Vercel:
  - [ ] `NEXT_PUBLIC_AD_SLOT_HOMEPAGE_TOP`
  - [ ] `NEXT_PUBLIC_AD_SLOT_HOMEPAGE_BOTTOM`
  - [ ] `NEXT_PUBLIC_AD_SLOT_MATCHES_TOP`
  - [ ] `NEXT_PUBLIC_AD_SLOT_MATCHES_BOTTOM`
  - [ ] `NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_1`
  - [ ] `NEXT_PUBLIC_AD_SLOT_MATCH_DETAIL_2`
  - [ ] `NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_1`
  - [ ] `NEXT_PUBLIC_AD_SLOT_TEAM_DETAIL_2`
- [ ] `public/ads.txt` updated with real publisher ID
- [ ] `ads.txt` accessible at production URL
- [ ] Ads are visible on production pages (may take a few hours after initial setup)
- [ ] No AdSense policy violations in the AdSense dashboard
