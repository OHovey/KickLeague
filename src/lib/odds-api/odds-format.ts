/**
 * Odds format conversion functions.
 *
 * Converts between decimal, fractional, and American odds formats.
 * The Odds API returns decimal format; these functions enable user-selectable display.
 *
 * No external dependencies needed -- the math is standard and trivial.
 */

/**
 * Common fractional odds lookup table.
 * Maps (decimal - 1) values to standard fractional representations.
 * Used for exact matches before falling back to GCD simplification.
 */
const COMMON_FRACTIONS: Record<string, string> = {
  '0.1': '1/10',
  '0.2': '1/5',
  '0.25': '1/4',
  '0.33': '1/3',
  '0.5': '1/2',
  '0.67': '2/3',
  '1': '1/1',
  '1.2': '6/5',
  '1.25': '5/4',
  '1.375': '11/8',
  '1.5': '3/2',
  '1.625': '13/8',
  '1.75': '7/4',
  '1.875': '15/8',
  '2': '2/1',
  '2.25': '9/4',
  '2.5': '5/2',
  '2.75': '11/4',
  '3': '3/1',
  '3.5': '7/2',
  '4': '4/1',
  '4.5': '9/2',
  '5': '5/1',
  '6': '6/1',
  '7': '7/1',
  '8': '8/1',
  '9': '9/1',
  '10': '10/1',
};

/**
 * Greatest common divisor using Euclidean algorithm.
 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Convert decimal odds to American format.
 *
 * - Decimal >= 2.0: positive American (e.g. 2.50 -> "+150")
 * - Decimal < 2.0: negative American (e.g. 1.50 -> "-200")
 *
 * @param decimal - Decimal odds value (e.g. 2.50)
 * @returns American odds string (e.g. "+150" or "-200")
 */
export function decimalToAmerican(decimal: number): string {
  if (decimal >= 2.0) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

/**
 * Convert decimal odds to fractional format.
 *
 * Uses a lookup table for common standard fractions, then falls back
 * to GCD-based simplification for non-standard values.
 *
 * @param decimal - Decimal odds value (e.g. 2.50)
 * @returns Fractional odds string (e.g. "3/2")
 */
export function decimalToFractional(decimal: number): string {
  const numerator = decimal - 1;

  // Normalise key: strip trailing zeros and trailing decimal point
  const key = numerator
    .toFixed(3)
    .replace(/0+$/, '')
    .replace(/\.$/, '');

  if (COMMON_FRACTIONS[key]) {
    return COMMON_FRACTIONS[key];
  }

  // GCD-based simplification fallback
  const scale = 1000;
  const num = Math.round(numerator * scale);
  const den = scale;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

/**
 * Format decimal odds into the user's preferred display format.
 *
 * @param decimal - Decimal odds value (e.g. 2.50)
 * @param format - Target format: 'decimal', 'fractional', or 'american'
 * @returns Formatted odds string
 */
export function formatOdds(
  decimal: number,
  format: 'decimal' | 'fractional' | 'american'
): string {
  switch (format) {
    case 'decimal':
      return decimal.toFixed(2);
    case 'fractional':
      return decimalToFractional(decimal);
    case 'american':
      return decimalToAmerican(decimal);
  }
}
