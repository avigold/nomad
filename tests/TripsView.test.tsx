import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TripsView } from "../src/trips/TripsView";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn(),
}));

vi.mock("../src/db/database", () => ({
  db: {
    trips: {
      toArray: vi.fn(),
      bulkPut: vi.fn(),
    },
  },
}));

vi.mock("../src/db/tripOperations", () => ({
  addTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
}));

vi.mock("../src/trips/TripForm", () => ({
  TripForm: ({
    initialValues,
    editingId,
    onSave,
    onCancel,
  }: {
    initialValues?: { country: string; arrival: string; departure: string };
    editingId?: string;
    existingTrips: any[];
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="trip-form" data-editing-id={editingId ?? "null"}>
      <button onClick={onSave}>Save Form</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));

vi.mock("../src/trips/TripRow", () => ({
  TripRow: ({
    trip,
    onEdit,
    onDelete,
  }: {
    trip: { id: string; country: string; arrival: string; departure: string | null };
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid={`trip-row-${trip.id}`}>
      <span>{trip.country}</span>
      <button onClick={() => onEdit(trip.id)}>Edit {trip.country}</button>
      <button onClick={() => onDelete(trip.id)}>Delete {trip.country}</button>
    </div>
  ),
}));

vi.mock("../src/trips/tripIO", () => ({
  exportTripsToJSON: vi.fn(),
  parseImportFile: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../src/db/database";
import { deleteTrip } from "../src/db/tripOperations";
import { exportTripsToJSON, parseImportFile } from "../src/trips/tripIO";
import type { Trip } from "../src/db/types";

const mockUseLiveQuery = vi.mocked(useLiveQuery);
const mockExportTripsToJSON = vi.mocked(exportTripsToJSON);
const mockParseImportFile = vi.mocked(parseImportFile);
const mockDeleteTrip = vi.mocked(deleteTrip);
const mockDbTrips = vi.mocked(db.trips);

const sampleTrips: Trip[] = [
  { id: "1", country: "FR", arrival: "2024-03-01", departure: "2024-03-10" },
  { id: "2", country: "DE", arrival: "2024-01-15", departure: "2024-01-20" },
  { id: "3", country: "ES", arrival: "2024-06-01", departure: "2024-06-15" },
];

function setupLiveQuery(trips: Trip[] | undefined) {
  mockUseLiveQuery.mockImplementation(() => {
    return trips;
  });
}

function createMockFile(content: string, name = "trips.json"): File {
  return new File([content], name, { type: "application/json" });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TripsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteTrip.mockResolvedValue(undefined);
    mockDbTrips.bulkPut = vi.fn().mockResolvedValue(undefined) as any;
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("shows loading message when trips are undefined", () => {
      setupLiveQuery(undefined);
      render(<TripsView />);
      expect(screen.getByText(/loading trips/i)).toBeInTheDocument();
    });

    it("does not show loading message when trips have loaded", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.queryByText(/loading trips/i)).not.toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("shows empty message when trips array is empty and form is closed", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.getByText(/no trips recorded yet/i)).toBeInTheDocument();
    });

    it("does not show empty message when trips exist", () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      expect(screen.queryByText(/no trips recorded yet/i)).not.toBeInTheDocument();
    });

    it("does not show empty message when trips are loading", () => {
      setupLiveQuery(undefined);
      render(<TripsView />);
      expect(screen.queryByText(/no trips recorded yet/i)).not.toBeInTheDocument();
    });
  });

  // ── Trip list rendering ────────────────────────────────────────────────────

  describe("trip list rendering", () => {
    it("renders a TripRow for each trip", () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      expect(screen.getByTestId("trip-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("trip-row-2")).toBeInTheDocument();
      expect(screen.getByTestId("trip-row-3")).toBeInTheDocument();
    });

    it("renders trips sorted by arrival date descending", () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      const rows = screen.getAllByTestId(/^trip-row-/);
      // Spain (2024-06-01) -> France (2024-03-01) -> Germany (2024-01-15)
      expect(rows[0]).toHaveAttribute("data-testid", "trip-row-3");
      expect(rows[1]).toHaveAttribute("data-testid", "trip-row-1");
      expect(rows[2]).toHaveAttribute("data-testid", "trip-row-2");
    });

    it("renders the page heading", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.getByText("Trips")).toBeInTheDocument();
    });
  });

  // ── Add Trip form ──────────────────────────────────────────────────────────

  describe("Add Trip form", () => {
    it("does not show form initially", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.queryByTestId("trip-form")).not.toBeInTheDocument();
    });

    it("opens form when Add Trip is clicked", async () => {
      setupLiveQuery([]);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      const form = screen.getByTestId("trip-form");
      expect(form).toBeInTheDocument();
    });

    it("closes form when onCancel is called", async () => {
      setupLiveQuery([]);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      expect(screen.getByTestId("trip-form")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Cancel Form" }));
      expect(screen.queryByTestId("trip-form")).not.toBeInTheDocument();
    });

    it("closes form when onSave is called", async () => {
      setupLiveQuery([]);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      expect(screen.getByTestId("trip-form")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Save Form" }));
      await waitFor(() => {
        expect(screen.queryByTestId("trip-form")).not.toBeInTheDocument();
      });
    });

    it("can open form again after closing", async () => {
      setupLiveQuery([]);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel Form" }));
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      expect(screen.getByTestId("trip-form")).toBeInTheDocument();
    });
  });

  // ── Edit Trip form ─────────────────────────────────────────────────────────

  describe("Edit Trip form", () => {
    it("opens form with correct editingId when Edit is clicked", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Edit FR" }));
      const form = screen.getByTestId("trip-form");
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute("data-editing-id", "1");
    });

    it("resets editingId to null when form is closed after editing", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Edit FR" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel Form" }));
      // Re-open with Add Trip should have null editingId
      await userEvent.click(screen.getByRole("button", { name: "Add Trip" }));
      expect(screen.getByTestId("trip-form")).toHaveAttribute("data-editing-id", "null");
    });

    it("switches editing trip when a different trip's edit is clicked", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Edit FR" }));
      expect(screen.getByTestId("trip-form")).toHaveAttribute("data-editing-id", "1");
      await userEvent.click(screen.getByRole("button", { name: "Edit DE" }));
      expect(screen.getByTestId("trip-form")).toHaveAttribute("data-editing-id", "2");
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("calls deleteTrip when Delete button is clicked on a trip row", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Delete FR" }));
      await waitFor(() => {
        expect(mockDeleteTrip).toHaveBeenCalledWith("1");
      });
    });

    it("calls deleteTrip with correct id for different trips", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Delete DE" }));
      await waitFor(() => {
        expect(mockDeleteTrip).toHaveBeenCalledWith("2");
      });
    });
  });

  // ── Export ─────────────────────────────────────────────────────────────────

  describe("export", () => {
    it("calls exportTripsToJSON with current trips when Export is clicked", async () => {
      setupLiveQuery(sampleTrips);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Export" }));
      expect(mockExportTripsToJSON).toHaveBeenCalledWith(sampleTrips);
    });

    it("does not call exportTripsToJSON when trips are undefined", () => {
      setupLiveQuery(undefined);
      render(<TripsView />);
      // Export button exists but handler early-returns when trips is undefined
      const exportBtn = screen.queryByRole("button", { name: "Export" });
      if (exportBtn) {
        exportBtn.click();
        expect(mockExportTripsToJSON).not.toHaveBeenCalled();
      }
    });

    it("calls exportTripsToJSON with empty array when no trips exist", async () => {
      setupLiveQuery([]);
      render(<TripsView />);
      await userEvent.click(screen.getByRole("button", { name: "Export" }));
      expect(mockExportTripsToJSON).toHaveBeenCalledWith([]);
    });
  });

  // ── Import ─────────────────────────────────────────────────────────────────

  describe("import", () => {
    it("renders hidden file input", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", "application/json,.json");
    });

    it("shows no import messages initially", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.queryByText(/Imported/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Failed to import/)).not.toBeInTheDocument();
    });

    it("shows success message after successful import", async () => {
      const importedTrips: Trip[] = [
        { id: "10", country: "IT", arrival: "2024-07-01", departure: "2024-07-10" },
        { id: "11", country: "JP", arrival: "2024-08-01", departure: "2024-08-15" },
      ];
      mockParseImportFile.mockReturnValue({ trips: importedTrips });
      mockDbTrips.bulkPut = vi.fn().mockResolvedValue(undefined) as any;
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile(JSON.stringify(importedTrips));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Imported 2 trips.")).toBeInTheDocument();
      });
    });

    it("uses singular 'trip' in success message for single import", async () => {
      const importedTrips: Trip[] = [
        { id: "10", country: "IT", arrival: "2024-07-01", departure: "2024-07-10" },
      ];
      mockParseImportFile.mockReturnValue({ trips: importedTrips });
      mockDbTrips.bulkPut = vi.fn().mockResolvedValue(undefined) as any;
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile(JSON.stringify(importedTrips));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Imported 1 trip.")).toBeInTheDocument();
      });
    });

    it("shows parse error when parseImportFile returns an error", async () => {
      mockParseImportFile.mockReturnValue({ trips: [], error: "Invalid JSON format" });
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile("not valid json");
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Invalid JSON format")).toBeInTheDocument();
      });
      expect(mockDbTrips.bulkPut).not.toHaveBeenCalled();
    });

    it("shows error message when bulkPut throws", async () => {
      const importedTrips: Trip[] = [
        { id: "10", country: "IT", arrival: "2024-07-01", departure: "2024-07-10" },
      ];
      mockParseImportFile.mockReturnValue({ trips: importedTrips });
      mockDbTrips.bulkPut = vi.fn().mockRejectedValue(new Error("Bulk insert failed")) as any;
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile(JSON.stringify(importedTrips));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Bulk insert failed")).toBeInTheDocument();
      });
    });

    it("shows generic error when bulkPut throws non-Error", async () => {
      const importedTrips: Trip[] = [
        { id: "10", country: "IT", arrival: "2024-07-01", departure: "2024-07-10" },
      ];
      mockParseImportFile.mockReturnValue({ trips: importedTrips });
      mockDbTrips.bulkPut = vi.fn().mockRejectedValue("string error") as any;
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile(JSON.stringify(importedTrips));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Failed to import trips.")).toBeInTheDocument();
      });
    });

    it("calls bulkPut with parsed trips", async () => {
      const importedTrips: Trip[] = [
        { id: "10", country: "IT", arrival: "2024-07-01", departure: "2024-07-10" },
      ];
      mockParseImportFile.mockReturnValue({ trips: importedTrips });
      mockDbTrips.bulkPut = vi.fn().mockResolvedValue(undefined) as any;
      setupLiveQuery([]);
      render(<TripsView />);

      const file = createMockFile(JSON.stringify(importedTrips));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockDbTrips.bulkPut).toHaveBeenCalledWith(importedTrips);
      });
    });
  });

  // ── UI controls ────────────────────────────────────────────────────────────

  describe("UI controls", () => {
    it("renders Import, Export, and Add Trip buttons", () => {
      setupLiveQuery([]);
      render(<TripsView />);
      expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Trip" })).toBeInTheDocument();
    });
  });
});
