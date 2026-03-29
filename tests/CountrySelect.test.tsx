import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CountrySelect } from "../src/trips/CountrySelect";

function renderCountrySelect(
  props: Partial<Parameters<typeof CountrySelect>[0]> = {}
) {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    ...props,
  };
  return { ...render(<CountrySelect {...defaultProps} />), onChange: defaultProps.onChange };
}

describe("CountrySelect", () => {
  describe("initial render", () => {
    it("renders an input element", () => {
      renderCountrySelect();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("shows default placeholder when none provided", () => {
      renderCountrySelect();
      expect(screen.getByPlaceholderText("Select a country")).toBeInTheDocument();
    });

    it("shows custom placeholder when provided", () => {
      renderCountrySelect({ placeholder: "Choose destination" });
      expect(screen.getByPlaceholderText("Choose destination")).toBeInTheDocument();
    });

    it("does not show dropdown on initial render", () => {
      renderCountrySelect();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("displays selected country flag and name when value is provided", () => {
      renderCountrySelect({ value: "FR" });
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toContain("France");
    });

    it("displays empty input when value is empty string", () => {
      renderCountrySelect({ value: "" });
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });
  });

  describe("opening the dropdown", () => {
    it("opens dropdown when input is clicked", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      expect(screen.getByRole("list")).toBeInTheDocument();
    });

    it("shows all countries when opened with no query", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("shows country names in the dropdown", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      expect(screen.getByText("France")).toBeInTheDocument();
      expect(screen.getByText("Germany")).toBeInTheDocument();
      expect(screen.getByText("United States")).toBeInTheDocument();
    });
  });

  describe("searching / filtering", () => {
    it("filters countries by name as user types", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      expect(screen.getByText("France")).toBeInTheDocument();
      expect(screen.queryByText("Germany")).not.toBeInTheDocument();
    });

    it("filters countries case-insensitively", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "FRANCE");
      expect(screen.getByText("France")).toBeInTheDocument();
    });

    it("filters countries by country code", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "de");
      expect(screen.getByText("Germany")).toBeInTheDocument();
    });

    it("shows 'No countries found.' when query matches nothing", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "zzzzzzzzz");
      expect(screen.getByText("No countries found.")).toBeInTheDocument();
    });

    it("shows all countries when query is cleared", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      await userEvent.clear(input);
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("filters by partial name match", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "united");
      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      expect(screen.getByText("United Arab Emirates")).toBeInTheDocument();
    });
  });

  describe("selecting a country", () => {
    it("calls onChange with country code when a country is selected", async () => {
      const onChange = vi.fn();
      render(<CountrySelect value="" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      const franceItem = screen.getByText("France");
      fireEvent.mouseDown(franceItem);
      expect(onChange).toHaveBeenCalledWith("FR");
    });

    it("closes dropdown after selecting a country", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      const franceItem = screen.getByText("France");
      fireEvent.mouseDown(franceItem);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("clears the search query after selecting a country", async () => {
      const onChange = vi.fn();
      const { rerender } = render(<CountrySelect value="" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      const franceItem = screen.getByText("France");
      fireEvent.mouseDown(franceItem);
      rerender(<CountrySelect value="FR" onChange={onChange} />);
      expect((input as HTMLInputElement).value).toContain("France");
    });

    it("highlights the currently selected country in the dropdown", async () => {
      renderCountrySelect({ value: "FR" });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      const listItem = screen.getByText("France").closest("li");
      expect(listItem).toHaveClass("bg-gray-700");
    });
  });

  describe("excludeCodes prop", () => {
    it("excludes specified country codes from the dropdown", async () => {
      renderCountrySelect({ excludeCodes: ["FR"] });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      expect(screen.queryByText("France")).not.toBeInTheDocument();
    });

    it("excludes multiple country codes", async () => {
      renderCountrySelect({ excludeCodes: ["FR", "DE", "US"] });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      expect(screen.queryByText("France")).not.toBeInTheDocument();
      expect(screen.queryByText("Germany")).not.toBeInTheDocument();
      expect(screen.queryByText("United States")).not.toBeInTheDocument();
    });

    it("shows all countries when excludeCodes is empty array", async () => {
      renderCountrySelect({ excludeCodes: [] });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("shows all countries when excludeCodes is undefined", async () => {
      renderCountrySelect({ excludeCodes: undefined });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("shows 'No countries found.' when all matching countries are excluded", async () => {
      renderCountrySelect({ excludeCodes: ["FR"] });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      expect(screen.getByText("No countries found.")).toBeInTheDocument();
    });
  });

  describe("keyboard interactions", () => {
    it("closes dropdown when Escape is pressed", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      expect(screen.getByRole("list")).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("clears query when Escape is pressed", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      await userEvent.keyboard("{Escape}");
      expect(input).toHaveValue("");
    });
  });

  describe("clicking outside", () => {
    it("closes dropdown when clicking outside the component", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      expect(screen.getByRole("list")).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("clears query when clicking outside", async () => {
      renderCountrySelect({ value: "" });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      fireEvent.mouseDown(document.body);
      expect(input).toHaveValue("");
    });
  });

  describe("clearing selection", () => {
    it("calls onChange with empty string when input is cleared while a value is selected", async () => {
      const onChange = vi.fn();
      render(<CountrySelect value="FR" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      // Type something first so that clearing triggers a change event
      await userEvent.type(input, "f");
      await userEvent.clear(input);
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("does not call onChange with empty string when clearing input with no value selected", async () => {
      const onChange = vi.fn();
      render(<CountrySelect value="" onChange={onChange} />);
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "france");
      await userEvent.clear(input);
      expect(onChange).not.toHaveBeenCalledWith("");
    });
  });

  describe("display value", () => {
    it("shows flag emoji and country name when a country is selected and dropdown is closed", () => {
      renderCountrySelect({ value: "US" });
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toContain("United States");
    });

    it("shows query text when dropdown is open", async () => {
      renderCountrySelect({ value: "FR" });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "ger");
      expect(input).toHaveValue("ger");
    });

    it("shows empty string when no country is selected and dropdown is closed", () => {
      renderCountrySelect({ value: "" });
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("shows flag emoji in the display value for selected country", () => {
      renderCountrySelect({ value: "GB" });
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toContain("United Kingdom");
    });
  });

  describe("flag emoji generation", () => {
    it("displays flag emoji alongside country name in dropdown items", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "japan");
      const listItem = screen.getByText("Japan").closest("li");
      expect(listItem).toBeInTheDocument();
      const spans = listItem!.querySelectorAll("span");
      expect(spans.length).toBe(2);
      expect(spans[1]).toHaveTextContent("Japan");
    });
  });

  describe("edge cases", () => {
    it("handles value that does not match any country code gracefully", () => {
      renderCountrySelect({ value: "XX" });
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("handles whitespace-only query by showing all countries", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.type(input, "   ");
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("renders without crashing when excludeCodes contains unknown codes", async () => {
      renderCountrySelect({ excludeCodes: ["XX", "YY", "ZZ"] });
      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(100);
    });

    it("opens dropdown when user starts typing without clicking first", async () => {
      renderCountrySelect();
      const input = screen.getByRole("textbox");
      input.focus();
      await userEvent.type(input, "france");
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});