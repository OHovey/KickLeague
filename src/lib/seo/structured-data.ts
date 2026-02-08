/**
 * JSON-LD structured data builders for SEO.
 * Produces Schema.org objects suitable for injection via
 * <script type="application/ld+json">.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kickleague.com';

export function buildBreadcrumbs(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@id': item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        name: item.name,
      },
    })),
  };
}

export function buildSportsEvent(match: {
  homeTeamName: string;
  awayTeamName: string;
  kickoff: Date;
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.homeTeamName} vs ${match.awayTeamName}`,
    startDate: match.kickoff.toISOString(),
    ...(match.venue && {
      location: { '@type': 'Place', name: match.venue },
    }),
    homeTeam: { '@type': 'SportsTeam', name: match.homeTeamName },
    awayTeam: { '@type': 'SportsTeam', name: match.awayTeamName },
    sport: 'Football',
    eventStatus: 'https://schema.org/EventScheduled',
  };
}

export function buildSportsTeam(team: {
  name: string;
  logoUrl: string | null;
  url: string;
  leagueName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    sport: 'Football',
    url: team.url.startsWith('http') ? team.url : `${SITE_URL}${team.url}`,
    ...(team.logoUrl && { logo: team.logoUrl }),
    memberOf: {
      '@type': 'SportsOrganization',
      name: team.leagueName,
    },
  };
}

/**
 * Safely serialize JSON-LD for injection into a <script> tag.
 * Escapes < to \u003c to prevent XSS via </script> injection.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
