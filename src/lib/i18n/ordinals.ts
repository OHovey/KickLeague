/**
 * Returns a locale-aware ordinal string.
 *
 * Examples:
 *   getLocalizedOrdinal(1, 'en') -> "1st"
 *   getLocalizedOrdinal(1, 'de') -> "1."
 *   getLocalizedOrdinal(1, 'fr') -> "1er"
 *   getLocalizedOrdinal(2, 'fr') -> "2e"
 *   getLocalizedOrdinal(1, 'es') -> "1.o"
 *   getLocalizedOrdinal(1, 'it') -> "1o"
 */
export function getLocalizedOrdinal(n: number, locale: string): string {
  switch (locale) {
    case 'de':
      return `${n}.`;
    case 'fr':
      return n === 1 ? `${n}er` : `${n}e`;
    case 'es':
      return `${n}.\u00BA`;
    case 'it':
      return `${n}\u00BA`;
    default: {
      // English ordinals
      const mod100 = n % 100;
      if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
      switch (n % 10) {
        case 1:
          return `${n}st`;
        case 2:
          return `${n}nd`;
        case 3:
          return `${n}rd`;
        default:
          return `${n}th`;
      }
    }
  }
}
