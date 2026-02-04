export const LEAGUES = [
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'ligue-1',
] as const;

export type League = (typeof LEAGUES)[number];

export interface LeagueTheme {
  name: string;
  slug: League;
  logoUrl: string;
  colors: {
    primary: string;
    accent: string;
    bgStart: string;
    bgEnd: string;
  };
}

export const LEAGUE_THEMES: Record<League, LeagueTheme> = {
  'premier-league': {
    name: 'Premier League',
    slug: 'premier-league',
    logoUrl: '/leagues/premier-league.svg',
    colors: {
      primary: '#3d195b',
      accent: '#00ff87',
      bgStart: '#3d195b',
      bgEnd: '#1a0a2e',
    },
  },
  'la-liga': {
    name: 'La Liga',
    slug: 'la-liga',
    logoUrl: '/leagues/la-liga.svg',
    colors: {
      primary: '#ee8707',
      accent: '#1a1a1a',
      bgStart: '#ee8707',
      bgEnd: '#5a3200',
    },
  },
  'serie-a': {
    name: 'Serie A',
    slug: 'serie-a',
    logoUrl: '/leagues/serie-a.svg',
    colors: {
      primary: '#024494',
      accent: '#ffffff',
      bgStart: '#024494',
      bgEnd: '#001d40',
    },
  },
  bundesliga: {
    name: 'Bundesliga',
    slug: 'bundesliga',
    logoUrl: '/leagues/bundesliga.svg',
    colors: {
      primary: '#d20515',
      accent: '#ffffff',
      bgStart: '#d20515',
      bgEnd: '#5a0208',
    },
  },
  'ligue-1': {
    name: 'Ligue 1',
    slug: 'ligue-1',
    logoUrl: '/leagues/ligue-1.svg',
    colors: {
      primary: '#091c3e',
      accent: '#daff02',
      bgStart: '#091c3e',
      bgEnd: '#030810',
    },
  },
};
