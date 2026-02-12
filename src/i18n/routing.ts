import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'es', 'de', 'it', 'fr'] as const;
export const defaultLocale = 'en';

/**
 * Full routing config with localized pathnames.
 * Used by the middleware for URL rewriting (e.g., /de/spiele -> /de/matches).
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames: {
    '/': '/',
    '/matches': {
      en: '/matches',
      es: '/partidos',
      de: '/spiele',
      it: '/partite',
      fr: '/matchs',
    },
    '/matches/[id]': {
      en: '/matches/[id]',
      es: '/partidos/[id]',
      de: '/spiele/[id]',
      it: '/partite/[id]',
      fr: '/matchs/[id]',
    },
    '/teams/[slug]': {
      en: '/teams/[slug]',
      es: '/equipos/[slug]',
      de: '/mannschaften/[slug]',
      it: '/squadre/[slug]',
      fr: '/equipes/[slug]',
    },
    '/leagues/[slug]': {
      en: '/leagues/[slug]',
      es: '/ligas/[slug]',
      de: '/ligen/[slug]',
      it: '/campionati/[slug]',
      fr: '/championnats/[slug]',
    },
  },
});

/**
 * Navigation routing without pathnames.
 * Used by createNavigation() so that Link/redirect/useRouter accept
 * plain string hrefs (e.g., `/matches/123`).
 *
 * Once all components are migrated to structured pathname objects
 * (e.g., { pathname: '/matches/[id]', params: { id: '123' } }),
 * this can be replaced with the full `routing` config above.
 */
export const navigationRouting = defineRouting({
  locales,
  defaultLocale,
});

export type Locale = (typeof locales)[number];
