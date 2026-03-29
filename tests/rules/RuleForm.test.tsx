import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RuleForm } from "../../src/rules/RuleForm";
import type { CountryRule } from "../../src/db/types";

describe("RuleForm", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSave.mockReset();
    mockOnCancel.mockReset();
  });

  function renderForm(
    existingCountryCodes: string[] = [],
    initialValues?: CountryRule
  ) {
    return render(
      <RuleForm
        existingCountryCodes={existingCountryCodes}
        initialValues={initialValues}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
  }

  it("renders country select input, threshold input, window input, Save and Cancel buttons", () => {
    renderForm();

    expect(screen.getByPlaceholderText(/select a country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/threshold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/window/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("populates fields with initialValues when editing", () => {
    const rule: CountryRule = {
      country: "DE",
      name: "Germany",
      threshold: 90,
      window: 180,
    };
    renderForm([], rule);

    // In edit mode, country is shown as read-only text
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByLabelText(/threshold/i)).toHaveValue(90);
    expect(screen.getByLabelText(/window/i)).toHaveValue(180);
  });

  it("shows validation error when no country is selected", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/country is required/i)).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("shows validation error when threshold is less than 1", async () => {
    renderForm();

    const user = userEvent.setup();

    // Select a country via CountrySelect
    const input = screen.getByPlaceholderText(/select a country/i);
    await user.click(input);
    await user.type(input, "Germany");
    const option = await screen.findByText("Germany");
    fireEvent.mouseDown(option);

    const thresholdInput = screen.getByLabelText(/threshold/i);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "0");

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/threshold must be at least 1 day/i)
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("shows validation error when window is less than 1", async () => {
    renderForm();

    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/select a country/i);
    await user.click(input);
    await user.type(input, "France");
    const option = await screen.findByText("France");
    fireEvent.mouseDown(option);

    const thresholdInput = screen.getByLabelText(/threshold/i);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "30");

    const windowInput = screen.getByLabelText(/window/i);
    await user.clear(windowInput);
    await user.type(windowInput, "0");

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/window must be at least 1 day/i)
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("calls onSave with the correct rule when form is valid", async () => {
    mockOnSave.mockResolvedValue(undefined);
    renderForm();

    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(/select a country/i);
    await user.click(input);
    await user.type(input, "Japan");
    const option = await screen.findByText("Japan");
    fireEvent.mouseDown(option);

    const thresholdInput = screen.getByLabelText(/threshold/i);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "90");

    const windowInput = screen.getByLabelText(/window/i);
    await user.clear(windowInput);
    await user.type(windowInput, "180");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        country: "JP",
        name: "",
        threshold: 90,
        window: 180,
      });
    });
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    renderForm();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("excludes countries that already have rules from the dropdown", async () => {
    renderForm(["DE"]);

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/select a country/i);
    await user.click(input);
    await user.type(input, "Germany");

    // Germany should be excluded from the dropdown
    expect(screen.queryByText("Germany")).not.toBeInTheDocument();
  });

  it("includes countries that do not already have rules in the dropdown", async () => {
    renderForm(["DE"]);

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(/select a country/i);
    await user.click(input);
    await user.type(input, "France");

    expect(await screen.findByText("France")).toBeInTheDocument();
  });

  it("in edit mode, allows the existing country to be shown even if it is in existingCountryCodes", () => {
    const rule: CountryRule = {
      country: "DE",
      name: "Germany",
      threshold: 90,
      window: 180,
    };
    renderForm(["DE"], rule);

    // In edit mode, country is shown as read-only text, not via CountrySelect
    expect(screen.getByText("Germany")).toBeInTheDocument();
  });

  it("calls onSave with updated values in edit mode", async () => {
    mockOnSave.mockResolvedValue(undefined);

    const rule: CountryRule = {
      country: "DE",
      name: "Germany",
      threshold: 90,
      window: 180,
    };
    renderForm(["DE"], rule);

    const user = userEvent.setup();

    const thresholdInput = screen.getByLabelText(/threshold/i);
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "60");

    const windowInput = screen.getByLabelText(/window/i);
    await user.clear(windowInput);
    await user.type(windowInput, "365");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        country: "DE",
        name: "",
        threshold: 60,
        window: 365,
      });
    });
  });
});
