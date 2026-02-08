'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Francais',
};

const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  fr: 'FR',
};

export function LanguagePicker() {
  const locale = useLocale() as Locale;
  const t = useTranslations('Navigation');
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(newLocale: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={t('selectLanguage')}
        aria-expanded={open}
      >
        {LOCALE_SHORT[locale]}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-white/10 bg-black/90 py-1 shadow-xl backdrop-blur-md">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                l === locale
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-6 text-xs text-white/50">{LOCALE_SHORT[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
