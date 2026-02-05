// Client-safe date formatting utilities
// All functions accept Date or ISO string input and convert internally.
// Uses Intl APIs for locale-aware, timezone-aware formatting.

function toDate(input: Date | string): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

/**
 * Format a kickoff time as "15:00 GMT" in the user's local timezone.
 */
export function formatKickoffTime(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d);
}

/**
 * Format a match date as "Saturday 1 February".
 */
export function formatMatchDate(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/**
 * Format a relative time string.
 * Returns "2 hours ago" for < 24h, absolute date for older.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    // More than 24h: show absolute date
    return formatMatchDate(d);
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
 * Combined date and time: "Saturday 1 February, 15:00 GMT".
 */
export function formatMatchDateTime(date: Date | string): string {
  return `${formatMatchDate(date)}, ${formatKickoffTime(date)}`;
}
