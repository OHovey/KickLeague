import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildAffiliateLink } from './link-builder';
import { getAffiliateConfig, getAffiliateId, AFFILIATE_CONFIG } from './config';

// ---------------------------------------------------------------------------
// Config tests
// ---------------------------------------------------------------------------

describe('getAffiliateConfig', () => {
  it('returns config for a mapped bookmaker key', () => {
    const config = getAffiliateConfig('paddypower');
    expect(config).toBeDefined();
    expect(config!.programName).toBe('paddy_power');
    expect(config!.trackingParam).toBe('AFF_ID');
    expect(config!.envVar).toBe('PADDY_POWER_AFF_ID');
    expect(config!.homepage).toBe('https://www.paddypower.com/football');
  });

  it('returns undefined for an unmapped bookmaker key', () => {
    const config = getAffiliateConfig('unknown_bookie');
    expect(config).toBeUndefined();
  });

  it('maps coral and ladbrokes_uk to the same entain program', () => {
    const coral = getAffiliateConfig('coral');
    const ladbrokes = getAffiliateConfig('ladbrokes_uk');
    expect(coral).toBeDefined();
    expect(ladbrokes).toBeDefined();
    expect(coral!.programName).toBe('entain');
    expect(ladbrokes!.programName).toBe('entain');
    expect(coral!.envVar).toBe('ENTAIN_BTAG');
    expect(ladbrokes!.envVar).toBe('ENTAIN_BTAG');
  });

  it('maps all 6 bookmaker keys', () => {
    const keys = ['paddypower', 'coral', 'ladbrokes_uk', 'unibet_uk', '888sport', 'williamhill'];
    for (const key of keys) {
      expect(getAffiliateConfig(key)).toBeDefined();
    }
  });
});

describe('getAffiliateId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the affiliate ID when env var is set', () => {
    process.env.PADDY_POWER_AFF_ID = 'test123';
    const config = getAffiliateConfig('paddypower')!;
    expect(getAffiliateId(config)).toBe('test123');
  });

  it('returns undefined when env var is not set', () => {
    delete process.env.PADDY_POWER_AFF_ID;
    const config = getAffiliateConfig('paddypower')!;
    expect(getAffiliateId(config)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Link builder tests
// ---------------------------------------------------------------------------

describe('buildAffiliateLink', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Set up affiliate IDs for testing
    process.env.PADDY_POWER_AFF_ID = 'test123';
    process.env.ENTAIN_BTAG = 'entain123';
    process.env.KINDRED_AFF_ID = 'kindred456';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Case 1: API link provided, affiliate configured with ID
  it('appends affiliate tracking param to API-provided link', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: 'https://paddy.com/bet/123',
      sid: null,
    });

    expect(result.url).toBe('https://paddy.com/bet/123?AFF_ID=test123');
    expect(result.affiliateProgram).toBe('paddy_power');
  });

  // Case 2: API link provided, affiliate configured WITHOUT ID (graceful degradation)
  it('returns API link without tracking param when affiliate ID is not configured', () => {
    delete process.env.PADDY_POWER_AFF_ID;

    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: 'https://paddy.com/bet/123',
      sid: null,
    });

    expect(result.url).toBe('https://paddy.com/bet/123');
    expect(result.affiliateProgram).toBe('paddy_power');
  });

  // Case 3: No API link, sid available but no sidTemplate configured
  // (sidTemplate is optional and we start without it -- falls to homepage)
  it('falls back to homepage when no API link and no sidTemplate', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: null,
      sid: 'abc123',
    });

    expect(result.url).toBe('https://www.paddypower.com/football?AFF_ID=test123');
    expect(result.affiliateProgram).toBe('paddy_power');
  });

  // Case 4: No API link, no sid, homepage fallback
  it('uses homepage fallback with tracking param when no API link and no sid', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: null,
      sid: null,
    });

    expect(result.url).toBe('https://www.paddypower.com/football?AFF_ID=test123');
    expect(result.affiliateProgram).toBe('paddy_power');
  });

  // Case 5: Unknown bookmaker with API link
  it('returns API link as-is for unknown bookmaker', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'unknown_bookie',
      apiLink: 'https://bookie.com/bet/456',
      sid: null,
    });

    expect(result.url).toBe('https://bookie.com/bet/456');
    expect(result.affiliateProgram).toBeNull();
  });

  // Case 6: Unknown bookmaker without API link
  it('returns null url and null program for unknown bookmaker without API link', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'unknown_bookie',
      apiLink: null,
      sid: null,
    });

    expect(result.url).toBeNull();
    expect(result.affiliateProgram).toBeNull();
  });

  // Case 7: URL with existing query string (append with &)
  it('appends tracking param with & when URL already has query string', () => {
    const result = buildAffiliateLink({
      bookmakerKey: 'coral',
      apiLink: 'https://coral.co.uk/bet?id=789',
      sid: null,
    });

    expect(result.url).toBe('https://coral.co.uk/bet?id=789&btag=entain123');
    expect(result.affiliateProgram).toBe('entain');
  });

  // Case 8: Multiple bookmakers share same program (coral + ladbrokes_uk both entain)
  it('uses same affiliate program and env var for coral and ladbrokes_uk', () => {
    const coralResult = buildAffiliateLink({
      bookmakerKey: 'coral',
      apiLink: 'https://coral.co.uk/bet/1',
      sid: null,
    });

    const ladbrokesResult = buildAffiliateLink({
      bookmakerKey: 'ladbrokes_uk',
      apiLink: 'https://ladbrokes.com/bet/2',
      sid: null,
    });

    expect(coralResult.affiliateProgram).toBe('entain');
    expect(ladbrokesResult.affiliateProgram).toBe('entain');
    expect(coralResult.url).toContain('btag=entain123');
    expect(ladbrokesResult.url).toContain('btag=entain123');
  });

  // Additional edge case: homepage fallback without affiliate ID
  it('returns homepage without tracking param when affiliate ID is not set', () => {
    delete process.env.PADDY_POWER_AFF_ID;

    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: null,
      sid: null,
    });

    expect(result.url).toBe('https://www.paddypower.com/football');
    expect(result.affiliateProgram).toBe('paddy_power');
  });

  // Edge case: affiliate ID value is URL-encoded
  it('URL-encodes affiliate ID values in tracking params', () => {
    process.env.PADDY_POWER_AFF_ID = 'test id&special=chars';

    const result = buildAffiliateLink({
      bookmakerKey: 'paddypower',
      apiLink: 'https://paddy.com/bet/123',
      sid: null,
    });

    expect(result.url).toBe(
      'https://paddy.com/bet/123?AFF_ID=test%20id%26special%3Dchars'
    );
  });
});
