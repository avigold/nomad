import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildExportFilename, exportTripsToJSON, parseImportFile } from "../src/trips/tripIO";
import type { Trip } from "../src/db/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    country: "France",
    arrival: "2024-03-01",
    departure: "2024-03-10",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildExportFilename
// ---------------------------------------------------------------------------

describe("buildExportFilename", () => {
  it("returns a filename with the correct prefix and .json extension", () => {
    const filename = buildExportFilename();
    expect(filename).toMatch(/^trips-export-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("uses the current date in YYYY-MM-DD format", () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    expect(buildExportFilename()).toBe(`trips-export-${yyyy}-${mm}-${dd}.json`);
  });

  it("zero-pads single-digit months and days", () => {
    // Fake a date where month and day are single digits (January 5th)
    const fakeDate = new Date(2024, 0, 5); // Jan 5 2024
    vi.setSystemTime(fakeDate);
    expect(buildExportFilename()).toBe("trips-export-2024-01-05.json");
    vi.useRealTimers();
  });

  it("handles end-of-year dates correctly", () => {
    vi.setSystemTime(new Date(2023, 11, 31)); // Dec 31 2023
    expect(buildExportFilename()).toBe("trips-export-2023-12-31.json");
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// exportTripsToJSON
// ---------------------------------------------------------------------------

describe("exportTripsToJSON", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let anchorClickMock: ReturnType<typeof vi.fn>;
  let capturedBlob: Blob | null = null;

  beforeEach(() => {
    anchorClickMock = vi.fn();
    capturedBlob = null;

    createObjectURLMock = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    });
    revokeObjectURLMock = vi.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const fakeAnchor = {
      href: "",
      download: "",
      click: anchorClickMock,
    };

    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(fakeAnchor as unknown as HTMLElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a Blob and triggers a download anchor click", () => {
    exportTripsToJSON([makeTrip()]);
    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(anchorClickMock).toHaveBeenCalledOnce();
  });

  it("revokes the object URL after clicking", () => {
    exportTripsToJSON([makeTrip()]);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
  });

  it("sets the anchor download attribute to the expected filename", () => {
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15 2024
    const fakeAnchor = { href: "", download: "", click: anchorClickMock };
    createElementSpy.mockReturnValue(fakeAnchor as unknown as HTMLElement);

    exportTripsToJSON([makeTrip()]);

    expect(fakeAnchor.download).toBe("trips-export-2024-06-15.json");
    vi.useRealTimers();
  });

  it("sets the anchor href to the created object URL", () => {
    const fakeAnchor = { href: "", download: "", click: anchorClickMock };
    createElementSpy.mockReturnValue(fakeAnchor as unknown as HTMLElement);

    exportTripsToJSON([makeTrip()]);

    expect(fakeAnchor.href).toBe("blob:mock-url");
  });

  it("serialises all trips into the JSON payload", async () => {
    const trips = [
      makeTrip({ id: "a", country: "Germany" }),
      makeTrip({ id: "b", country: "Spain" }),
    ];

    exportTripsToJSON(trips);

    expect(capturedBlob).not.toBeNull();
    const text = await (capturedBlob as Blob).text();
    const payload = JSON.parse(text);

    expect(payload.version).toBe(1);
    expect(payload.trips).toHaveLength(2);
    expect(payload.trips[0].country).toBe("Germany");
    expect(payload.trips[1].country).toBe("Spain");
  });

  it("includes an exportedAt ISO timestamp in the payload", async () => {
    exportTripsToJSON([]);

    const text = await (capturedBlob as unknown as Blob).text();
    const payload = JSON.parse(text);

    expect(typeof payload.exportedAt).toBe("string");
    expect(() => new Date(payload.exportedAt)).not.toThrow();
    expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt);
  });

  it("works with an empty trips array", async () => {
    exportTripsToJSON([]);

    const text = await (capturedBlob as unknown as Blob).text();
    const payload = JSON.parse(text);

    expect(payload.trips).toEqual([]);
  });

  it("creates a Blob with application/json MIME type", () => {
    exportTripsToJSON([makeTrip()]);
    expect(capturedBlob).not.toBeNull();
    expect((capturedBlob as Blob).type).toBe("application/json");
  });

  it("creates an anchor element via document.createElement", () => {
    exportTripsToJSON([makeTrip()]);
    expect(createElementSpy).toHaveBeenCalledWith("a");
  });
});

// ---------------------------------------------------------------------------
// parseImportFile
// ---------------------------------------------------------------------------

describe("parseImportFile", () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("parses a valid export payload and returns trips", () => {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        trips: [makeTrip()],
      };
      const result = parseImportFile(JSON.stringify(payload));

      expect(result.error).toBeUndefined();
      expect(result.trips).toHaveLength(1);
      expect(result.trips[0]).toEqual(makeTrip());
    });

    it("returns multiple trips when all are valid", () => {
      const trips = [
        makeTrip({ id: "1", country: "France" }),
        makeTrip({ id: "2", country: "Italy", arrival: "2024-05-01", departure: "2024-05-10" }),
      ];
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips };
      const result = parseImportFile(JSON.stringify(payload));

      expect(result.error).toBeUndefined();
      expect(result.trips).toHaveLength(2);
    });

    it("returns an empty trips array when trips list is empty", () => {
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: [] };
      const result = parseImportFile(JSON.stringify(payload));

      expect(result.error).toBeUndefined();
      expect(result.trips).toEqual([]);
    });

    it("only includes id, country, arrival, departure on each trip (strips extra fields)", () => {
      const tripWithExtra = { ...makeTrip(), extraField: "should-be-stripped" };
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: [tripWithExtra] };
      const result = parseImportFile(JSON.stringify(payload));

      expect(result.error).toBeUndefined();
      expect(result.trips[0]).toEqual(makeTrip());
      expect((result.trips[0] as Record<string, unknown>).extraField).toBeUndefined();
    });

    it("accepts a trip where arrival equals departure (same-day trip)", () => {
      const trip = makeTrip({ arrival: "2024-06-01", departure: "2024-06-01" });
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: [trip] };
      const result = parseImportFile(JSON.stringify(payload));

      expect(result.error).toBeUndefined();
      expect(result.trips).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // JSON parsing errors
  // -------------------------------------------------------------------------

  describe("JSON parsing errors", () => {
    it("returns an error for completely invalid JSON", () => {
      const result = parseImportFile("not json at all");
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid JSON file.");
    });

    it("returns an error for an empty string", () => {
      const result = parseImportFile("");
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid JSON file.");
    });

    it("returns an error for truncated JSON", () => {
      const result = parseImportFile('{"version": 1, "trips": [');
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid JSON file.");
    });
  });

  // -------------------------------------------------------------------------
  // Top-level structure errors
  // -------------------------------------------------------------------------

  describe("top-level structure validation", () => {
    it("returns an error when the root is a JSON array", () => {
      const result = parseImportFile(JSON.stringify([]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: expected a JSON object.");
    });

    it("returns an error when the root is a JSON string", () => {
      const result = parseImportFile(JSON.stringify("hello"));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: expected a JSON object.");
    });

    it("returns an error when the root is a JSON number", () => {
      const result = parseImportFile(JSON.stringify(42));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: expected a JSON object.");
    });

    it("returns an error when the root is null", () => {
      const result = parseImportFile(JSON.stringify(null));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: expected a JSON object.");
    });
  });

  // -------------------------------------------------------------------------
  // Version validation
  // -------------------------------------------------------------------------

  describe("version validation", () => {
    it("returns an error for version 2", () => {
      const payload = { version: 2, exportedAt: new Date().toISOString(), trips: [] };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Unsupported export version: 2.");
    });

    it("returns an error for version 0", () => {
      const payload = { version: 0, exportedAt: new Date().toISOString(), trips: [] };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toContain("Unsupported export version: 0.");
    });

    it("returns an error when version is a string '1'", () => {
      const payload = { version: "1", exportedAt: new Date().toISOString(), trips: [] };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toContain("Unsupported export version");
    });

    it("returns an error when version is missing", () => {
      const payload = { exportedAt: new Date().toISOString(), trips: [] };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toContain("Unsupported export version");
    });
  });

  // -------------------------------------------------------------------------
  // trips array validation
  // -------------------------------------------------------------------------

  describe("trips array validation", () => {
    it("returns an error when trips is not an array", () => {
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: {} };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: trips must be an array.");
    });

    it("returns an error when trips is a string", () => {
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: "oops" };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: trips must be an array.");
    });

    it("returns an error when trips is null", () => {
      const payload = { version: 1, exportedAt: new Date().toISOString(), trips: null };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: trips must be an array.");
    });

    it("returns an error when trips key is missing", () => {
      const payload = { version: 1, exportedAt: new Date().toISOString() };
      const result = parseImportFile(JSON.stringify(payload));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Invalid file format: trips must be an array.");
    });
  });

  // -------------------------------------------------------------------------
  // Individual trip validation
  // -------------------------------------------------------------------------

  describe("individual trip validation", () => {
    function payloadWithTrips(trips: unknown[]) {
      return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), trips });
    }

    it("returns an error when a trip is a primitive (string)", () => {
      const result = parseImportFile(payloadWithTrips(["not-an-object"]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is not a valid object.");
    });

    it("returns an error when a trip is null", () => {
      const result = parseImportFile(payloadWithTrips([null]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is not a valid object.");
    });

    it("returns an error when a trip is an array", () => {
      const result = parseImportFile(payloadWithTrips([[1, 2, 3]]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is not a valid object.");
    });

    it("reports the correct index for an invalid trip", () => {
      const trips = [makeTrip({ id: "a" }), makeTrip({ id: "b" }), "bad"];
      const result = parseImportFile(payloadWithTrips(trips));
      expect(result.error).toBe("Trip at index 2 is not a valid object.");
    });

    // id validation
    it("returns an error when trip id is missing", () => {
      const { id: _id, ...noId } = makeTrip();
      const result = parseImportFile(payloadWithTrips([noId]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid id.");
    });

    it("returns an error when trip id is an empty string", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ id: "" })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid id.");
    });

    it("returns an error when trip id is whitespace only", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ id: "   " })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid id.");
    });

    it("returns an error when trip id is a number", () => {
      const trip = { ...makeTrip(), id: 123 };
      const result = parseImportFile(payloadWithTrips([trip]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid id.");
    });

    // country validation
    it("returns an error when trip country is missing", () => {
      const { country: _country, ...noCountry } = makeTrip();
      const result = parseImportFile(payloadWithTrips([noCountry]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid country.");
    });

    it("returns an error when trip country is an empty string", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ country: "" })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid country.");
    });

    it("returns an error when trip country is whitespace only", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ country: "  " })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 is missing a valid country.");
    });

    // arrival validation
    it("returns an error when arrival is missing", () => {
      const { arrival: _arrival, ...noArrival } = makeTrip();
      const result = parseImportFile(payloadWithTrips([noArrival]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid arrival date.");
    });

    it("returns an error when arrival is not a date string", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ arrival: "not-a-date" })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid arrival date.");
    });

    it("returns an error when arrival is in wrong format (DD-MM-YYYY)", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ arrival: "01-03-2024" })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid arrival date.");
    });

    it("returns an error when arrival is a number", () => {
      const trip = { ...makeTrip(), arrival: 20240301 };
      const result = parseImportFile(payloadWithTrips([trip]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid arrival date.");
    });

    // departure validation
    it("returns an error when departure is missing", () => {
      const { departure: _departure, ...noDeparture } = makeTrip();
      const result = parseImportFile(payloadWithTrips([noDeparture]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid departure date.");
    });

    it("returns an error when departure is not a date string", () => {
      const result = parseImportFile(payloadWithTrips([makeTrip({ departure: "tomorrow" })]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid departure date.");
    });

    it("returns an error when departure is in wrong format (MM/DD/YYYY)", () => {
      const result = parseImportFile(
        payloadWithTrips([makeTrip({ departure: "03/10/2024" })])
      );
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 0 has an invalid departure date.");
    });

    // departure before arrival
    it("returns an error when departure is before arrival", () => {
      const trip = makeTrip({ arrival: "2024-06-10", departure: "2024-06-05" });
      const result = parseImportFile(payloadWithTrips([trip]));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe(
        "Trip at index 0 has a departure date before its arrival date."
      );
    });

    it("returns an error for the correct index when a later trip has departure before arrival", () => {
      const validTrip = makeTrip({ id: "a" });
      const invalidTrip = makeTrip({
        id: "b",
        arrival: "2024-08-20",
        departure: "2024-08-01",
      });
      const result = parseImportFile(payloadWithTrips([validTrip, invalidTrip]));
      expect(result.error).toBe(
        "Trip at index 1 has a departure date before its arrival date."
      );
    });

    it("stops at the first invalid trip and returns empty trips array", () => {
      const trips = [
        makeTrip({ id: "a" }),
        makeTrip({ id: "" }), // invalid
        makeTrip({ id: "c" }),
      ];
      const result = parseImportFile(payloadWithTrips(trips));
      expect(result.trips).toEqual([]);
      expect(result.error).toBe("Trip at index 1 is missing a valid id.");
    });
  });

  // -------------------------------------------------------------------------
  // Integration: round-trip with exportTripsToJSON
  // -------------------------------------------------------------------------

  describe("round-trip integration", () => {
    it("parseImportFile can reconstruct trips serialised by exportTripsToJSON", async () => {
      const trips: Trip[] = [
        makeTrip({ id: "rt-1", country: "Japan", arrival: "2024-09-01", departure: "2024-09-15" }),
        makeTrip({ id: "rt-2", country: "Brazil", arrival: "2024-11-10", departure: "2024-11-20" }),
      ];

      let capturedBlob: Blob | null = null;
      global.URL.createObjectURL = vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return "blob:mock";
      });
      global.URL.revokeObjectURL = vi.fn();

      const fakeAnchor = { href: "", download: "", click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValue(
        fakeAnchor as unknown as HTMLElement
      );

      exportTripsToJSON(trips);

      const raw = await (capturedBlob as unknown as Blob).text();
      const result = parseImportFile(raw);

      expect(result.error).toBeUndefined();
      expect(result.trips).toEqual(trips);

      vi.restoreAllMocks();
    });
  });
});