import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { TripForm } from "../src/trips/TripForm";
import type { Trip } from "../src/db/types";
import * as tripValidation from "../src/trips/tripValidation";

vi.mock("../src/trips/tripValidation", () => ({
  validateTrip: vi.fn(),
}));

vi.mock("../src/db/tripOperations", () => ({
  addTrip: vi.fn().mockResolvedValue("new-id"),
  updateTrip: vi.fn().mockResolvedValue(undefined),
}));

const mockValidateTrip = vi.mocked(tripValidation.validateTrip);

const defaultProps = {
  existingTrips: [] as Trip[],
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

function renderForm(props: Partial<typeof defaultProps & { initialValues?: any; editingId?: string }> = {}) {
  return render(<TripForm {...defaultProps} {...props} />);
}

describe("TripForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateTrip.mockReturnValue({ valid: true });
  });

  describe("rendering", () => {
    it("renders country select input", () => {
      renderForm();
      expect(screen.getByText(/country/i)).toBeInTheDocument();
    });

    it("renders arrival date input", () => {
      renderForm();
      expect(screen.getByLabelText(/arrival date/i)).toBeInTheDocument();
    });

    it("renders departure date input", () => {
      renderForm();
      expect(screen.getByLabelText(/departure date/i)).toBeInTheDocument();
    });

    it("renders save button with 'Add Trip' text when not editing", () => {
      renderForm();
      expect(screen.getByRole("button", { name: /add trip/i })).toBeInTheDocument();
    });

    it("renders save button with 'Update' text when editing", () => {
      renderForm({ editingId: "some-id", initialValues: { country: "FR", arrival: "2024-01-01", departure: "2024-01-10" } });
      expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
    });

    it("renders cancel button", () => {
      renderForm();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("renders with empty fields when no initialValues provided", () => {
      renderForm();
      expect(screen.getByLabelText(/arrival date/i)).toHaveValue("");
      expect(screen.getByLabelText(/departure date/i)).toHaveValue("");
    });

    it("renders with pre-filled date values when initialValues provided", () => {
      renderForm({
        initialValues: {
          country: "FR",
          arrival: "2024-01-01",
          departure: "2024-01-10",
        },
      });
      expect(screen.getByLabelText(/arrival date/i)).toHaveValue("2024-01-01");
      expect(screen.getByLabelText(/departure date/i)).toHaveValue("2024-01-10");
    });

    it("does not show error message initially", () => {
      renderForm();
      expect(screen.queryByText(/please select a country/i)).not.toBeInTheDocument();
    });
  });

  describe("form submission - happy path", () => {
    it("calls onSave when form is valid", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderForm({ onSave });

      // Select a country via the CountrySelect
      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      const franceOption = screen.getByText("France");
      await user.click(franceOption);

      await user.type(screen.getByLabelText(/arrival date/i), "2024-01-01");
      await user.type(screen.getByLabelText(/departure date/i), "2024-01-10");
      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledOnce();
      });
    });

    it("calls validateTrip with correct values", async () => {
      const user = userEvent.setup();
      const existingTrips = [{ id: "1", country: "DE", arrival: "2023-01-01", departure: "2023-01-05" }] as Trip[];
      renderForm({ existingTrips, editingId: "some-id", initialValues: { country: "FR", arrival: "", departure: "" } });

      await user.type(screen.getByLabelText(/arrival date/i), "2024-01-01");
      await user.type(screen.getByLabelText(/departure date/i), "2024-01-10");
      await user.click(screen.getByRole("button", { name: /update/i }));

      await waitFor(() => {
        expect(mockValidateTrip).toHaveBeenCalledWith(
          { country: "FR", arrival: "2024-01-01", departure: "2024-01-10" },
          existingTrips,
          "some-id"
        );
      });
    });

    it("does not show error when submission is successful", async () => {
      const user = userEvent.setup();
      renderForm();

      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      await user.click(screen.getByText("France"));

      await user.type(screen.getByLabelText(/arrival date/i), "2024-01-01");
      await user.type(screen.getByLabelText(/departure date/i), "2024-01-10");
      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("form submission - error cases", () => {
    it("shows error when no country is selected", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(screen.getByText(/please select a country/i)).toBeInTheDocument();
    });

    it("does not call onSave when no country is selected", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderForm({ onSave });

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it("does not call validateTrip when no country is selected", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(mockValidateTrip).not.toHaveBeenCalled();
    });

    it("shows validation error from validateTrip when validation fails", async () => {
      const user = userEvent.setup();
      mockValidateTrip.mockReturnValue({ valid: false, error: "Dates overlap with an existing trip." });
      renderForm();

      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      await user.click(screen.getByText("France"));

      await user.type(screen.getByLabelText(/arrival date/i), "2024-01-01");
      await user.type(screen.getByLabelText(/departure date/i), "2024-01-10");
      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(screen.getByText(/dates overlap with an existing trip/i)).toBeInTheDocument();
    });

    it("does not call onSave when validateTrip returns invalid", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      mockValidateTrip.mockReturnValue({ valid: false, error: "Some error" });
      renderForm({ onSave });

      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      await user.click(screen.getByText("France"));

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it("clears previous error on successful submission", async () => {
      const user = userEvent.setup();
      renderForm();

      // First submit without country to trigger error
      await user.click(screen.getByRole("button", { name: /add trip/i }));
      expect(screen.getByText(/please select a country/i)).toBeInTheDocument();

      // Now select country and submit successfully
      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      await user.click(screen.getByText("France"));

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(screen.queryByText(/please select a country/i)).not.toBeInTheDocument();
      });
    });

    it("shows new error when validation fails after a previous error", async () => {
      const user = userEvent.setup();
      mockValidateTrip.mockReturnValue({ valid: false, error: "Departure must be after arrival." });
      renderForm();

      const countryInput = screen.getByPlaceholderText("Select a country");
      await user.click(countryInput);
      await user.type(countryInput, "France");
      await user.click(screen.getByText("France"));

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      expect(screen.getByText(/departure must be after arrival/i)).toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderForm({ onCancel });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("does not submit the form when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderForm({ onSave });

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("date inputs", () => {
    it("updates arrival date when user changes the input", async () => {
      const user = userEvent.setup();
      renderForm();

      const arrivalInput = screen.getByLabelText(/arrival date/i);
      await user.type(arrivalInput, "2024-03-15");
      expect(arrivalInput).toHaveValue("2024-03-15");
    });

    it("updates departure date when user changes the input", async () => {
      const user = userEvent.setup();
      renderForm();

      const departureInput = screen.getByLabelText(/departure date/i);
      await user.type(departureInput, "2024-03-20");
      expect(departureInput).toHaveValue("2024-03-20");
    });
  });

  describe("initialValues pre-population", () => {
    it("pre-populates arrival date from initialValues", () => {
      renderForm({
        initialValues: { country: "", arrival: "2024-05-01", departure: "" },
      });
      expect(screen.getByLabelText(/arrival date/i)).toHaveValue("2024-05-01");
    });

    it("pre-populates departure date from initialValues", () => {
      renderForm({
        initialValues: { country: "", arrival: "", departure: "2024-05-10" },
      });
      expect(screen.getByLabelText(/departure date/i)).toHaveValue("2024-05-10");
    });

    it("allows saving with pre-populated country without re-selecting from dropdown", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderForm({
        onSave,
        initialValues: { country: "DE", arrival: "2024-01-01", departure: "2024-01-10" },
      });

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledOnce();
      });
    });
  });

  describe("form accessibility", () => {
    it("arrival date input has correct label association", () => {
      renderForm();
      expect(screen.getByLabelText(/arrival date/i)).toBeInTheDocument();
    });

    it("departure date input has correct label association", () => {
      renderForm();
      expect(screen.getByLabelText(/departure date/i)).toBeInTheDocument();
    });

    it("submit button is of type submit", () => {
      renderForm();
      expect(screen.getByRole("button", { name: /add trip/i })).toHaveAttribute("type", "submit");
    });

    it("cancel button is of type button", () => {
      renderForm();
      expect(screen.getByRole("button", { name: /cancel/i })).toHaveAttribute("type", "button");
    });
  });

  describe("edge cases", () => {
    it("renders correctly with empty existingTrips array", () => {
      renderForm({ existingTrips: [] });
      expect(screen.getByRole("button", { name: /add trip/i })).toBeInTheDocument();
    });

    it("passes editingId to validateTrip", async () => {
      const user = userEvent.setup();
      const editingId = "trip-123";
      renderForm({
        editingId,
        initialValues: { country: "JP", arrival: "", departure: "" },
      });

      await user.click(screen.getByRole("button", { name: /update/i }));

      // Country is pre-populated, so validateTrip should be called
      await waitFor(() => {
        expect(mockValidateTrip).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Array),
          editingId
        );
      });
    });

    it("passes undefined editingId to validateTrip when not provided", async () => {
      const user = userEvent.setup();
      renderForm({ initialValues: { country: "JP", arrival: "", departure: "" } });

      await user.click(screen.getByRole("button", { name: /add trip/i }));

      await waitFor(() => {
        expect(mockValidateTrip).toHaveBeenCalledWith(
          expect.any(Object),
          expect.any(Array),
          undefined
        );
      });
    });
  });
});
