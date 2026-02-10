import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/csp-report
 *
 * Receives Content Security Policy violation reports from browsers.
 * Logs them server-side for monitoring -- no database storage needed
 * at this scale. In production, these logs go to Vercel's log drain
 * (or Sentry once monitoring is set up in Phase 17).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Browsers send reports in two formats:
    // 1. Legacy: { "csp-report": { ... } }
    // 2. Reporting API: { "type": "csp-violation", "body": { ... } }
    const report = body['csp-report'] ?? body.body ?? body;

    console.warn('[csp-report]', JSON.stringify({
      blockedUri: report['blocked-uri'] ?? report.blockedURL ?? 'unknown',
      violatedDirective: report['violated-directive'] ?? report.effectiveDirective ?? 'unknown',
      documentUri: report['document-uri'] ?? report.documentURL ?? 'unknown',
      timestamp: new Date().toISOString(),
    }));

    // Always return 204 No Content -- browsers don't care about the response body
    return new NextResponse(null, { status: 204 });
  } catch {
    // Malformed report -- still return 204 to prevent browser retries
    return new NextResponse(null, { status: 204 });
  }
}
