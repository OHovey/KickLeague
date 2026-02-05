// Client-safe date formatting utilities
// All functions accept Date or ISO string input and convert internally.
// Uses Intl APIs for locale-aware, timezone-aware formatting.
// An optional `locale` parameter defaults to 'en-GB' for backward compatibility.

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

/**
 * Format a kickoff time as "15:00 GMT" in the user's local timezone.
 * The locale parameter affects the formatting conventions (12h vs 24h, etc.).
 * Defaults to undefined (browser default) to preserve existing behaviour.
 */
export function formatKickoffTime(
  date: Date | string,
  locale?: string
): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d);
}

/**
 * Format a match date as "Saturday 1 February".
 * Locale-aware: "Samstag, 1. Februar" in de, "sabato 1 febbraio" in it, etc.
 */
export function formatMatchDate(
  date: Date | string,
  locale: string = 'en-GB'
): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/**
 * Format a relative time string.
 * Returns "2 hours ago" for < 24h, absolute date for older.
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = 'en'
): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    // More than 24h: show absolute date
    return formatMatchDate(d, locale);
  }

  if (Math.abs(diffHours) >= 1) {
    return rtf.format(-diffHours, 'hour');
  }

  if (Math.abs(diffMinutes) >= 1) {
    return rtf.format(-diffMinutes, 'minute');
  }

  return rtf.format(-diffSeconds, 'second');
}

/**
 * Format a match date as short "Sat 1 Feb" for compact card display.
 * Locale-aware: "Sa. 1. Feb." in de, "sab 1 feb" in it, etc.
 */
export function formatMatchDateShort(
  date: Date | string,
  locale: string = 'en-GB'
): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/**
 * Combined date and time: "Saturday 1 February, 15:00 GMT".
 */
export function formatMatchDateTime(
  date: Date | string,
  locale: string = 'en-GB'
): string {
  return `${formatMatchDate(date, locale)}, ${formatKickoffTime(date, locale)}`;
}

/**
 * Format a number with locale-appropriate separators.
 * 1000 -> "1,000" (en) or "1.000" (de) or "1 000" (fr).
 */
export function formatNumber(
  value: number,
  locale: string = 'en-GB'
): string {
  return new Intl.NumberFormat(locale).format(value);
}
