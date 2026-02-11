# DNS and Domain Setup Checklist

Step-by-step guide to connecting a custom domain to the KickLeague Vercel deployment. Covers domain purchase, DNS configuration, SSL verification, and post-launch checks.

**Source files:**
- Env var template: `.env.example`
- SEO metadata: `src/app/[locale]/layout.tsx`
- Sitemap: `src/app/sitemap.ts`

---

## 1. Domain Purchase

- [ ] Register your domain (e.g. `kickleague.com`) from a registrar:
  - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (recommended -- at-cost pricing, built-in DNS)
  - [Namecheap](https://www.namecheap.com/)
  - [Google Domains](https://domains.google/) (now Squarespace Domains)
  - [Porkbun](https://porkbun.com/)
- [ ] Ensure WHOIS privacy protection is enabled (most registrars include this free)
- [ ] Note your registrar's DNS management panel location -- you will need it in step 3

> **Note:** Domain registration is typically instant, but DNS propagation after configuration changes can take up to 48 hours.

---

## 2. Vercel Domain Configuration

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Select the **KickLeague** project
- [ ] Navigate to **Settings > Domains**
- [ ] Click **"Add Domain"**
- [ ] Enter your domain name (e.g. `kickleague.com`)
- [ ] Vercel will display the required DNS records -- keep this page open for the next step
- [ ] Optionally add `www.kickleague.com` and configure it to redirect to the apex domain

---

## 3. DNS Record Configuration

At your domain registrar's DNS settings, add the following records:

### Apex Domain (`kickleague.com`)

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Auto / 300 |

> If your registrar supports `ALIAS` or `ANAME` records (e.g. Cloudflare, DNSimple), use `ALIAS cname.vercel-dns.com` instead of the A record for better reliability.

### WWW Subdomain (`www.kickleague.com`)

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto / 300 |

### Checking DNS Propagation

After configuring records, verify propagation using terminal commands:

```bash
# Check A record for apex domain
dig kickleague.com A +short
# Expected: 76.76.21.21

# Check CNAME record for www
dig www.kickleague.com CNAME +short
# Expected: cname.vercel-dns.com.

# Alternative: use nslookup
nslookup kickleague.com
nslookup www.kickleague.com
```

You can also use online tools like [dnschecker.org](https://dnschecker.org/) to verify global propagation.

> **Propagation times:** Most changes propagate within 5-30 minutes, but can take up to 48 hours in rare cases. Cloudflare-managed DNS is typically near-instant.

---

## 4. SSL Verification

Vercel automatically provisions SSL certificates via Let's Encrypt after DNS records are verified.

- [ ] After DNS propagation, visit `https://kickleague.com` in your browser
- [ ] Verify the padlock icon appears in the address bar (valid SSL)
- [ ] Check that `http://kickleague.com` redirects to `https://kickleague.com`
- [ ] In Vercel, go to **Settings > Domains** and confirm the domain shows a green checkmark

If SSL provisioning fails:

1. Check the Vercel Domains page for specific error messages
2. Ensure DNS records are correct (no conflicting records)
3. Wait up to 1 hour for Let's Encrypt to retry
4. If still failing, remove and re-add the domain in Vercel

---

## 5. Environment Variable Updates

After the domain is live, update the site URL:

- [ ] In Vercel, go to **Project Settings > Environment Variables**
- [ ] Update the following variable:

| Variable | Old Value | New Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://kick-league-gray.vercel.app` | `https://kickleague.com` |

- [ ] Trigger a redeployment for the change to take effect

This variable affects:
- SEO metadata (title, description, canonical URLs)
- `sitemap.xml` generation (all page URLs)
- Open Graph image URLs
- Canonical link tags
- `hreflang` alternate URLs for i18n

> **Important:** Without updating this variable, SEO metadata and sitemaps will still reference the old Vercel deployment URL.

---

## 6. Post-DNS Verification Checklist

After domain is live and `NEXT_PUBLIC_SITE_URL` is updated:

### Core Functionality
- [ ] Domain resolves to the Vercel deployment (`https://kickleague.com` loads the site)
- [ ] HTTPS works with a valid SSL certificate (padlock icon visible)
- [ ] `www.kickleague.com` redirects to `kickleague.com` (or vice versa, as configured in Vercel)
- [ ] `NEXT_PUBLIC_SITE_URL` updated to production domain and site redeployed

### SEO and Crawlability
- [ ] Sitemap accessible at `https://kickleague.com/sitemap.xml` with correct domain in URLs
- [ ] Robots.txt accessible at `https://kickleague.com/robots.txt`
- [ ] OG images load correctly -- test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Canonical URLs in page source use the production domain

### Search Engine Registration
- [ ] Add property in [Google Search Console](https://search.google.com/search-console) for the new domain
- [ ] Verify domain ownership (DNS TXT record method recommended)
- [ ] Submit sitemap URL in Search Console

### Third-Party Service Updates
- [ ] Update AdSense site URL if previously submitted with a different domain
- [ ] Update Sentry project URL and allowed domains if needed
- [ ] Verify `ads.txt` accessible at `https://kickleague.com/ads.txt`

---

## Troubleshooting

### Domain Not Resolving
1. Confirm DNS records are correct with `dig` commands from step 3
2. Check for conflicting records (e.g. multiple A records) at your registrar
3. Wait for propagation -- check status at [dnschecker.org](https://dnschecker.org/)

### SSL Certificate Not Issued
1. Verify domain is added in Vercel Settings > Domains
2. Ensure DNS records point to Vercel (not another provider)
3. Check for CAA records that might block Let's Encrypt
4. Try removing and re-adding the domain in Vercel

### Pages Return 404 After Domain Change
1. Ensure the domain is linked to the correct Vercel project
2. Check that the latest deployment is production (not preview)
3. Verify no redirect loops in Vercel domain settings
