import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildWindow,
  overlapDays,
  daysInWindow,
  computeCountryStatus,
  validateTripDates,
  validateNoOverlap,
  Trip,
  CountryRule,
} from '../src/calculations/engine';

// Mock external dependencies
vi.mock('../src/calculations/date-utils', () => ({
  today: vi.fn(() => '2024-06-15'),
  parseDate: (str: string) => new Date(str + 'T00:00:00'),
  toDateStr: (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
}));

vi.mock('../src/calculations/countries', () => ({
  getCountryMeta: (country: string) => ({
    name: country === 'FR' ? 'France' : country === 'DE' ? 'Germany' : country,
    flag: country === 'FR' ? '🇫🇷' : country === 'DE' ? '🇩🇪' : '🏳️',
  }),
}));

import { today } from '../src/calculations/date-utils';

describe('buildWindow', () => {
  it('returns a window ending on the reference date', () => {
    const result = buildWindow('2024-06-15', 90);
    expect(result.end).toBe('2024-06-15');
  });

  it('returns a window starting (windowDays - 1) days before the reference date', () => {
    const result = buildWindow('2024-06-15', 90);
    expect(result.start).toBe('2024-03-18');
  });

  it('returns a 1-day window when windowDays is 1', () => {
    const result = buildWindow('2024-06-15', 1);
    expect(result.start).toBe('2024-06-15');
    expect(result.end).toBe('2024-06-15');
  });

  it('returns a 365-day window correctly', () => {
    const result = buildWindow('2024-12-31', 365);
    expect(result.end).toBe('2024-12-31');
    expect(result.start).toBe('2024-01-02');
  });

  it('returns a window spanning across year boundaries', () => {
    const result = buildWindow('2024-01-01', 365);
    expect(result.end).toBe('2024-01-01');
    expect(result.start).toBe('2023-01-02');
  });

  it('returns an object with start and end properties', () => {
    const result = buildWindow('2024-06-15', 30);
    expect(result).toHaveProperty('start');
    expect(result).toHaveProperty('end');
  });
});

describe('overlapDays', () => {
  const window = { start: '2024-01-01', end: '2024-03-31' };

  it('returns full trip days when trip is entirely within window', () => {
    const result = overlapDays('2024-01-10', '2024-01-20', window);
    expect(result).toBe(11); // inclusive: 10th through 20th
  });

  it('returns 0 when trip ends before window starts', () => {
    const result = overlapDays('2023-12-01', '2023-12-31', window);
    expect(result).toBe(0);
  });

  it('returns 0 when trip starts after window ends', () => {
    const result = overlapDays('2024-04-01', '2024-04-30', window);
    expect(result).toBe(0);
  });

  it('returns correct overlap when trip starts before window', () => {
    const result = overlapDays('2023-12-15', '2024-01-15', window);
    expect(result).toBe(15); // Jan 1 through Jan 15
  });

  it('returns correct overlap when trip ends after window', () => {
    const result = overlapDays('2024-03-15', '2024-04-15', window);
    expect(result).toBe(17); // Mar 15 through Mar 31
  });

  it('returns correct overlap when trip completely spans the window', () => {
    const result = overlapDays('2023-12-01', '2024-05-01', window);
    const windowDays = overlapDays('2024-01-01', '2024-03-31', window);
    expect(result).toBe(windowDays);
  });

  it('returns 1 when trip is exactly one day at window start', () => {
    const result = overlapDays('2024-01-01', '2024-01-01', window);
    expect(result).toBe(1);
  });

  it('returns 1 when trip is exactly one day at window end', () => {
    const result = overlapDays('2024-03-31', '2024-03-31', window);
    expect(result).toBe(1);
  });

  it('returns 1 when trip is exactly one day and touches window boundary', () => {
    const result = overlapDays('2023-12-31', '2024-01-01', window);
    expect(result).toBe(1); // only Jan 1 overlaps
  });

  it('returns 0 when trip ends exactly the day before window starts', () => {
    const result = overlapDays('2023-12-20', '2023-12-31', window);
    expect(result).toBe(0);
  });

  it('returns correct overlap for same-day arrival and departure within window', () => {
    const result = overlapDays('2024-02-15', '2024-02-15', window);
    expect(result).toBe(1);
  });

  it('handles window with start equal to end (1-day window)', () => {
    const singleDayWindow = { start: '2024-06-15', end: '2024-06-15' };
    expect(overlapDays('2024-06-15', '2024-06-15', singleDayWindow)).toBe(1);
    expect(overlapDays('2024-06-14', '2024-06-15', singleDayWindow)).toBe(1);
    expect(overlapDays('2024-06-15', '2024-06-16', singleDayWindow)).toBe(1);
    expect(overlapDays('2024-06-14', '2024-06-14', singleDayWindow)).toBe(0);
    expect(overlapDays('2024-06-16', '2024-06-16', singleDayWindow)).toBe(0);
  });
});

describe('daysInWindow', () => {
  const window = { start: '2024-01-01', end: '2024-03-31' };

  beforeEach(() => {
    vi.mocked(today).mockReturnValue('2024-06-15');
  });

  it('returns 0 for empty trips array', () => {
    expect(daysInWindow([], window)).toBe(0);
  });

  it('returns correct days for a single trip fully within window', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-10', departure: '2024-01-20' },
    ];
    expect(daysInWindow(trips, window)).toBe(11);
  });

  it('sums days across multiple trips', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
      { country: 'FR', arrival: '2024-02-01', departure: '2024-02-10' },
    ];
    expect(daysInWindow(trips, window)).toBe(20); // 10 + 10
  });

  it('treats null departure as today', () => {
    vi.mocked(today).mockReturnValue('2024-01-15');
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-10', departure: null },
    ];
    const result = daysInWindow(trips, window);
    expect(result).toBe(6); // Jan 10 through Jan 15
  });

  it('returns 0 when all trips are outside the window', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2023-01-01', departure: '2023-12-31' },
      { country: 'FR', arrival: '2024-05-01', departure: '2024-05-31' },
    ];
    expect(daysInWindow(trips, window)).toBe(0);
  });

  it('handles trips from multiple countries (does not filter)', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-01', departure: '2024-01-05' },
      { country: 'DE', arrival: '2024-01-06', departure: '2024-01-10' },
    ];
    // daysInWindow does not filter by country — caller must pre-filter
    const result = daysInWindow(trips, window);
    expect(result).toBe(10); // 5 + 5
  });

  it('handles a trip with same arrival and departure (1 day)', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-15', departure: '2024-01-15' },
    ];
    expect(daysInWindow(trips, window)).toBe(1);
  });
});

describe('computeCountryStatus', () => {
  beforeEach(() => {
    vi.mocked(today).mockReturnValue('2024-06-15');
  });

  it('returns correct status with no trips', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.daysPresent).toBe(0);
    expect(status.daysRemaining).toBe(183);
    expect(status.percentage).toBe(0);
    expect(status.country).toBe('FR');
  });

  it('uses default threshold of 183 when rule is null', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.threshold).toBe(183);
    expect(status.isDefaultRule).toBe(true);
  });

  it('uses default window of 365 when rule is null', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.window).toBe(365);
  });

  it('uses rule threshold and window when rule is provided', () => {
    const rule: CountryRule = { country: 'FR', threshold: 90, window: 180 };
    const status = computeCountryStatus('FR', [], rule, '2024-06-15');
    expect(status.threshold).toBe(90);
    expect(status.window).toBe(180);
    expect(status.isDefaultRule).toBe(false);
  });

  it('calculates daysPresent correctly from trips', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-10' },
    ];
    const status = computeCountryStatus('FR', trips, null, '2024-06-15');
    expect(status.daysPresent).toBe(10);
  });

  it('filters trips to only the specified country', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-10' },
      { country: 'DE', arrival: '2024-06-01', departure: '2024-06-10' },
    ];
    const status = computeCountryStatus('FR', trips, null, '2024-06-15');
    expect(status.daysPresent).toBe(10);
  });

  it('calculates daysRemaining as threshold minus daysPresent', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-10' },
    ];
    const status = computeCountryStatus('FR', trips, null, '2024-06-15');
    expect(status.daysRemaining).toBe(183 - 10);
  });

  it('clamps daysRemaining to 0 when daysPresent exceeds threshold', () => {
    const rule: CountryRule = { country: 'FR', threshold: 5, window: 365 };
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-15' },
    ];
    const status = computeCountryStatus('FR', trips, rule, '2024-06-15');
    expect(status.daysRemaining).toBe(0);
  });

  it('clamps percentage to 100 when daysPresent exceeds threshold', () => {
    const rule: CountryRule = { country: 'FR', threshold: 5, window: 365 };
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-15' },
    ];
    const status = computeCountryStatus('FR', trips, rule, '2024-06-15');
    expect(status.percentage).toBe(100);
  });

  it('calculates percentage correctly', () => {
    const rule: CountryRule = { country: 'FR', threshold: 100, window: 365 };
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-06', departure: '2024-06-15' },
    ];
    const status = computeCountryStatus('FR', trips, rule, '2024-06-15');
    expect(status.percentage).toBe(10); // 10/100 * 100 = 10%
  });

  it('includes country meta name and flag', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.name).toBe('France');
    expect(status.flag).toBe('🇫🇷');
  });

  it('sets windowStart and windowEnd correctly', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.windowEnd).toBe('2024-06-15');
    // 365 days window (inclusive): start is 364 days before 2024-06-15
    expect(status.windowStart).toBe('2023-06-17');
  });

  it('defaults referenceDate to today() when not provided', () => {
    vi.mocked(today).mockReturnValue('2024-06-15');
    const status = computeCountryStatus('FR', [], null);
    expect(status.windowEnd).toBe('2024-06-15');
  });

  it('handles trips with null departure using today', () => {
    vi.mocked(today).mockReturnValue('2024-06-15');
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-06-10', departure: null },
    ];
    const status = computeCountryStatus('FR', trips, null, '2024-06-15');
    expect(status.daysPresent).toBe(6); // June 10 through June 15
  });

  it('returns percentage of 0 when daysPresent is 0', () => {
    const status = computeCountryStatus('FR', [], null, '2024-06-15');
    expect(status.percentage).toBe(0);
  });
});

describe('validateTripDates', () => {
  it('returns valid for a valid arrival with no departure', () => {
    const result = validateTripDates('2024-06-01', null);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid for valid arrival and departure where departure is after arrival', () => {
    const result = validateTripDates('2024-06-01', '2024-06-15');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns valid when arrival equals departure (same day trip)', () => {
    const result = validateTripDates('2024-06-01', '2024-06-01');
    expect(result.valid).toBe(true);
  });

  it('returns invalid when departure is before arrival', () => {
    const result = validateTripDates('2024-06-15', '2024-06-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Departure date must be on or after arrival date.');
  });

  it('returns invalid for an invalid arrival date', () => {
    const result = validateTripDates('not-a-date', null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Arrival date is invalid.');
  });

  it('returns invalid for an invalid departure date', () => {
    const result = validateTripDates('2024-06-01', 'not-a-date');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Departure date is invalid.');
  });

  it('checks arrival validity before departure validity', () => {
    const result = validateTripDates('bad-date', 'also-bad');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Arrival date is invalid.');
  });
});

describe('validateNoOverlap', () => {
  beforeEach(() => {
    vi.mocked(today).mockReturnValue('2024-06-15');
  });

  const existingTrips: Trip[] = [
    { id: 'trip-1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-31' },
    { id: 'trip-2', country: 'DE', arrival: '2024-03-01', departure: '2024-03-31' },
  ];

  it('returns valid when new trip does not overlap any existing trip', () => {
    const newTrip = { arrival: '2024-02-01', departure: '2024-02-28', country: 'FR' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when new trip overlaps an existing trip', () => {
    const newTrip = { arrival: '2024-01-15', departure: '2024-02-15', country: 'ES' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('overlaps with an existing trip');
  });

  it('includes the overlapping country name in the error message', () => {
    const newTrip = { arrival: '2024-01-15', departure: '2024-02-15', country: 'ES' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.error).toContain('FR');
  });

  it('returns valid for empty existing trips', () => {
    const newTrip = { arrival: '2024-01-01', departure: '2024-12-31', country: 'FR' };
    const result = validateNoOverlap(newTrip, []);
    expect(result.valid).toBe(true);
  });

  it('excludes the trip being edited when editingId is provided', () => {
    const newTrip = { arrival: '2024-01-15', departure: '2024-01-20', country: 'FR' };
    const result = validateNoOverlap(newTrip, existingTrips, 'trip-1');
    expect(result.valid).toBe(true);
  });

  it('still checks other trips when editingId is provided', () => {
    const newTrip = { arrival: '2024-03-10', departure: '2024-03-20', country: 'FR' };
    const result = validateNoOverlap(newTrip, existingTrips, 'trip-1');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DE');
  });

  it('detects overlap when trips share exactly one boundary day', () => {
    const newTrip = { arrival: '2024-01-31', departure: '2024-02-15', country: 'ES' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(false);
  });

  it('returns valid when new trip ends exactly the day before existing trip starts', () => {
    const newTrip = { arrival: '2024-02-01', departure: '2024-02-29', country: 'ES' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(true);
  });

  it('handles null departure for new trip using today', () => {
    vi.mocked(today).mockReturnValue('2024-01-15');
    const newTrip = { arrival: '2024-01-10', departure: null, country: 'ES' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(false); // overlaps with trip-1 (Jan 1-31)
  });

  it('handles null departure for existing trip using today', () => {
    vi.mocked(today).mockReturnValue('2024-02-15');
    const tripsWithNull: Trip[] = [
      { id: 'trip-1', country: 'FR', arrival: '2024-01-01', departure: null },
    ];
    const newTrip = { arrival: '2024-02-01', departure: '2024-02-10', country: 'ES' };
    const result = validateNoOverlap(newTrip, tripsWithNull);
    expect(result.valid).toBe(false);
  });

  it('checks overlaps across different countries', () => {
    const newTrip = { arrival: '2024-03-15', departure: '2024-03-20', country: 'FR' };
    const result = validateNoOverlap(newTrip, existingTrips);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('DE');
  });

  it('returns valid when editingId does not match any trip', () => {
    const newTrip = { arrival: '2024-02-01', departure: '2024-02-28', country: 'FR' };
    const result = validateNoOverlap(newTrip, existingTrips, 'nonexistent-id');
    expect(result.valid).toBe(true);
  });
});

describe('integration: buildWindow + overlapDays + daysInWindow + computeCountryStatus', () => {
  beforeEach(() => {
    vi.mocked(today).mockReturnValue('2024-06-15');
  });

  it('computes consistent window boundaries across functions', () => {
    const ref = '2024-06-15';
    const windowDays = 90;
    const window = buildWindow(ref, windowDays);

    const trips: Trip[] = [
      { country: 'FR', arrival: window.start, departure: window.end },
    ];

    const days = daysInWindow(trips, window);
    expect(days).toBe(windowDays);
  });

  it('computeCountryStatus daysPresent matches manual daysInWindow calculation', () => {
    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-05-01', departure: '2024-05-31' },
      { country: 'FR', arrival: '2024-06-01', departure: '2024-06-10' },
    ];

    const ref = '2024-06-15';
    const rule: CountryRule = { country: 'FR', threshold: 183, window: 365 };
    const window = buildWindow(ref, 365);

    const manualDays = daysInWindow(
      trips.filter((t) => t.country === 'FR'),
      window
    );

    const status = computeCountryStatus('FR', trips, rule, ref);
    expect(status.daysPresent).toBe(manualDays);
  });

  it('a trip spanning the entire window contributes exactly windowDays days', () => {
    const rule: CountryRule = { country: 'FR', threshold: 183, window: 90 };
    const ref = '2024-06-15';
    const window = buildWindow(ref, 90);

    const trips: Trip[] = [
      { country: 'FR', arrival: '2024-01-01', departure: '2024-12-31' },
    ];

    const status = computeCountryStatus('FR', trips, rule, ref);
    expect(status.daysPresent).toBe(90);
  });
});