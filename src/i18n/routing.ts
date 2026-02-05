import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'de', 'it', 'fr'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
