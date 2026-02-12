import { NextResponse } from 'next/server';
import {
  sitemapSegments,
} from '@/lib/seo/sitemap-registry';
import { buildSitemapIndexXml } from '@/lib/seo/sitemap-xml';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickleague.com';

export async function GET() {
  // Fetch entry counts for each segment
  const segmentCounts = await Promise.all(
    sitemapSegments.map(async (seg) => {
      const entries = await seg.fetchEntries();
      return { name: seg.name, count: entries.length };
    }),
  );

  // Only include segments with entries
  const populated = segmentCounts.filter((s) => s.count > 0);

  const xml = buildSitemapIndexXml(populated, siteUrl);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
