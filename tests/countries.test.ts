import { describe, it, expect } from 'vitest';
import { COUNTRY_META, DEFAULT_COUNTRY_RULES, getCountryMeta } from '../src/calculations/countries';

describe('COUNTRY_META', () => {
  it('contains an entry for every expected alpha-2 code', () => {
    const expectedCodes = [
      'US', 'GB', 'PT', 'ES', 'FR', 'DE', 'TH', 'CA', 'AU', 'JP', 'NL', 'IT',
      'AT', 'BE', 'CH', 'CZ', 'DK', 'FI', 'GR', 'HR', 'HU', 'IE', 'MX', 'NO',
      'NZ', 'PL', 'RO', 'SE', 'SG', 'SK', 'TR', 'UA', 'VN', 'ZA', 'BR', 'AR',
      'CO', 'IN', 'CN', 'KR', 'ID', 'MY', 'PH', 'EG', 'MA', 'NG', 'KE', 'IL',
      'AE', 'SA',
    ];
    for (const code of expectedCodes) {
      expect(COUNTRY_META).toHaveProperty(code);
    }
  });

  it('has at least 50 entries', () => {
    expect(Object.keys(COUNTRY_META).length).toBeGreaterThanOrEqual(50);
  });

  it('each entry has a code field matching its key', () => {
    for (const [key, meta] of Object.entries(COUNTRY_META)) {
      expect(meta.code).toBe(key);
    }
  });

  it('each entry has a non-empty name', () => {
    for (const meta of Object.values(COUNTRY_META)) {
      expect(meta.name).toBeTruthy();
      expect(typeof meta.name).toBe('string');
    }
  });

  it('each entry has a non-empty flag emoji', () => {
    for (const meta of Object.values(COUNTRY_META)) {
      expect(meta.flag).toBeTruthy();
      expect(typeof meta.flag).toBe('string');
    }
  });

  it('US entry has correct values', () => {
    expect(COUNTRY_META['US']).toEqual({
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
    });
  });

  it('GB entry has correct values', () => {
    expect(COUNTRY_META['GB']).toEqual({
      code: 'GB',
      name: 'United Kingdom',
      flag: '🇬🇧',
    });
  });

  it('PT entry has correct values', () => {
    expect(COUNTRY_META['PT']).toEqual({
      code: 'PT',
      name: 'Portugal',
      flag: '🇵🇹',
    });
  });

  it('TH entry has correct values', () => {
    expect(COUNTRY_META['TH']).toEqual({
      code: 'TH',
      name: 'Thailand',
      flag: '🇹🇭',
    });
  });

  it('AE entry has correct values', () => {
    expect(COUNTRY_META['AE']).toEqual({
      code: 'AE',
      name: 'United Arab Emirates',
      flag: '🇦🇪',
    });
  });

  it('all keys are exactly 2 uppercase characters', () => {
    for (const key of Object.keys(COUNTRY_META)) {
      expect(key).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('all code fields are exactly 2 uppercase characters', () => {
    for (const meta of Object.values(COUNTRY_META)) {
      expect(meta.code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('has no duplicate names', () => {
    const names = Object.values(COUNTRY_META).map((m) => m.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('DEFAULT_COUNTRY_RULES', () => {
  it('contains exactly 12 entries', () => {
    expect(DEFAULT_COUNTRY_RULES).toHaveLength(12);
  });

  it('contains the 12 expected country codes', () => {
    const expectedCodes = ['US', 'GB', 'PT', 'ES', 'FR', 'DE', 'TH', 'CA', 'AU', 'JP', 'NL', 'IT'];
    const actualCodes = DEFAULT_COUNTRY_RULES.map((r) => r.country);
    expect(actualCodes).toEqual(expectedCodes);
  });

  it('each rule has a country, name, threshold, and window field', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule).toHaveProperty('country');
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('threshold');
      expect(rule).toHaveProperty('window');
    }
  });

  it('each rule country code is a 2-character uppercase string', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.country).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('each rule has a positive threshold', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.threshold).toBeGreaterThan(0);
    }
  });

  it('each rule has a positive window', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.window).toBeGreaterThan(0);
    }
  });

  it('threshold is always less than or equal to window', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.threshold).toBeLessThanOrEqual(rule.window);
    }
  });

  it('all windows are 365', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.window).toBe(365);
    }
  });

  it('most thresholds are 183 (standard rule)', () => {
    const standardRules = DEFAULT_COUNTRY_RULES.filter((r) => r.threshold === 183);
    expect(standardRules.length).toBeGreaterThanOrEqual(11);
  });

  it('Thailand has threshold of 180', () => {
    const th = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'TH');
    expect(th).toBeDefined();
    expect(th!.threshold).toBe(180);
  });

  it('US rule has correct values', () => {
    const us = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'US');
    expect(us).toEqual({ country: 'US', name: 'United States', threshold: 183, window: 365 });
  });

  it('GB rule has correct values', () => {
    const gb = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'GB');
    expect(gb).toEqual({ country: 'GB', name: 'United Kingdom', threshold: 183, window: 365 });
  });

  it('IT rule has correct values', () => {
    const it_ = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'IT');
    expect(it_).toEqual({ country: 'IT', name: 'Italy', threshold: 183, window: 365 });
  });

  it('each rule name matches the corresponding COUNTRY_META name', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      const meta = COUNTRY_META[rule.country];
      expect(meta).toBeDefined();
      expect(rule.name).toBe(meta.name);
    }
  });

  it('has no duplicate country codes', () => {
    const codes = DEFAULT_COUNTRY_RULES.map((r) => r.country);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('all country codes exist in COUNTRY_META', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(COUNTRY_META).toHaveProperty(rule.country);
    }
  });
});

describe('getCountryMeta', () => {
  it('returns correct meta for a known code - US', () => {
    const result = getCountryMeta('US');
    expect(result).toEqual({ code: 'US', name: 'United States', flag: '🇺🇸' });
  });

  it('returns correct meta for a known code - GB', () => {
    const result = getCountryMeta('GB');
    expect(result).toEqual({ code: 'GB', name: 'United Kingdom', flag: '🇬🇧' });
  });

  it('returns correct meta for a known code - TH', () => {
    const result = getCountryMeta('TH');
    expect(result).toEqual({ code: 'TH', name: 'Thailand', flag: '🇹🇭' });
  });

  it('returns correct meta for a known code - AE', () => {
    const result = getCountryMeta('AE');
    expect(result).toEqual({ code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' });
  });

  it('returns fallback for an unknown code', () => {
    const result = getCountryMeta('XX');
    expect(result).toEqual({ code: 'XX', name: 'XX', flag: '🏳' });
  });

  it('returns fallback with the unknown code used as name', () => {
    const result = getCountryMeta('ZZ');
    expect(result.code).toBe('ZZ');
    expect(result.name).toBe('ZZ');
    expect(result.flag).toBe('🏳');
  });

  it('returns fallback for an empty string', () => {
    const result = getCountryMeta('');
    expect(result).toEqual({ code: '', name: '', flag: '🏳' });
  });

  it('returns fallback for a lowercase code that does not match', () => {
    const result = getCountryMeta('us');
    expect(result).toEqual({ code: 'us', name: 'us', flag: '🏳' });
  });

  it('returns fallback for a numeric string', () => {
    const result = getCountryMeta('123');
    expect(result).toEqual({ code: '123', name: '123', flag: '🏳' });
  });

  it('returns fallback for a single character code', () => {
    const result = getCountryMeta('U');
    expect(result).toEqual({ code: 'U', name: 'U', flag: '🏳' });
  });

  it('returns fallback for a three-character code', () => {
    const result = getCountryMeta('USA');
    expect(result).toEqual({ code: 'USA', name: 'USA', flag: '🏳' });
  });

  it('returned object for known code has correct structure', () => {
    const result = getCountryMeta('JP');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('flag');
    expect(result.code).toBe('JP');
    expect(result.name).toBe('Japan');
    expect(result.flag).toBe('🇯🇵');
  });

  it('returned object for unknown code has correct structure', () => {
    const result = getCountryMeta('QQ');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('flag');
  });

  it('does not mutate COUNTRY_META when called with an unknown code', () => {
    const keysBefore = Object.keys(COUNTRY_META).length;
    getCountryMeta('XY');
    const keysAfter = Object.keys(COUNTRY_META).length;
    expect(keysAfter).toBe(keysBefore);
  });

  it('returns the same reference as COUNTRY_META for known codes', () => {
    const result = getCountryMeta('FR');
    expect(result).toBe(COUNTRY_META['FR']);
  });

  it('returns consistent results on repeated calls with the same unknown code', () => {
    const first = getCountryMeta('WW');
    const second = getCountryMeta('WW');
    expect(first).toEqual(second);
  });

  it('handles all 12 default rule country codes correctly', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      const meta = getCountryMeta(rule.country);
      expect(meta.code).toBe(rule.country);
      expect(meta.name).toBe(rule.name);
      expect(meta.flag).not.toBe('🏳');
    }
  });
});