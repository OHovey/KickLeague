'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="border-t border-white/10 bg-black/20 py-4 mt-12">
      <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">
            {t('privacyPolicy')}
          </Link>
          <span>{t('responsibleGambling')}</span>
        </div>
      </div>
    </footer>
  );
}
