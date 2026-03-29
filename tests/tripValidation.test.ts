import { describe, it, expect } from "vitest";
import type { Trip } from "../src/db/types";
import type { TripFormValues } from "../src/trips/types";
import {
  validateTripDates,
  validateNoOverlap,
  validateTrip,
} from "../src/trips/tripValidation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormValues(arrival: string, departure: string): TripFormValues {
  return { arrival, departure } as TripFormValues;
}

function makeTrip(
  id: string,
  country: string,
  arrival: string,
  departure: string
): Trip {
  return { id, country, arrival, departure } as Trip;
}

// ---------------------------------------------------------------------------
// validateTripDates
// ---------------------------------------------------------------------------

describe("validateTripDates", () => {
  it("returns valid when arrival equals departure (same-day trip)", () => {
    const result = validateTripDates(makeFormValues("2024-06-01", "2024-06-01"));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns valid when departure is after arrival", () => {
    const result = validateTripDates(makeFormValues("2024-06-01", "2024-06-15"));
    expect(result.valid).toBe(true);
  });

  it("returns invalid when departure is before arrival", () => {
    const result = validateTripDates(makeFormValues("2024-06-15", "2024-06-01"));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/departure date must be on or after arrival/i);
  });

  it("returns invalid when arrival is missing", () => {
    const result = validateTripDates(makeFormValues("", "2024-06-15"));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("returns invalid when departure is missing", () => {
    const result = validateTripDates(makeFormValues("2024-06-01", ""));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("returns invalid when both dates are missing", () => {
    const result = validateTripDates(makeFormValues("", ""));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("returns invalid when arrival is null-like (undefined cast)", () => {
    const values = { arrival: undefined, departure: "2024-06-15" } as unknown as TripFormValues;
    const result = validateTripDates(values);
    expect(result.valid).toBe(false);
  });

  it("handles dates spanning year boundaries correctly", () => {
    const result = validateTripDates(makeFormValues("2023-12-28", "2024-01-03"));
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateNoOverlap
// ---------------------------------------------------------------------------

describe("validateNoOverlap", () => {
  const existingTrips: Trip[] = [
    makeTrip("trip-1", "France", "2024-06-10", "2024-06-20"),
    makeTrip("trip-2", "Germany", "2024-07-01", "2024-07-10"),
  ];

  it("returns valid when there are no existing trips", () => {
    const result = validateNoOverlap(makeFormValues("2024-06-01", "2024-06-05"), []);
    expect(result.valid).toBe(true);
  });

  it("returns valid when new trip is entirely before all existing trips", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-05-01", "2024-06-09"),
      existingTrips
    );
    expect(result.valid).toBe(true);
  });

  it("returns valid when new trip is entirely after all existing trips", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-07-11", "2024-07-20"),
      existingTrips
    );
    expect(result.valid).toBe(true);
  });

  it("returns valid when new trip fits exactly in the gap between existing trips", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-21", "2024-06-30"),
      existingTrips
    );
    expect(result.valid).toBe(true);
  });

  it("returns invalid when new trip completely contains an existing trip", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-05", "2024-06-25"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("returns invalid when new trip is completely contained within an existing trip", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-12", "2024-06-18"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("returns invalid when new trip overlaps the start of an existing trip", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-05", "2024-06-12"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("returns invalid when new trip overlaps the end of an existing trip", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-18", "2024-06-25"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("returns invalid when new trip shares only the arrival boundary with an existing trip", () => {
    // new arrival == existing departure → overlap by one day
    const result = validateNoOverlap(
      makeFormValues("2024-06-20", "2024-06-25"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("returns invalid when new trip shares only the departure boundary with an existing trip", () => {
    // new departure == existing arrival → overlap by one day
    const result = validateNoOverlap(
      makeFormValues("2024-06-05", "2024-06-10"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("France");
  });

  it("includes the conflicting trip details in the error message", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-06-12", "2024-06-18"),
      existingTrips
    );
    expect(result.error).toContain("France");
    expect(result.error).toContain("2024-06-10");
    expect(result.error).toContain("2024-06-20");
  });

  it("excludes the trip with the given excludeId from overlap check", () => {
    // The new values exactly match trip-1 — should be valid when editing trip-1
    const result = validateNoOverlap(
      makeFormValues("2024-06-10", "2024-06-20"),
      existingTrips,
      "trip-1"
    );
    expect(result.valid).toBe(true);
  });

  it("still detects overlap with other trips when excludeId is provided", () => {
    // Overlaps trip-2 but excludes trip-1
    const result = validateNoOverlap(
      makeFormValues("2024-07-05", "2024-07-15"),
      existingTrips,
      "trip-1"
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Germany");
  });

  it("returns valid when excludeId does not match any trip and no overlap exists", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-08-01", "2024-08-10"),
      existingTrips,
      "non-existent-id"
    );
    expect(result.valid).toBe(true);
  });

  it("returns valid when excludeId is undefined and no overlap exists", () => {
    const result = validateNoOverlap(
      makeFormValues("2024-08-01", "2024-08-10"),
      existingTrips,
      undefined
    );
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTrip (integration)
// ---------------------------------------------------------------------------

describe("validateTrip", () => {
  const existingTrips: Trip[] = [
    makeTrip("trip-1", "Spain", "2024-09-01", "2024-09-10"),
  ];

  it("returns valid for a well-formed trip with no overlap", () => {
    const result = validateTrip(
      makeFormValues("2024-09-15", "2024-09-20"),
      existingTrips
    );
    expect(result.valid).toBe(true);
  });

  it("returns date error before checking overlap when dates are missing", () => {
    const result = validateTrip(makeFormValues("", "2024-09-20"), existingTrips);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("returns date order error before checking overlap when departure precedes arrival", () => {
    const result = validateTrip(
      makeFormValues("2024-09-20", "2024-09-15"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/departure date must be on or after arrival/i);
  });

  it("returns overlap error when dates are valid but trip overlaps an existing one", () => {
    const result = validateTrip(
      makeFormValues("2024-09-05", "2024-09-15"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Spain");
  });

  it("respects excludeId when checking overlap (edit scenario)", () => {
    // Editing trip-1 with the same dates should be valid
    const result = validateTrip(
      makeFormValues("2024-09-01", "2024-09-10"),
      existingTrips,
      "trip-1"
    );
    expect(result.valid).toBe(true);
  });

  it("returns valid for a same-day trip that does not overlap", () => {
    const result = validateTrip(
      makeFormValues("2024-09-11", "2024-09-11"),
      existingTrips
    );
    expect(result.valid).toBe(true);
  });

  it("returns overlap error for a same-day trip that lands on an existing trip day", () => {
    const result = validateTrip(
      makeFormValues("2024-09-05", "2024-09-05"),
      existingTrips
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Spain");
  });

  it("returns valid when existing trips list is empty", () => {
    const result = validateTrip(makeFormValues("2024-09-01", "2024-09-10"), []);
    expect(result.valid).toBe(true);
  });
});