import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  today,
  parseDate,
  formatDate,
  formatDateShort,
  formatDateRange,
  toDateStr,
  tripDurationDays,
} from '../src/calculations/date-utils';

describe('today', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the current date in local timezone', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    expect(today()).toBe(`${year}-${month}-${day}`);
  });

  it('returns a different value when the date changes', () => {
    const fixedDate = new Date(2024, 5, 15); // June 15, 2024
    vi.setSystemTime(fixedDate);
    expect(today()).toBe('2024-06-15');
    vi.useRealTimers();
  });
});

describe('parseDate', () => {
  it('parses a standard YYYY-MM-DD string into a Date', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
  });

  it('parses the first day of a year', () => {
    const result = parseDate('2023-01-01');
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it('parses the last day of a year', () => {
    const result = parseDate('2023-12-31');
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11); // December
    expect(result.getDate()).toBe(31);
  });

  it('parses a leap day', () => {
    const result = parseDate('2024-02-29');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(29);
  });

  it('parses dates with leading zeros in month and day', () => {
    const result = parseDate('2024-03-05');
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(5);
  });
});

describe('formatDate', () => {
  it('formats a date string to "MMM D, YYYY" format', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('formats a date with a single-digit day', () => {
    expect(formatDate('2024-03-05')).toBe('Mar 5, 2024');
  });

  it('formats December 31st correctly', () => {
    expect(formatDate('2023-12-31')).toBe('Dec 31, 2023');
  });

  it('formats a date in a different year', () => {
    expect(formatDate('2000-06-01')).toBe('Jun 1, 2000');
  });

  it('formats February correctly', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('formats all months correctly', () => {
    const expected = [
      ['2024-01-01', 'Jan 1, 2024'],
      ['2024-02-01', 'Feb 1, 2024'],
      ['2024-03-01', 'Mar 1, 2024'],
      ['2024-04-01', 'Apr 1, 2024'],
      ['2024-05-01', 'May 1, 2024'],
      ['2024-06-01', 'Jun 1, 2024'],
      ['2024-07-01', 'Jul 1, 2024'],
      ['2024-08-01', 'Aug 1, 2024'],
      ['2024-09-01', 'Sep 1, 2024'],
      ['2024-10-01', 'Oct 1, 2024'],
      ['2024-11-01', 'Nov 1, 2024'],
      ['2024-12-01', 'Dec 1, 2024'],
    ];
    for (const [input, output] of expected) {
      expect(formatDate(input)).toBe(output);
    }
  });
});

describe('formatDateShort', () => {
  it('formats a date string to "MMM D" format without year', () => {
    expect(formatDateShort('2024-01-15')).toBe('Jan 15');
  });

  it('formats a single-digit day without padding', () => {
    expect(formatDateShort('2024-03-05')).toBe('Mar 5');
  });

  it('formats December 31st correctly', () => {
    expect(formatDateShort('2023-12-31')).toBe('Dec 31');
  });

  it('does not include the year', () => {
    const result = formatDateShort('2024-06-15');
    expect(result).not.toContain('2024');
  });

  it('formats February 29 on a leap year', () => {
    expect(formatDateShort('2024-02-29')).toBe('Feb 29');
  });
});

describe('formatDateRange', () => {
  describe('with null departure (ongoing trip)', () => {
    it('formats as "MMM D, YYYY – present" when departure is null', () => {
      expect(formatDateRange('2024-06-15', null)).toBe('Jun 15, 2024 – present');
    });

    it('includes the arrival year in the output', () => {
      const result = formatDateRange('2023-11-01', null);
      expect(result).toContain('2023');
      expect(result).toContain('present');
    });

    it('formats single-digit day correctly for ongoing trip', () => {
      expect(formatDateRange('2024-03-05', null)).toBe('Mar 5, 2024 – present');
    });
  });

  describe('with same-year arrival and departure', () => {
    it('formats as "MMM D – MMM D, YYYY" when both dates are in the same year', () => {
      expect(formatDateRange('2024-01-15', '2024-02-03')).toBe('Jan 15 – Feb 3, 2024');
    });

    it('handles same month, same year', () => {
      expect(formatDateRange('2024-06-01', '2024-06-30')).toBe('Jun 1 – Jun 30, 2024');
    });

    it('handles same day arrival and departure in same year', () => {
      expect(formatDateRange('2024-06-15', '2024-06-15')).toBe('Jun 15 – Jun 15, 2024');
    });

    it('handles start and end of same year', () => {
      expect(formatDateRange('2024-01-01', '2024-12-31')).toBe('Jan 1 – Dec 31, 2024');
    });
  });

  describe('with different-year arrival and departure', () => {
    it('formats as "MMM D, YYYY – MMM D, YYYY" when years differ', () => {
      expect(formatDateRange('2023-12-15', '2024-01-10')).toBe(
        'Dec 15, 2023 – Jan 10, 2024'
      );
    });

    it('handles multi-year trips', () => {
      expect(formatDateRange('2022-06-01', '2024-06-01')).toBe('Jun 1, 2022 – Jun 1, 2024');
    });

    it('handles year boundary crossing', () => {
      expect(formatDateRange('2023-12-31', '2024-01-01')).toBe('Dec 31, 2023 – Jan 1, 2024');
    });
  });
});

describe('toDateStr', () => {
  it('serialises a Date to YYYY-MM-DD format', () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    expect(toDateStr(date)).toBe('2024-01-15');
  });

  it('pads month and day with leading zeros', () => {
    const date = new Date(2024, 2, 5); // March 5, 2024
    expect(toDateStr(date)).toBe('2024-03-05');
  });

  it('handles December 31st', () => {
    const date = new Date(2023, 11, 31); // December 31, 2023
    expect(toDateStr(date)).toBe('2023-12-31');
  });

  it('handles January 1st', () => {
    const date = new Date(2024, 0, 1); // January 1, 2024
    expect(toDateStr(date)).toBe('2024-01-01');
  });

  it('is the inverse of parseDate', () => {
    const dateStr = '2024-06-15';
    expect(toDateStr(parseDate(dateStr))).toBe(dateStr);
  });

  it('round-trips correctly for multiple dates', () => {
    const dates = ['2024-01-01', '2024-06-15', '2023-12-31', '2024-02-29'];
    for (const d of dates) {
      expect(toDateStr(parseDate(d))).toBe(d);
    }
  });
});

describe('tripDurationDays', () => {
  it('returns 1 for a single-day trip (same arrival and departure)', () => {
    expect(tripDurationDays('2024-06-15', '2024-06-15')).toBe(1);
  });

  it('returns 2 for a two-day trip', () => {
    expect(tripDurationDays('2024-06-15', '2024-06-16')).toBe(2);
  });

  it('returns correct count for a multi-day trip', () => {
    expect(tripDurationDays('2024-01-01', '2024-01-31')).toBe(31);
  });

  it('returns correct count spanning months', () => {
    expect(tripDurationDays('2024-01-30', '2024-02-02')).toBe(4);
  });

  it('returns correct count spanning years', () => {
    expect(tripDurationDays('2023-12-30', '2024-01-02')).toBe(4);
  });

  describe('with null departure (ongoing trip)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('uses today as the end date when departure is null', () => {
      vi.setSystemTime(new Date(2024, 5, 20)); // June 20, 2024
      expect(tripDurationDays('2024-06-15', null)).toBe(6);
    });

    it('returns 1 when arrival is today and departure is null', () => {
      vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
      expect(tripDurationDays('2024-06-15', null)).toBe(1);
    });

    it('returns correct count for a long ongoing trip', () => {
      vi.setSystemTime(new Date(2024, 11, 31)); // December 31, 2024
      expect(tripDurationDays('2024-01-01', null)).toBe(366); // 2024 is a leap year
    });
  });

  it('handles leap year correctly', () => {
    // Feb 28 to Mar 1 in a leap year = 2 days
    expect(tripDurationDays('2024-02-28', '2024-03-01')).toBe(3);
  });

  it('handles leap day as arrival', () => {
    expect(tripDurationDays('2024-02-29', '2024-02-29')).toBe(1);
  });
});

describe('parseDate and toDateStr round-trip', () => {
  it('parseDate followed by toDateStr returns the original string', () => {
    const dateStr = '2024-06-15';
    expect(toDateStr(parseDate(dateStr))).toBe(dateStr);
  });

  it('handles edge dates in round-trip', () => {
    const edgeDates = ['2000-01-01', '1999-12-31', '2024-02-29', '2023-12-31'];
    for (const d of edgeDates) {
      expect(toDateStr(parseDate(d))).toBe(d);
    }
  });
});