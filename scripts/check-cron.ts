import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  // 1. Last 7 days of API call activity grouped by day
  console.log("=== API Call Activity (Last 7 Days) ===\n");
  const daily = await db.execute(sql.raw(`
    SELECT
      (called_at AT TIME ZONE 'UTC')::date AS day,
      COUNT(*) AS total_calls,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful,
      SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed,
      MIN(called_at AT TIME ZONE 'UTC') AS first_call,
      MAX(called_at AT TIME ZONE 'UTC') AS last_call
    FROM api_call_log
    WHERE called_at >= NOW() - interval '7 days'
    GROUP BY (called_at AT TIME ZONE 'UTC')::date
    ORDER BY day DESC
  `));
  for (const r of (daily as any).rows) {
    const first = new Date(r.first_call).toISOString().slice(11, 19);
    const last = new Date(r.last_call).toISOString().slice(11, 19);
    console.log(
      `  ${r.day} | ${r.total_calls} calls (${r.successful} ok, ${r.failed} fail) | first: ${first} UTC, last: ${last} UTC`
    );
  }

  // 2. Today's calls breakdown by endpoint
  console.log("\n=== Today's Calls by Endpoint ===\n");
  const byEndpoint = await db.execute(sql.raw(`
    SELECT
      endpoint,
      COUNT(*) AS count,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful,
      MIN(called_at AT TIME ZONE 'UTC') AS first_call,
      MAX(called_at AT TIME ZONE 'UTC') AS last_call
    FROM api_call_log
    WHERE called_at >= (NOW() AT TIME ZONE 'UTC')::date
    GROUP BY endpoint
    ORDER BY count DESC
  `));
  if ((byEndpoint as any).rows.length === 0) {
    console.log("  No calls today yet.");
  }
  for (const r of (byEndpoint as any).rows) {
    const first = new Date(r.first_call).toISOString().slice(11, 19);
    const last = new Date(r.last_call).toISOString().slice(11, 19);
    console.log(`  ${r.endpoint}: ${r.count} calls (${r.successful} ok) | ${first} - ${last} UTC`);
  }

  // 3. Most recent API calls (last 20)
  console.log("\n=== Most Recent 20 API Calls ===\n");
  const recent = await db.execute(sql.raw(`
    SELECT
      called_at AT TIME ZONE 'UTC' AS called_at_utc,
      endpoint,
      league_api_id,
      success,
      http_status,
      response_time_ms,
      daily_remaining,
      error_message
    FROM api_call_log
    ORDER BY called_at DESC
    LIMIT 20
  `));
  for (const r of (recent as any).rows) {
    const ts = new Date(r.called_at_utc).toISOString().slice(0, 19).replace("T", " ");
    const status = r.success ? "OK" : `FAIL(${r.http_status})`;
    const err = r.error_message ? ` | ${r.error_message}` : "";
    const remaining = r.daily_remaining != null ? ` | remaining: ${r.daily_remaining}` : "";
    console.log(
      `  ${ts} UTC | ${r.endpoint} | league=${r.league_api_id ?? "n/a"} | ${status} | ${r.response_time_ms}ms${remaining}${err}`
    );
  }

  // 4. Check for gaps - days with zero calls in last 14 days
  console.log("\n=== Days With ZERO API Calls (Last 14 Days) ===\n");
  const gaps = await db.execute(sql.raw(`
    WITH dates AS (
      SELECT generate_series(
        (NOW() - interval '14 days')::date,
        NOW()::date,
        '1 day'::interval
      )::date AS day
    )
    SELECT d.day
    FROM dates d
    LEFT JOIN api_call_log a
      ON (a.called_at AT TIME ZONE 'UTC')::date = d.day
    WHERE a.id IS NULL
    ORDER BY d.day DESC
  `));
  if ((gaps as any).rows.length === 0) {
    console.log("  None - API calls logged every day!");
  } else {
    for (const r of (gaps as any).rows) {
      console.log(`  ${r.day} - NO CALLS`);
    }
  }

  // 5. Cron invocation log (diagnostic entries)
  console.log("\n=== Cron Invocation Log (endpoint = '/cron/daily-resync') ===\n");
  const cronLogs = await db.execute(sql.raw(`
    SELECT
      called_at AT TIME ZONE 'UTC' AS called_at_utc,
      success,
      http_status,
      error_message,
      params
    FROM api_call_log
    WHERE endpoint = '/cron/daily-resync'
    ORDER BY called_at DESC
    LIMIT 20
  `));
  if ((cronLogs as any).rows.length === 0) {
    console.log("  No cron invocation logs yet. Deploy the updated route and wait for the next cron trigger.");
  }
  for (const r of (cronLogs as any).rows) {
    const ts = new Date(r.called_at_utc).toISOString().slice(0, 19).replace("T", " ");
    const status = r.success ? "OK" : `FAIL(${r.http_status})`;
    const err = r.error_message ? ` | error: ${r.error_message}` : "";
    const params = r.params ? ` | result: ${r.params.slice(0, 80)}` : "";
    console.log(`  ${ts} UTC | ${status}${err}${params}`);
  }
}

main().catch(console.error);
