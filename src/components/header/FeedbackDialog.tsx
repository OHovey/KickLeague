'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
              onClick={close}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-xl border border-white/10 bg-black/80 p-8 shadow-2xl backdrop-blur-md">
                <h2 className="mb-6 text-xl font-semibold text-white">
                  {t('title')}
                </h2>

                {status === 'success' ? (
                  <p className="py-6 text-center text-base text-green-400">
                    {t('success')}
                  </p>
                ) : (
                  <>
                    <textarea
                      className="h-44 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-4 text-base text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
                      maxLength={2000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('placeholder')}
                      disabled={status === 'submitting'}
                      autoFocus
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        {status === 'error' && (
                          <p className="text-sm text-red-400">{t('error')}</p>
                        )}
                      </div>
                      <p className="text-sm text-white/40">
                        {message.length}/2000
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
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
                        className="rounded-lg bg-white/10 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                      >
                        {status === 'submitting' ? '...' : t('submit')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
