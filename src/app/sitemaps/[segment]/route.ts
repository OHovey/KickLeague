import { NextRequest, NextResponse } from 'next/server';
import {
  sitemapSegments,
  MAX_URLS_PER_SITEMAP,
} from '@/lib/seo/sitemap-registry';
import { buildSitemapXml } from '@/lib/seo/sitemap-xml';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickleague.com';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ segment: string }> },
) {
  const { segment: rawSegment } = await params;

  // Strip .xml extension if present (e.g., 'teams.xml' -> 'teams')
  const segmentName = rawSegment.replace(/\.xml$/, '');

  // Handle pagination: 'teams-2' -> name='teams', page=2
  const paginationMatch = segmentName.match(/^(.+)-(\d+)$/);
  let name = segmentName;
  let page = 1;
  if (paginationMatch) {
    name = paginationMatch[1];
    page = parseInt(paginationMatch[2], 10);
  }

  const segment = sitemapSegments.find((s) => s.name === name);
  if (!segment) {
    return new NextResponse('Not found', { status: 404 });
  }

  const allEntries = await segment.fetchEntries();

  // Paginate if needed
  const start = (page - 1) * MAX_URLS_PER_SITEMAP;
  const entries = allEntries.slice(start, start + MAX_URLS_PER_SITEMAP);

  if (entries.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const xml = buildSitemapXml(entries, siteUrl, segment.changefreq);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
