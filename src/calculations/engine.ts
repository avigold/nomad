import { addDays, differenceInDays, max, min } from 'date-fns';
import { getCountryMeta } from './countries';
import { today, parseDate, toDateStr } from './date-utils';
import { DateWindow, CountryStatus } from './types';

export interface Trip {
  id?: string;
  country: string;
  arrival: string;
  departure: string | null;
}

export interface CountryRule {
  country: string;
  threshold: number;
  window: number;
}

export function buildWindow(referenceDate: string, windowDays: number): DateWindow {
  const end = parseDate(referenceDate);
  const start = addDays(end, -(windowDays - 1));
  return { start: toDateStr(start), end: referenceDate };
}

export function overlapDays(arrival: string, departure: string, window: DateWindow): number {
  const arrivalDate = parseDate(arrival);
  const departureDate = parseDate(departure);
  const windowStart = parseDate(window.start);
  const windowEnd = parseDate(window.end);

  const overlapStart = max([arrivalDate, windowStart]);
  const overlapEnd = min([departureDate, windowEnd]);

  if (overlapEnd < overlapStart) {
    return 0;
  }

  return differenceInDays(overlapEnd, overlapStart) + 1;
}

export function daysInWindow(trips: Trip[], window: DateWindow): number {
  const todayStr = today();
  return trips.reduce((sum, trip) => {
    const departure = trip.departure ?? todayStr;
    return sum + overlapDays(trip.arrival, departure, window);
  }, 0);
}

export function computeCountryStatus(
  country: string,
  trips: Trip[],
  rule: CountryRule | null,
  referenceDate?: string
): CountryStatus {
  const ref = referenceDate ?? today();
  const threshold = rule?.threshold ?? 183;
  const windowDays = rule?.window ?? 365;
  const isDefaultRule = rule === null;

  const window = buildWindow(ref, windowDays);
  const countryTrips = trips.filter((t) => t.country === country);
  const daysPresent = daysInWindow(countryTrips, window);
  const daysRemaining = Math.max(0, threshold - daysPresent);
  const percentage = Math.min(100, Math.round((daysPresent / threshold) * 100));

  const meta = getCountryMeta(country);

  return {
    country,
    name: meta.name,
    flag: meta.flag,
    daysPresent,
    threshold,
    window: windowDays,
    daysRemaining,
    percentage,
    windowStart: window.start,
    windowEnd: window.end,
    isDefaultRule,
  };
}

export function validateTripDates(
  arrival: string,
  departure: string | null
): { valid: boolean; error?: string } {
  const arrivalDate = parseDate(arrival);
  if (isNaN(arrivalDate.getTime())) {
    return { valid: false, error: 'Arrival date is invalid.' };
  }

  if (departure !== null) {
    const departureDate = parseDate(departure);
    if (isNaN(departureDate.getTime())) {
      return { valid: false, error: 'Departure date is invalid.' };
    }
    if (departureDate < arrivalDate) {
      return { valid: false, error: 'Departure date must be on or after arrival date.' };
    }
  }

  return { valid: true };
}

export function validateNoOverlap(
  newTrip: { arrival: string; departure: string | null; country: string },
  existingTrips: Trip[],
  editingId?: string
): { valid: boolean; error?: string } {
  const todayStr = today();
  const newArrival = parseDate(newTrip.arrival);
  const newDeparture = parseDate(newTrip.departure ?? todayStr);

  for (const trip of existingTrips) {
    if (editingId !== undefined && trip.id === editingId) {
      continue;
    }

    const tripArrival = parseDate(trip.arrival);
    const tripDeparture = parseDate(trip.departure ?? todayStr);

    const overlapStart = max([newArrival, tripArrival]);
    const overlapEnd = min([newDeparture, tripDeparture]);

    if (overlapEnd >= overlapStart) {
      return {
        valid: false,
        error: `This trip overlaps with an existing trip to ${trip.country}.`,
      };
    }
  }

  return { valid: true };
}