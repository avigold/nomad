import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { RuleForm } from "../src/rules/RuleForm";
import type { CountryRule } from "../src/db/types";

function buildProps(overrides: Partial<Parameters<typeof RuleForm>[0]> = {}) {
  return {
    existingCountryCodes: [] as string[],
    onSave: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...overrides,
  };
}

describe("RuleForm - Add Mode (no initialValues)", () => {
  it("renders 'Add Rule' heading in add mode", () => {
    render(<RuleForm {...buildProps()} />);
    expect(screen.getByText("Add Rule")).toBeInTheDocument();
  });

  it("renders country select input in add mode", () => {
    render(<RuleForm {...buildProps()} />);
    expect(screen.getByPlaceholderText("Select a country")).toBeInTheDocument();
  });

  it("defaults threshold to 183 and window to 365", () => {
    render(<RuleForm {...buildProps()} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(183);
    expect(inputs[1]).toHaveValue(365);
  });

  it("renders Save and Cancel buttons", () => {
    render(<RuleForm {...buildProps()} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows validation error when submitting without selecting a country", async () => {
    render(<RuleForm {...buildProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Country is required.")).toBeInTheDocument();
  });

  it("shows validation error when threshold is 0", async () => {
    render(<RuleForm {...buildProps()} />);
    // Select a country first
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Canada");
    const option = await screen.findByText("Canada");
    fireEvent.mouseDown(option);

    // Set threshold to 0
    const thresholdInput = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, "0");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Threshold must be at least 1 day.")).toBeInTheDocument();
  });

  it("shows validation error when window is 0", async () => {
    render(<RuleForm {...buildProps()} />);
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Canada");
    const option = await screen.findByText("Canada");
    fireEvent.mouseDown(option);

    const windowInput = screen.getAllByRole("spinbutton")[1];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "0");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Window must be at least 1 day.")).toBeInTheDocument();
  });

  it("opens dropdown and shows matching countries when typing in search", async () => {
    render(<RuleForm {...buildProps()} />);
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Aus");
    expect(screen.getByText("Australia")).toBeInTheDocument();
    expect(screen.getByText("Austria")).toBeInTheDocument();
  });

  it("shows 'No countries found.' when search has no matches", async () => {
    render(<RuleForm {...buildProps()} />);
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "ZZZZZZZ");
    expect(screen.getByText("No countries found.")).toBeInTheDocument();
  });

  it("selects a country from dropdown and closes dropdown", async () => {
    render(<RuleForm {...buildProps()} />);
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Japan");
    const option = await screen.findByText("Japan");
    fireEvent.mouseDown(option);

    // After selection, dropdown closes
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("calls onSave with correct CountryRule on valid submission", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Germany");
    const option = await screen.findByText("Germany");
    fireEvent.mouseDown(option);

    const thresholdInput = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, "90");

    const windowInput = screen.getAllByRole("spinbutton")[1];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "180");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        country: "DE",
        name: "",
        threshold: 90,
        window: 180,
      });
    });
  });

  it("excludes countries in existingCountryCodes from the dropdown", async () => {
    const props = buildProps({ existingCountryCodes: ["CA"] });
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Canada");

    expect(screen.queryByText("Canada")).not.toBeInTheDocument();
    expect(screen.getByText("No countries found.")).toBeInTheDocument();
  });

  it("does not exclude countries that are not in existingCountryCodes", async () => {
    const props = buildProps({ existingCountryCodes: ["US"] });
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Canada");

    expect(screen.getByText("Canada")).toBeInTheDocument();
  });

  it("disables Save button while submitting", async () => {
    let resolveOnSave!: () => void;
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => { resolveOnSave = resolve; })
    );
    const props = buildProps({ onSave });
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "France");
    const option = await screen.findByText("France");
    fireEvent.mouseDown(option);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    resolveOnSave();
  });

  it("shows error message when onSave rejects", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Server error"));
    const props = buildProps({ onSave });
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "France");
    const option = await screen.findByText("France");
    fireEvent.mouseDown(option);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows generic error message when onSave rejects with non-Error", async () => {
    const onSave = vi.fn().mockRejectedValue("oops");
    const props = buildProps({ onSave });
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "France");
    const option = await screen.findByText("France");
    fireEvent.mouseDown(option);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save rule.")).toBeInTheDocument();
    });
  });

  it("clears validation error on successful submission", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);

    // Trigger validation error
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Country is required.")).toBeInTheDocument();

    // Now select a country and submit
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Brazil");
    const option = await screen.findByText("Brazil");
    fireEvent.mouseDown(option);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.queryByText("Country is required.")).not.toBeInTheDocument();
    });
  });

  it("searches by country code", async () => {
    render(<RuleForm {...buildProps()} />);
    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "DE");
    expect(screen.getByText("Germany")).toBeInTheDocument();
  });

  it("uses default threshold 183 and window 365 when no initialValues", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Spain");
    const option = await screen.findByText("Spain");
    fireEvent.mouseDown(option);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        country: "ES",
        name: "",
        threshold: 183,
        window: 365,
      });
    });
  });
});

describe("RuleForm - Edit Mode (with initialValues)", () => {
  const initialValues: CountryRule = {
    country: "US",
    name: "United States",
    threshold: 120,
    window: 240,
  };

  it("renders 'Edit Rule' heading in edit mode", () => {
    render(<RuleForm {...buildProps({ initialValues })} />);
    expect(screen.getByText("Edit Rule")).toBeInTheDocument();
  });

  it("displays country name as read-only in edit mode", () => {
    render(<RuleForm {...buildProps({ initialValues })} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a country")).not.toBeInTheDocument();
  });

  it("pre-fills threshold and window from initialValues", () => {
    render(<RuleForm {...buildProps({ initialValues })} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(120);
    expect(inputs[1]).toHaveValue(240);
  });

  it("calls onSave with the correct country code from initialValues on submit", async () => {
    const props = buildProps({ initialValues });
    render(<RuleForm {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        country: "US",
        name: "",
        threshold: 120,
        window: 240,
      });
    });
  });

  it("allows editing threshold and window in edit mode", async () => {
    const props = buildProps({ initialValues });
    render(<RuleForm {...props} />);

    const thresholdInput = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, "60");

    const windowInput = screen.getAllByRole("spinbutton")[1];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "120");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith({
        country: "US",
        name: "",
        threshold: 60,
        window: 120,
      });
    });
  });

  it("does not exclude existingCountryCodes in edit mode (country is locked anyway)", () => {
    const props = buildProps({
      initialValues,
      existingCountryCodes: ["US", "CA"],
    });
    render(<RuleForm {...props} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked in edit mode", async () => {
    const props = buildProps({ initialValues });
    render(<RuleForm {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows validation error when threshold is set to 0 in edit mode", async () => {
    const props = buildProps({ initialValues });
    render(<RuleForm {...props} />);

    const thresholdInput = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, "0");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Threshold must be at least 1 day.")).toBeInTheDocument();
  });

  it("shows validation error when window is set to 0 in edit mode", async () => {
    const props = buildProps({ initialValues });
    render(<RuleForm {...props} />);

    const windowInput = screen.getAllByRole("spinbutton")[1];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "0");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Window must be at least 1 day.")).toBeInTheDocument();
  });

  it("handles initialValues with an unknown country code gracefully", () => {
    const unknownRule: CountryRule = {
      country: "XX",
      name: "XX",
      threshold: 10,
      window: 30,
    };
    render(<RuleForm {...buildProps({ initialValues: unknownRule })} />);
    expect(screen.getByText("XX")).toBeInTheDocument();
  });

  it("shows error when onSave rejects in edit mode", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Edit failed"));
    const props = buildProps({ initialValues, onSave });
    render(<RuleForm {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Edit failed")).toBeInTheDocument();
    });
  });
});

describe("RuleForm - Boundary Values", () => {
  it("accepts threshold of exactly 1", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Italy");
    const option = await screen.findByText("Italy");
    fireEvent.mouseDown(option);

    const thresholdInput = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(thresholdInput);
    await userEvent.type(thresholdInput, "1");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 1 })
      );
    });
  });

  it("accepts window of exactly 1", async () => {
    const props = buildProps();
    render(<RuleForm {...props} />);

    const searchInput = screen.getByPlaceholderText("Select a country");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "Italy");
    const option = await screen.findByText("Italy");
    fireEvent.mouseDown(option);

    const windowInput = screen.getAllByRole("spinbutton")[1];
    await userEvent.clear(windowInput);
    await userEvent.type(windowInput, "1");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ window: 1 })
      );
    });
  });
});
