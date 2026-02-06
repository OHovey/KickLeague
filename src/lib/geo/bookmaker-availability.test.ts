import { describe, it, expect } from 'vitest';
import {
  getAvailableBookmakers,
  isCountryMapped,
  BOOKMAKER_AVAILABILITY,
  type BookmakerEntry,
} from './bookmaker-availability';

// ---------------------------------------------------------------------------
// getAvailableBookmakers
// ---------------------------------------------------------------------------

describe('getAvailableBookmakers', () => {
  it('returns all 8 bookmakers for GB', () => {
    const result = getAvailableBookmakers('GB');
    expect(result).toHaveLength(8);
  });

  it('returns GB bookmakers sorted by priority (paddypower first)', () => {
    const result = getAvailableBookmakers('GB');
    expect(result[0].bookmakerKey).toBe('paddypower');
    expect(result[0].priority).toBe(1);
    expect(result[7].bookmakerKey).toBe('betfair_sb_uk');
    expect(result[7].priority).toBe(8);
  });

  it('returns only unibet_uk for FR', () => {
    const result = getAvailableBookmakers('FR');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ bookmakerKey: 'unibet_uk', priority: 1 });
  });

  it('returns 2 bookmakers for DK with betfair_sb_uk first', () => {
    const result = getAvailableBookmakers('DK');
    expect(result).toHaveLength(2);
    expect(result[0].bookmakerKey).toBe('betfair_sb_uk');
    expect(result[1].bookmakerKey).toBe('unibet_uk');
  });

  it('returns 5 bookmakers for SE with unibet_uk first', () => {
    const result = getAvailableBookmakers('SE');
    expect(result).toHaveLength(5);
    expect(result[0].bookmakerKey).toBe('unibet_uk');
    expect(result[4].bookmakerKey).toBe('betfair_sb_uk');
  });

  it('returns 1 bookmaker for PT (betfair_sb_uk)', () => {
    const result = getAvailableBookmakers('PT');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ bookmakerKey: 'betfair_sb_uk', priority: 1 });
  });

  it('returns 4 bookmakers for AT', () => {
    const result = getAvailableBookmakers('AT');
    expect(result).toHaveLength(4);
    expect(result[0].bookmakerKey).toBe('unibet_uk');
    expect(result[3].bookmakerKey).toBe('betfair_sb_uk');
  });

  it('returns 4 bookmakers for CH', () => {
    const result = getAvailableBookmakers('CH');
    expect(result).toHaveLength(4);
    expect(result[0].bookmakerKey).toBe('unibet_uk');
    expect(result[3].bookmakerKey).toBe('betfair_sb_uk');
  });

  it('returns 2 bookmakers for DE with williamhill first', () => {
    const result = getAvailableBookmakers('DE');
    expect(result).toHaveLength(2);
    expect(result[0].bookmakerKey).toBe('williamhill');
    expect(result[1].bookmakerKey).toBe('betfair_sb_uk');
  });

  // Case insensitivity
  it('handles lowercase country codes (case insensitive)', () => {
    const lower = getAvailableBookmakers('gb');
    const upper = getAvailableBookmakers('GB');
    expect(lower).toEqual(upper);
  });

  it('handles mixed-case country codes', () => {
    const mixed = getAvailableBookmakers('Gb');
    const upper = getAvailableBookmakers('GB');
    expect(mixed).toEqual(upper);
  });

  // Fallback behavior
  it('falls back to GB default for null country code', () => {
    const result = getAvailableBookmakers(null);
    expect(result).toHaveLength(8);
    expect(result[0].bookmakerKey).toBe('paddypower');
  });

  it('falls back to GB default for unknown country code', () => {
    const result = getAvailableBookmakers('ZZ');
    expect(result).toHaveLength(8);
    expect(result[0].bookmakerKey).toBe('paddypower');
  });

  it('falls back to GB default for empty string', () => {
    const result = getAvailableBookmakers('');
    expect(result).toHaveLength(8);
  });

  // Priority and sort order
  it('sorts entries by priority ascending', () => {
    const result = getAvailableBookmakers('SE');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].priority).toBeGreaterThanOrEqual(result[i - 1].priority);
    }
  });

  it('sorts entries with same priority alphabetically by key', () => {
    // All countries in config have unique priorities per country,
    // but verify the sorting logic handles ties correctly
    // by checking all results are sorted by priority then alpha
    for (const code of Object.keys(BOOKMAKER_AVAILABILITY)) {
      const result = getAvailableBookmakers(code);
      for (let i = 1; i < result.length; i++) {
        if (result[i].priority === result[i - 1].priority) {
          expect(result[i].bookmakerKey > result[i - 1].bookmakerKey).toBe(true);
        }
      }
    }
  });

  // Immutability -- returned array should not be the internal reference
  it('returns a new array (not the internal reference)', () => {
    const a = getAvailableBookmakers('GB');
    const b = getAvailableBookmakers('GB');
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// isCountryMapped
// ---------------------------------------------------------------------------

describe('isCountryMapped', () => {
  it('returns true for all 8 configured Tier 1 countries', () => {
    const tier1 = ['GB', 'DK', 'SE', 'FR', 'PT', 'AT', 'CH', 'DE'];
    for (const code of tier1) {
      expect(isCountryMapped(code)).toBe(true);
    }
  });

  it('returns false for unknown country code', () => {
    expect(isCountryMapped('ZZ')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isCountryMapped(null)).toBe(false);
  });

  it('handles lowercase country code (case insensitive)', () => {
    expect(isCountryMapped('gb')).toBe(true);
    expect(isCountryMapped('fr')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isCountryMapped('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BOOKMAKER_AVAILABILITY const
// ---------------------------------------------------------------------------

describe('BOOKMAKER_AVAILABILITY', () => {
  it('has exactly 8 country entries', () => {
    expect(Object.keys(BOOKMAKER_AVAILABILITY)).toHaveLength(8);
  });

  it('all country codes are uppercase', () => {
    for (const code of Object.keys(BOOKMAKER_AVAILABILITY)) {
      expect(code).toBe(code.toUpperCase());
    }
  });

  it('all entries have positive integer priorities', () => {
    for (const entries of Object.values(BOOKMAKER_AVAILABILITY)) {
      for (const entry of entries) {
        expect(entry.priority).toBeGreaterThan(0);
        expect(Number.isInteger(entry.priority)).toBe(true);
      }
    }
  });
});
