import type { Trip } from "../db/types";
import type { TripFormValues, ValidationResult } from "./types";

export function validateTripDates(values: TripFormValues): ValidationResult {
  const { arrival, departure } = values;

  if (!arrival || !departure) {
    return { valid: false, error: "Arrival and departure dates are required." };
  }

  if (departure < arrival) {
    return { valid: false, error: "Departure date must be on or after arrival date." };
  }

  return { valid: true };
}

export function validateNoOverlap(
  values: TripFormValues,
  existingTrips: Trip[],
  excludeId?: string
): ValidationResult {
  const { arrival, departure } = values;

  const trips = excludeId
    ? existingTrips.filter((t) => t.id !== excludeId)
    : existingTrips;

  for (const trip of trips) {
    // Two date ranges [a1, d1] and [a2, d2] overlap if a1 <= d2 && a2 <= d1
    if (arrival <= trip.departure && trip.arrival <= departure) {
      return {
        valid: false,
        error: `This trip overlaps with an existing trip to ${trip.country} (${trip.arrival} – ${trip.departure}).`,
      };
    }
  }

  return { valid: true };
}

export function validateTrip(
  values: TripFormValues,
  existingTrips: Trip[],
  excludeId?: string
): ValidationResult {
  const datesResult = validateTripDates(values);
  if (!datesResult.valid) {
    return datesResult;
  }

  return validateNoOverlap(values, existingTrips, excludeId);
}