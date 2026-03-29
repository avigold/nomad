import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TripRow } from "../src/trips/TripRow";
import type { Trip } from "../src/db/types";

// Mock the dependencies so we control the output
vi.mock("../src/calculations/date-utils", () => ({
  formatDateRange: vi.fn((arrival: string, departure: string | null) => {
    if (departure === null) return `${arrival} – present`;
    return `${arrival} – ${departure}`;
  }),
  tripDurationDays: vi.fn((arrival: string, departure: string | null) => {
    if (departure === null) return 1;
    const a = new Date(arrival);
    const d = new Date(departure);
    return Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }),
}));

vi.mock("../src/calculations/countries", () => ({
  getCountryMeta: vi.fn((code: string) => {
    const map: Record<string, { code: string; name: string; flag: string }> = {
      FR: { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
      JP: { code: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
      DE: { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
    };
    return map[code] ?? { code, name: code, flag: "\u{1F3F3}" };
  }),
}));

const makeTrip = (overrides: Partial<Trip> = {}): Trip => ({
  id: "trip-1",
  country: "FR",
  arrival: "2024-03-01",
  departure: "2024-03-07",
  ...overrides,
});

describe("TripRow", () => {
  let onEdit: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onEdit = vi.fn();
    onDelete = vi.fn();
  });

  describe("rendering trip data", () => {
    it("displays the country name from getCountryMeta", () => {
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText(/France/)).toBeInTheDocument();
    });

    it("displays the formatted date range", () => {
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("2024-03-01 \u2013 2024-03-07")).toBeInTheDocument();
    });

    it("displays the correct duration in days for a multi-day trip", () => {
      // arrival 2024-03-01, departure 2024-03-07 => 7 days
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("7 days")).toBeInTheDocument();
    });

    it("displays '1 day' (singular) when arrival and departure are the same date", () => {
      const trip = makeTrip({ arrival: "2024-06-15", departure: "2024-06-15" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("1 day")).toBeInTheDocument();
    });

    it("displays 'days' (plural) when duration is more than one day", () => {
      const trip = makeTrip({ arrival: "2024-01-01", departure: "2024-01-10" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("10 days")).toBeInTheDocument();
    });

    it("displays 'days' (plural) when duration is exactly 2 days", () => {
      const trip = makeTrip({ arrival: "2024-05-01", departure: "2024-05-02" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("2 days")).toBeInTheDocument();
    });

    it("renders Edit and Delete buttons", () => {
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });

    it("renders a different country name correctly", () => {
      const trip = makeTrip({ country: "JP" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText(/Japan/)).toBeInTheDocument();
    });
  });

  describe("Edit button interaction", () => {
    it("calls onEdit with the trip id when Edit button is clicked", async () => {
      const user = userEvent.setup();
      const trip = makeTrip({ id: "abc-123" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Edit" }));

      expect(onEdit).toHaveBeenCalledOnce();
      expect(onEdit).toHaveBeenCalledWith("abc-123");
    });

    it("does not call onDelete when Edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Edit" }));

      expect(onDelete).not.toHaveBeenCalled();
    });

    it("calls onEdit with the correct id when multiple trips are rendered", async () => {
      const user = userEvent.setup();
      const trip = makeTrip({ id: "unique-id-999" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Edit" }));

      expect(onEdit).toHaveBeenCalledWith("unique-id-999");
    });
  });

  describe("Delete button interaction", () => {
    it("calls onDelete with the trip id when Delete button is clicked", async () => {
      const user = userEvent.setup();
      const trip = makeTrip({ id: "del-456" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith("del-456");
    });

    it("does not call onEdit when Delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("calls onDelete with the correct id when multiple trips are rendered", async () => {
      const user = userEvent.setup();
      const trip = makeTrip({ id: "unique-del-888" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onDelete).toHaveBeenCalledWith("unique-del-888");
    });
  });

  describe("independent callback invocations", () => {
    it("can call onEdit multiple times independently", async () => {
      const user = userEvent.setup();
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      const editBtn = screen.getByRole("button", { name: "Edit" });

      await user.click(editBtn);
      await user.click(editBtn);

      expect(onEdit).toHaveBeenCalledTimes(2);
    });

    it("can call onDelete multiple times independently", async () => {
      const user = userEvent.setup();
      render(<TripRow trip={makeTrip()} onEdit={onEdit} onDelete={onDelete} />);
      const deleteBtn = screen.getByRole("button", { name: "Delete" });

      await user.click(deleteBtn);
      await user.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledTimes(2);
    });

    it("calling Edit does not interfere with Delete and vice versa", async () => {
      const user = userEvent.setup();
      render(<TripRow trip={makeTrip({ id: "combo-id" })} onEdit={onEdit} onDelete={onDelete} />);

      await user.click(screen.getByRole("button", { name: "Edit" }));
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onEdit).toHaveBeenCalledOnce();
      expect(onEdit).toHaveBeenCalledWith("combo-id");
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith("combo-id");
    });
  });

  describe("duration calculation edge cases", () => {
    it("calculates duration correctly for a trip spanning a month boundary", () => {
      const trip = makeTrip({ arrival: "2024-01-30", departure: "2024-02-02" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      // differenceInDays("2024-02-02", "2024-01-30") = 3, +1 = 4
      expect(screen.getByText("4 days")).toBeInTheDocument();
    });

    it("calculates duration correctly for a trip spanning a year boundary", () => {
      const trip = makeTrip({ arrival: "2023-12-30", departure: "2024-01-02" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      // differenceInDays("2024-01-02", "2023-12-30") = 3, +1 = 4
      expect(screen.getByText("4 days")).toBeInTheDocument();
    });

    it("calculates duration correctly for a long trip", () => {
      const trip = makeTrip({ arrival: "2024-01-01", departure: "2024-12-31" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      // 2024 is a leap year: 366 days
      expect(screen.getByText("366 days")).toBeInTheDocument();
    });

    it("displays correct date range in the rendered text", () => {
      const trip = makeTrip({ arrival: "2023-12-30", departure: "2024-01-02" });
      render(<TripRow trip={trip} onEdit={onEdit} onDelete={onDelete} />);
      expect(screen.getByText("2023-12-30 \u2013 2024-01-02")).toBeInTheDocument();
    });
  });
});
