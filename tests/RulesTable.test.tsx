import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RulesTable } from "../src/rules/RulesTable";
import type { CountryRule } from "../src/db/types";

// Mock getCountryMeta so we get predictable output
vi.mock("../src/calculations/countries", () => ({
  getCountryMeta: vi.fn((code: string) => {
    const map: Record<string, { code: string; name: string; flag: string }> = {
      US: { code: "US", name: "United States", flag: "US-flag" },
      DE: { code: "DE", name: "Germany", flag: "DE-flag" },
      FR: { code: "FR", name: "France", flag: "FR-flag" },
      JP: { code: "JP", name: "Japan", flag: "JP-flag" },
      CA: { code: "CA", name: "Canada", flag: "CA-flag" },
      BR: { code: "BR", name: "Brazil", flag: "BR-flag" },
      ZA: { code: "ZA", name: "South Africa", flag: "ZA-flag" },
      AU: { code: "AU", name: "Australia", flag: "AU-flag" },
      MX: { code: "MX", name: "Mexico", flag: "MX-flag" },
      IT: { code: "IT", name: "Italy", flag: "IT-flag" },
      AA: { code: "AA", name: "AA-land", flag: "AA-flag" },
      BB: { code: "BB", name: "BB-land", flag: "BB-flag" },
      CC: { code: "CC", name: "CC-land", flag: "CC-flag" },
      XX: { code: "XX", name: "XX-land", flag: "XX-flag" },
      YY: { code: "YY", name: "YY-land", flag: "YY-flag" },
      ZZ: { code: "ZZ", name: "ZZ-land", flag: "ZZ-flag" },
    };
    return map[code] ?? { code, name: code, flag: "unknown-flag" };
  }),
}));

const makeRule = (
  country: string,
  threshold: number,
  window: number
): CountryRule => ({ country, name: country, threshold, window });

describe("RulesTable", () => {
  let onEdit: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onEdit = vi.fn();
    onDelete = vi.fn();
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it("renders empty-state message when rules array is empty", () => {
    render(<RulesTable rules={[]} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText("No rules configured.")).toBeInTheDocument();
  });

  it("does not render any data rows when rules array is empty", () => {
    render(<RulesTable rules={[]} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("empty-state cell spans all four columns", () => {
    render(<RulesTable rules={[]} onEdit={onEdit} onDelete={onDelete} />);
    const cell = screen.getByText("No rules configured.").closest("td");
    expect(cell).toHaveAttribute("colspan", "4");
  });

  // ── Single rule ──────────────────────────────────────────────────────────

  it("renders a row with correct country name, threshold and window values", () => {
    const rules = [makeRule("DE", 90, 180)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText(/Germany/)).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("180")).toBeInTheDocument();
  });

  it("does not show the empty-state message when at least one rule exists", () => {
    render(
      <RulesTable
        rules={[makeRule("US", 30, 60)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(screen.queryByText("No rules configured.")).toBeNull();
  });

  it("renders Edit and Delete buttons for a single rule", () => {
    render(
      <RulesTable
        rules={[makeRule("FR", 45, 90)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  // ── Multiple rules ───────────────────────────────────────────────────────

  it("renders one row per rule", () => {
    const rules = [makeRule("US", 30, 60), makeRule("DE", 90, 180), makeRule("FR", 45, 90)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(3);
  });

  it("renders all country names", () => {
    const rules = [makeRule("US", 30, 60), makeRule("DE", 90, 180), makeRule("FR", 45, 90)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/Germany/)).toBeInTheDocument();
    expect(screen.getByText(/France/)).toBeInTheDocument();
  });

  // ── Sorting ──────────────────────────────────────────────────────────────

  it("sorts rows alphabetically by country code ascending", () => {
    const rules = [makeRule("US", 30, 60), makeRule("DE", 90, 180), makeRule("FR", 45, 90)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    const rows = screen.getAllByRole("row");
    // rows[0] is the header row
    const firstDataRow = rows[1];
    const secondDataRow = rows[2];
    const thirdDataRow = rows[3];

    expect(within(firstDataRow).getByText(/Germany/)).toBeInTheDocument();
    expect(within(secondDataRow).getByText(/France/)).toBeInTheDocument();
    expect(within(thirdDataRow).getByText(/United States/)).toBeInTheDocument();
  });

  it("does not mutate the original rules array when sorting", () => {
    const rules = [makeRule("US", 30, 60), makeRule("DE", 90, 180)];
    const originalOrder = rules.map((r) => r.country);
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);
    expect(rules.map((r) => r.country)).toEqual(originalOrder);
  });

  it("renders a single rule without sorting errors", () => {
    render(
      <RulesTable
        rules={[makeRule("ZZ", 10, 20)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText(/ZZ-land/)).toBeInTheDocument();
  });

  // ── Table structure ──────────────────────────────────────────────────────

  it("renders the four column headers", () => {
    render(<RulesTable rules={[]} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Threshold (days)")).toBeInTheDocument();
    expect(screen.getByText("Window (days)")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  // ── onEdit callback ──────────────────────────────────────────────────────

  it("calls onEdit with the correct country code when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RulesTable
        rules={[makeRule("JP", 90, 180)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith("JP");
  });

  it("calls onEdit with the correct country code for the clicked row among multiple rules", async () => {
    const user = userEvent.setup();
    const rules = [makeRule("US", 30, 60), makeRule("DE", 90, 180)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    // After sorting: DE first, US second
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[1]); // US row (second after sort)
    expect(onEdit).toHaveBeenCalledWith("US");
  });

  it("does not call onDelete when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RulesTable
        rules={[makeRule("CA", 60, 120)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  // ── onDelete callback ────────────────────────────────────────────────────

  it("calls onDelete with the correct country code when Delete is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RulesTable
        rules={[makeRule("BR", 90, 365)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("BR");
  });

  it("calls onDelete with the correct country code for the clicked row among multiple rules", async () => {
    const user = userEvent.setup();
    const rules = [makeRule("ZA", 30, 60), makeRule("AU", 90, 180)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    // After sorting: AU first, ZA second
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]); // AU row (first after sort)
    expect(onDelete).toHaveBeenCalledWith("AU");
  });

  it("does not call onEdit when Delete is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RulesTable
        rules={[makeRule("MX", 45, 90)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onEdit).not.toHaveBeenCalled();
  });

  // ── Boundary / numeric values ────────────────────────────────────────────

  it("renders zero values for threshold and window", () => {
    render(
      <RulesTable
        rules={[makeRule("XX", 0, 0)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2);
  });

  it("renders large numeric values correctly", () => {
    render(
      <RulesTable
        rules={[makeRule("YY", 9999, 99999)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText("9999")).toBeInTheDocument();
    expect(screen.getByText("99999")).toBeInTheDocument();
  });

  // ── Callbacks not called on initial render ───────────────────────────────

  it("does not call onEdit or onDelete on initial render", () => {
    render(
      <RulesTable
        rules={[makeRule("IT", 30, 90)]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // ── Independent callbacks per row ────────────────────────────────────────

  it("each row's Edit button only triggers onEdit once per click", async () => {
    const user = userEvent.setup();
    const rules = [makeRule("AA", 10, 20), makeRule("BB", 30, 40), makeRule("CC", 50, 60)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[2]); // CC row
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith("CC");
  });

  it("clicking Edit on one row does not affect Delete call count", async () => {
    const user = userEvent.setup();
    const rules = [makeRule("AA", 10, 20), makeRule("BB", 30, 40)];
    render(<RulesTable rules={rules} onEdit={onEdit} onDelete={onDelete} />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
