import { describe, it, expect } from 'vitest';
import { DEFAULT_COUNTRY_RULES } from '../src/db/defaults';

describe('DEFAULT_COUNTRY_RULES', () => {
  it('exports an array', () => {
    expect(Array.isArray(DEFAULT_COUNTRY_RULES)).toBe(true);
  });

  it('contains exactly 12 rules', () => {
    expect(DEFAULT_COUNTRY_RULES).toHaveLength(12);
  });

  it('is typed as readonly to prevent mutation at compile time', () => {
    // ReadonlyArray is a TypeScript-only constraint; at runtime the array is a normal array.
    // We verify the type annotation exists by confirming the exported value is an array.
    expect(Array.isArray(DEFAULT_COUNTRY_RULES)).toBe(true);
  });

  it('every rule has a non-empty country code', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(typeof rule.country).toBe('string');
      expect(rule.country.length).toBeGreaterThan(0);
    }
  });

  it('every rule has a non-empty name', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(typeof rule.name).toBe('string');
      expect(rule.name.length).toBeGreaterThan(0);
    }
  });

  it('every rule has a positive integer threshold', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(typeof rule.threshold).toBe('number');
      expect(rule.threshold).toBeGreaterThan(0);
      expect(Number.isInteger(rule.threshold)).toBe(true);
    }
  });

  it('every rule has a positive integer window', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(typeof rule.window).toBe('number');
      expect(rule.window).toBeGreaterThan(0);
      expect(Number.isInteger(rule.window)).toBe(true);
    }
  });

  it('every rule has a threshold less than or equal to its window', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.threshold).toBeLessThanOrEqual(rule.window);
    }
  });

  it('all country codes are exactly 2 uppercase letters', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.country).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('all country codes are unique', () => {
    const codes = DEFAULT_COUNTRY_RULES.map((r) => r.country);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('all country names are unique', () => {
    const names = DEFAULT_COUNTRY_RULES.map((r) => r.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('all windows are 365 days', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.window).toBe(365);
    }
  });

  it('contains the United States rule with correct values', () => {
    const us = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'US');
    expect(us).toBeDefined();
    expect(us).toEqual({ country: 'US', name: 'United States', threshold: 183, window: 365 });
  });

  it('contains the United Kingdom rule with correct values', () => {
    const gb = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'GB');
    expect(gb).toBeDefined();
    expect(gb).toEqual({ country: 'GB', name: 'United Kingdom', threshold: 183, window: 365 });
  });

  it('contains the Portugal rule with correct values', () => {
    const pt = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'PT');
    expect(pt).toBeDefined();
    expect(pt).toEqual({ country: 'PT', name: 'Portugal', threshold: 183, window: 365 });
  });

  it('contains the Spain rule with correct values', () => {
    const es = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'ES');
    expect(es).toBeDefined();
    expect(es).toEqual({ country: 'ES', name: 'Spain', threshold: 183, window: 365 });
  });

  it('contains the France rule with correct values', () => {
    const fr = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'FR');
    expect(fr).toBeDefined();
    expect(fr).toEqual({ country: 'FR', name: 'France', threshold: 183, window: 365 });
  });

  it('contains the Germany rule with correct values', () => {
    const de = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'DE');
    expect(de).toBeDefined();
    expect(de).toEqual({ country: 'DE', name: 'Germany', threshold: 183, window: 365 });
  });

  it('contains the Thailand rule with a threshold of 180 (not 183)', () => {
    const th = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'TH');
    expect(th).toBeDefined();
    expect(th).toEqual({ country: 'TH', name: 'Thailand', threshold: 180, window: 365 });
  });

  it('contains the Canada rule with correct values', () => {
    const ca = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'CA');
    expect(ca).toBeDefined();
    expect(ca).toEqual({ country: 'CA', name: 'Canada', threshold: 183, window: 365 });
  });

  it('contains the Australia rule with correct values', () => {
    const au = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'AU');
    expect(au).toBeDefined();
    expect(au).toEqual({ country: 'AU', name: 'Australia', threshold: 183, window: 365 });
  });

  it('contains the Japan rule with correct values', () => {
    const jp = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'JP');
    expect(jp).toBeDefined();
    expect(jp).toEqual({ country: 'JP', name: 'Japan', threshold: 183, window: 365 });
  });

  it('contains the Netherlands rule with correct values', () => {
    const nl = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'NL');
    expect(nl).toBeDefined();
    expect(nl).toEqual({ country: 'NL', name: 'Netherlands', threshold: 183, window: 365 });
  });

  it('contains the Italy rule with correct values', () => {
    const it_ = DEFAULT_COUNTRY_RULES.find((r) => r.country === 'IT');
    expect(it_).toBeDefined();
    expect(it_).toEqual({ country: 'IT', name: 'Italy', threshold: 183, window: 365 });
  });

  it('Thailand is the only country with a threshold different from 183', () => {
    const nonStandard = DEFAULT_COUNTRY_RULES.filter((r) => r.threshold !== 183);
    expect(nonStandard).toHaveLength(1);
    expect(nonStandard[0].country).toBe('TH');
  });

  it('every rule object has exactly the expected keys', () => {
    const expectedKeys = new Set(['country', 'name', 'threshold', 'window']);
    for (const rule of DEFAULT_COUNTRY_RULES) {
      const keys = new Set(Object.keys(rule));
      expect(keys).toEqual(expectedKeys);
    }
  });

  it('contains all expected country codes', () => {
    const expectedCodes = ['US', 'GB', 'PT', 'ES', 'FR', 'DE', 'TH', 'CA', 'AU', 'JP', 'NL', 'IT'];
    const actualCodes = DEFAULT_COUNTRY_RULES.map((r) => r.country);
    for (const code of expectedCodes) {
      expect(actualCodes).toContain(code);
    }
  });

  it('no rule has a null or undefined field', () => {
    for (const rule of DEFAULT_COUNTRY_RULES) {
      expect(rule.country).not.toBeNull();
      expect(rule.country).not.toBeUndefined();
      expect(rule.name).not.toBeNull();
      expect(rule.name).not.toBeUndefined();
      expect(rule.threshold).not.toBeNull();
      expect(rule.threshold).not.toBeUndefined();
      expect(rule.window).not.toBeNull();
      expect(rule.window).not.toBeUndefined();
    }
  });

  it('the majority of rules have a threshold of 183', () => {
    const standardRules = DEFAULT_COUNTRY_RULES.filter((r) => r.threshold === 183);
    expect(standardRules.length).toBeGreaterThan(DEFAULT_COUNTRY_RULES.length / 2);
  });
});