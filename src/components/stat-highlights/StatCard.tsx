'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface StatCardProps {
  label: string;
  icon: React.ReactNode;
  primaryStat: string;
  subject: string;
  context?: string;
  teamLogoUrl?: string | null;
  accentColor?: string;
  glowColor?: string;
  isEmpty?: boolean;
  href?: string;
}

export function StatCard({
  label,
  icon,
  primaryStat,
  subject,
  context,
  teamLogoUrl,
  accentColor,
  glowColor,
  isEmpty,
  href,
}: StatCardProps) {
  const tCommon = useTranslations('Common');
  const effectiveGlow = glowColor ?? accentColor;

  const cardClassName = "glow-card group relative overflow-hidden rounded-xl bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10";
  const cardStyle = accentColor
    ? {
        borderLeftColor: accentColor,
        borderLeftWidth: '3px',
        boxShadow: effectiveGlow
          ? `inset 3px 0 16px -6px ${effectiveGlow}35`
          : undefined,
      }
    : undefined;

  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={`${cardClassName}${href ? ' block no-underline' : ''}`}
      style={cardStyle}
    >
      {/* Accent gradient overlay */}
      {accentColor && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative">
        {/* Label row */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex-shrink-0"
            style={{ color: accentColor ?? 'rgba(255,255,255,0.5)' }}
          >
            {icon}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            {label}
          </span>
        </div>

        {isEmpty ? (
          <p className="text-sm text-white/30">{tCommon('noDataAvailable')}</p>
        ) : (
          <>
            {/* Primary stat */}
            <p className="text-2xl font-bold tabular-nums text-white md:text-3xl">
              {primaryStat}
            </p>

            {/* Subject with team logo */}
            <div className="mt-2 flex items-center gap-2">
              {teamLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teamLogoUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/10" />
              )}
              <span
                className="text-lg font-semibold"
                style={{ color: glowColor ?? accentColor ?? '#ffffff' }}
              >
                {subject}
              </span>
            </div>

            {/* Context */}
            {context && (
              <p className="mt-1 text-sm text-white/60">{context}</p>
            )}
          </>
        )}
      </div>
    </Wrapper>
  );
}
