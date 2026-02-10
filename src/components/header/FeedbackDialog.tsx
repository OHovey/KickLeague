'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { submitFeedback } from './actions';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function FeedbackButton() {
  const t = useTranslations('Feedback');
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const close = useCallback(() => {
    setIsOpen(false);
    setMessage('');
    setStatus('idle');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || message.trim().length > 2000) return;
    setStatus('submitting');
    const result = await submitFeedback(message, pathname ?? '/', locale);
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [message, pathname, locale]);

  // Auto-close after success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(close, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, close]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-white/70 transition-colors hover:text-white"
      >
        {t('button')}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-xl border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-md">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {t('title')}
              </h2>

              {status === 'success' ? (
                <p className="py-4 text-center text-sm text-green-400">
                  {t('success')}
                </p>
              ) : (
                <>
                  <textarea
                    className="h-32 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('placeholder')}
                    disabled={status === 'submitting'}
                  />

                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      {status === 'error' && (
                        <p className="text-xs text-red-400">{t('error')}</p>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      {message.length}/2000
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="text-sm text-white/60 hover:text-white"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        message.trim().length === 0 ||
                        status === 'submitting'
                      }
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                    >
                      {status === 'submitting' ? '...' : t('submit')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
