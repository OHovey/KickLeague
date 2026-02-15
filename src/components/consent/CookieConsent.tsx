'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CookieConsent() {
  const t = useTranslations('CookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookie('cookie-consent')) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    setCookie('cookie-consent', 'accepted', 365);
    setVisible(false);
  }

  function handleReject() {
    setCookie('cookie-consent', 'rejected', 365);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-md px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm text-white/80">
          <p className="font-medium text-white mb-1">{t('title')}</p>
          <p>
            {t('description')}{' '}
            <Link href="/privacy" className="underline text-white/90 hover:text-white">
              {t('privacyLink')}
            </Link>
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
          >
            {t('rejectNonEssential')}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-colors"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
