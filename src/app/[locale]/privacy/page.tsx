import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Privacy' });

  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Privacy' });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-white/80">
      <h1 className="text-3xl font-bold text-white mb-8">{t('title')}</h1>
      <p className="mb-8 text-sm text-white/50">{t('lastUpdated')}</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('dataCollectionTitle')}</h2>
        <p className="mb-2">{t('dataCollectionBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('cookiesTitle')}</h2>
        <p className="mb-2">{t('cookiesBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('thirdPartyTitle')}</h2>
        <p className="mb-2">{t('thirdPartyBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('yourRightsTitle')}</h2>
        <p className="mb-2">{t('yourRightsBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('manageConsentTitle')}</h2>
        <p className="mb-2">{t('manageConsentBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">{t('contactTitle')}</h2>
        <p className="mb-2">{t('contactBody')}</p>
      </section>
    </main>
  );
}
