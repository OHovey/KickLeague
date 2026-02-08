import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

const matchesPathnames = routing.pathnames['/matches'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('matchesTitle'),
    description: t('matchesDescription'),
    openGraph: {
      title: `${t('matchesTitle')} | KickLeague`,
      description: t('matchesDescription'),
    },
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `/${l}${typeof matchesPathnames === 'string' ? matchesPathnames : matchesPathnames[l]}`,
        ])
      ),
    },
  };
}

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
