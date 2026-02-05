import { describe, it, expect } from 'vitest';
import {
  decimalToAmerican,
  decimalToFractional,
  formatOdds,
} from './odds-format';

describe('decimalToAmerican', () => {
  it('converts evens (2.00) to +100', () => {
    expect(decimalToAmerican(2.0)).toBe('+100');
  });

  it('converts positive odds (2.50) to +150', () => {
    expect(decimalToAmerican(2.5)).toBe('+150');
  });

  it('converts negative odds (1.50) to -200', () => {
    expect(decimalToAmerican(1.5)).toBe('-200');
  });

  it('converts heavy favourite (1.10) to -1000', () => {
    expect(decimalToAmerican(1.1)).toBe('-1000');
  });

  it('converts large positive odds (5.00) to +400', () => {
    expect(decimalToAmerican(5.0)).toBe('+400');
  });

  it('converts 3.00 to +200', () => {
    expect(decimalToAmerican(3.0)).toBe('+200');
  });
});

describe('decimalToFractional', () => {
  it('converts 2.50 to 3/2', () => {
    expect(decimalToFractional(2.5)).toBe('3/2');
  });

  it('converts 1.50 to 1/2', () => {
    expect(decimalToFractional(1.5)).toBe('1/2');
  });

  it('converts 3.00 to 2/1', () => {
    expect(decimalToFractional(3.0)).toBe('2/1');
  });

  it('converts 1.33 to 1/3', () => {
    expect(decimalToFractional(1.33)).toBe('1/3');
  });

  it('converts 2.00 to 1/1 (evens)', () => {
    expect(decimalToFractional(2.0)).toBe('1/1');
  });

  it('converts 1.25 to 1/4', () => {
    expect(decimalToFractional(1.25)).toBe('1/4');
  });

  it('converts 4.00 to 3/1', () => {
    expect(decimalToFractional(4.0)).toBe('3/1');
  });

  it('converts 11.00 to 10/1', () => {
    expect(decimalToFractional(11.0)).toBe('10/1');
  });

  it('handles non-standard values via GCD simplification', () => {
    // 1.85 -> numerator 0.85 -> 850/1000 -> 17/20
    expect(decimalToFractional(1.85)).toBe('17/20');
  });
});

describe('formatOdds', () => {
  const testDecimal = 2.5;

  it('formats as decimal with 2 decimal places', () => {
    expect(formatOdds(testDecimal, 'decimal')).toBe('2.50');
  });

  it('formats as fractional', () => {
    expect(formatOdds(testDecimal, 'fractional')).toBe('3/2');
  });

  it('formats as american', () => {
    expect(formatOdds(testDecimal, 'american')).toBe('+150');
  });

  it('formats 1.50 correctly across all formats', () => {
    expect(formatOdds(1.5, 'decimal')).toBe('1.50');
    expect(formatOdds(1.5, 'fractional')).toBe('1/2');
    expect(formatOdds(1.5, 'american')).toBe('-200');
  });
});
