# User Setup: Neon PostgreSQL Database

**Plan:** 01-01 (Project Scaffolding & Database Schema)
**Required before:** Plan 01-03 (Data Seeding Pipeline)

## Why

FootballPulse stores all league, team, fixture, and standings data in a PostgreSQL database. Neon provides a serverless PostgreSQL service with an HTTP driver that works well with Next.js on Vercel.

## Steps

### 1. Create a Neon Account

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub or email

### 2. Create a New Project

1. Click **"New Project"** in the Neon dashboard
2. **Project name:** `footballpulse`
3. **Region:** Choose the closest region to you (or `us-east-1` for Vercel East)
4. **PostgreSQL version:** Leave as default (latest)
5. Click **"Create Project"**

### 3. Get the Connection String

1. After project creation, Neon shows the connection details
2. Click **"Connection Details"** in the left sidebar
3. Set the **"Connection type"** dropdown to **"Pooled"** (important for serverless)
4. Copy the full connection string -- it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Configure Your Local Environment

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste the Neon connection string as `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   API_FOOTBALL_KEY=your-api-football-key
   ```

### 5. Push the Schema to Neon

Run the following command to create all tables in your Neon database:

```bash
npx drizzle-kit push
```

You should see output confirming that 9 tables and 4 enum types were created.

### 6. Verify

You can verify the tables were created by:
- Checking the **"Tables"** section in the Neon dashboard
- Or running: `npx drizzle-kit studio` to browse the database visually

## Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Neon Dashboard > Project > Connection Details > Connection string (pooled) | Yes |
| `API_FOOTBALL_KEY` | [api-football.com](https://www.api-football.com/) > Dashboard > API Key | Yes (for Plan 01-03) |

## Troubleshooting

- **"Connection refused" errors:** Ensure the connection string includes `?sslmode=require`
- **"Database does not exist":** The default database is `neondb` -- make sure your connection string points to it
- **Slow first query:** Normal. Neon scales to zero when idle. First query after idle takes ~500ms for cold start.

---

# User Setup: API-Football API Key

**Plan:** 01-02 (API-Football Client)
**Required before:** Plan 01-03 (Data Seeding Pipeline)

## Why

API-Football is the primary data source for all football data (leagues, teams, fixtures, standings, players). The API client built in Plan 01-02 needs an API key to make requests. The free tier allows 100 requests/day and 10 requests/minute, which is sufficient for development with the file-cache proxy.

## Steps

### 1. Create an API-Football Account

**Option A: Direct (api-sports.io)**

1. Go to [https://www.api-football.com/](https://www.api-football.com/)
2. Click **"Get Free API Key"** or **"Pricing"**
3. Sign up for the **Free** plan (100 requests/day)
4. After signup, go to **Dashboard > Account**
5. Copy your **API Key**

**Option B: Via RapidAPI**

1. Go to [https://rapidapi.com/api-sports/api/api-football](https://rapidapi.com/api-sports/api/api-football)
2. Subscribe to the **Basic (Free)** plan
3. Your API key will be in the RapidAPI dashboard under **"X-RapidAPI-Key"**

> Note: If using RapidAPI, the base URL and header name differ. The client is configured for the direct api-sports.io endpoint. For RapidAPI, you would need to modify the base URL and header.

### 2. Configure Your Local Environment

1. Open your `.env` file (created during Plan 01-01 setup)
2. Set the `API_FOOTBALL_KEY` variable:
   ```
   API_FOOTBALL_KEY=your-api-key-here
   ```

### 3. Verify

You can verify your key works by running a quick test:

```bash
curl -s -H "x-apisports-key: YOUR_KEY_HERE" "https://v3.football.api-sports.io/status" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).response))"
```

You should see your account status with subscription details and remaining requests.

## Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `API_FOOTBALL_KEY` | [api-football.com](https://www.api-football.com/) Dashboard > Account > API Key | Yes |

## Budget Notes

- **Free tier:** 100 requests/day, 10 requests/minute
- **First full seed** of 5 leagues x 2 seasons requires ~400-420 API calls (4-5 days on free tier)
- **File-cache proxy** ensures subsequent runs consume zero API quota
- **Basic plan** ($9.99/month): 7,500 requests/month (~250/day) -- seed completes in ~2 days
