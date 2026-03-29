import { describe, it, expectTypeOf } from "vitest";
import type { TripFormValues, ValidationResult, ExportPayload } from "../src/trips/types";
import type { Trip } from "../src/db/types";

describe("TripFormValues type", () => {
  it("accepts a valid TripFormValues object with all required string fields", () => {
    const formValues: TripFormValues = {
      country: "France",
      arrival: "2024-03-01",
      departure: "2024-03-15",
    };

    expectTypeOf(formValues).toMatchTypeOf<TripFormValues>();
    expectTypeOf(formValues.country).toBeString();
    expectTypeOf(formValues.arrival).toBeString();
    expectTypeOf(formValues.departure).toBeString();
  });

  it("accepts empty strings for all fields", () => {
    const formValues: TripFormValues = {
      country: "",
      arrival: "",
      departure: "",
    };

    expectTypeOf(formValues).toMatchTypeOf<TripFormValues>();
  });

  it("has exactly the required fields: country, arrival, departure", () => {
    expectTypeOf<TripFormValues>().toHaveProperty("country");
    expectTypeOf<TripFormValues>().toHaveProperty("arrival");
    expectTypeOf<TripFormValues>().toHaveProperty("departure");
  });

  it("country field is of type string", () => {
    expectTypeOf<TripFormValues["country"]>().toBeString();
  });

  it("arrival field is of type string", () => {
    expectTypeOf<TripFormValues["arrival"]>().toBeString();
  });

  it("departure field is of type string", () => {
    expectTypeOf<TripFormValues["departure"]>().toBeString();
  });
});

describe("ValidationResult type", () => {
  it("accepts a valid result with valid=true and no error", () => {
    const result: ValidationResult = {
      valid: true,
    };

    expectTypeOf(result).toMatchTypeOf<ValidationResult>();
    expectTypeOf(result.valid).toBeBoolean();
  });

  it("accepts a valid result with valid=false and an error message", () => {
    const result: ValidationResult = {
      valid: false,
      error: "Departure must be after arrival",
    };

    expectTypeOf(result).toMatchTypeOf<ValidationResult>();
    expectTypeOf(result.valid).toBeBoolean();
    expectTypeOf(result.error).toEqualTypeOf<string | undefined>();
  });

  it("accepts a valid result with valid=true and an optional error field present", () => {
    const result: ValidationResult = {
      valid: true,
      error: undefined,
    };

    expectTypeOf(result).toMatchTypeOf<ValidationResult>();
  });

  it("valid field is of type boolean", () => {
    expectTypeOf<ValidationResult["valid"]>().toBeBoolean();
  });

  it("error field is optional and of type string or undefined", () => {
    expectTypeOf<ValidationResult["error"]>().toEqualTypeOf<string | undefined>();
  });

  it("represents a successful validation result at runtime", () => {
    const successResult: ValidationResult = { valid: true };
    const value = successResult.valid;
    // Verify runtime value
    if (value !== true && value !== false) {
      throw new Error("valid should be boolean");
    }
  });

  it("represents a failed validation result at runtime", () => {
    const failResult: ValidationResult = {
      valid: false,
      error: "Country is required",
    };

    if (typeof failResult.valid !== "boolean") {
      throw new Error("valid should be boolean");
    }
    if (typeof failResult.error !== "string") {
      throw new Error("error should be string when provided");
    }
  });
});

describe("ExportPayload type", () => {
  it("accepts a valid ExportPayload with all required fields", () => {
    const trip: Trip = {
      id: "abc-123",
      country: "Germany",
      arrival: "2024-01-10",
      departure: "2024-01-20",
    };

    const payload: ExportPayload = {
      version: 1,
      exportedAt: "2024-06-01T12:00:00.000Z",
      trips: [trip],
    };

    expectTypeOf(payload).toMatchTypeOf<ExportPayload>();
  });

  it("accepts an ExportPayload with an empty trips array", () => {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: "2024-06-01T12:00:00.000Z",
      trips: [],
    };

    expectTypeOf(payload).toMatchTypeOf<ExportPayload>();
    expectTypeOf(payload.trips).toEqualTypeOf<Trip[]>();
  });

  it("accepts an ExportPayload with multiple trips", () => {
    const trips: Trip[] = [
      {
        id: "trip-1",
        country: "Spain",
        arrival: "2024-02-01",
        departure: "2024-02-10",
      },
      {
        id: "trip-2",
        country: "Italy",
        arrival: "2024-03-05",
        departure: "2024-03-20",
      },
    ];

    const payload: ExportPayload = {
      version: 2,
      exportedAt: "2024-06-15T08:30:00.000Z",
      trips,
    };

    expectTypeOf(payload).toMatchTypeOf<ExportPayload>();
  });

  it("version field is of type number", () => {
    expectTypeOf<ExportPayload["version"]>().toBeNumber();
  });

  it("exportedAt field is of type string", () => {
    expectTypeOf<ExportPayload["exportedAt"]>().toBeString();
  });

  it("trips field is of type Trip array", () => {
    expectTypeOf<ExportPayload["trips"]>().toEqualTypeOf<Trip[]>();
  });

  it("has exactly the required fields: version, exportedAt, trips", () => {
    expectTypeOf<ExportPayload>().toHaveProperty("version");
    expectTypeOf<ExportPayload>().toHaveProperty("exportedAt");
    expectTypeOf<ExportPayload>().toHaveProperty("trips");
  });

  it("accepts version as zero", () => {
    const payload: ExportPayload = {
      version: 0,
      exportedAt: "2024-01-01T00:00:00.000Z",
      trips: [],
    };

    expectTypeOf(payload.version).toBeNumber();
  });

  it("accepts large version numbers", () => {
    const payload: ExportPayload = {
      version: 999,
      exportedAt: "2024-01-01T00:00:00.000Z",
      trips: [],
    };

    expectTypeOf(payload.version).toBeNumber();
  });

  it("runtime values are correctly structured", () => {
    const trip: Trip = {
      id: "runtime-test",
      country: "Portugal",
      arrival: "2024-04-01",
      departure: "2024-04-14",
    };

    const payload: ExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      trips: [trip],
    };

    if (typeof payload.version !== "number") {
      throw new Error("version should be a number");
    }
    if (typeof payload.exportedAt !== "string") {
      throw new Error("exportedAt should be a string");
    }
    if (!Array.isArray(payload.trips)) {
      throw new Error("trips should be an array");
    }
    if (payload.trips.length !== 1) {
      throw new Error("trips should contain one item");
    }
  });
});

describe("Type compatibility and interoperability", () => {
  it("TripFormValues can be used to construct a partial Trip-like object", () => {
    const formValues: TripFormValues = {
      country: "Netherlands",
      arrival: "2024-05-01",
      departure: "2024-05-10",
    };

    const tripLike = {
      id: "new-id",
      ...formValues,
    };

    expectTypeOf(tripLike.country).toBeString();
    expectTypeOf(tripLike.arrival).toBeString();
    expectTypeOf(tripLike.departure).toBeString();
    expectTypeOf(tripLike.id).toBeString();
  });

  it("ValidationResult with valid=false should carry an error message", () => {
    const result: ValidationResult = {
      valid: false,
      error: "Arrival date is required",
    };

    if (!result.error) {
      throw new Error("Expected error to be defined for invalid result");
    }
    if (result.valid !== false) {
      throw new Error("Expected valid to be false");
    }
  });

  it("ExportPayload trips array elements conform to Trip type", () => {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: "2024-06-01T00:00:00.000Z",
      trips: [
        {
          id: "t1",
          country: "Belgium",
          arrival: "2024-07-01",
          departure: "2024-07-07",
        },
      ],
    };

    const firstTrip = payload.trips[0];
    expectTypeOf(firstTrip).toMatchTypeOf<Trip>();
  });
});