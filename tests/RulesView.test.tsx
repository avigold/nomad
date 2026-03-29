import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RulesView } from "../src/rules/RulesView";
import type { CountryRule } from "../src/db/types";

// Mock dexie-react-hooks
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn(),
}));

// Mock db
vi.mock("../src/db/database", () => ({
  db: {
    rules: {
      toArray: vi.fn(),
    },
  },
}));

// Mock db/ruleOperations
vi.mock("../src/db/ruleOperations", () => ({
  addRule: vi.fn(),
  updateRule: vi.fn(),
  deleteRule: vi.fn(),
}));

// Mock child components so we can control their interface
vi.mock("../src/rules/RulesTable", () => ({
  RulesTable: vi.fn(({ rules, onEdit, onDelete }: { rules: CountryRule[]; onEdit: (c: string) => void; onDelete: (c: string) => void }) => (
    <div data-testid="rules-table">
      {rules.map((r: CountryRule) => (
        <div key={r.country} data-testid={`rule-row-${r.country}`}>
          <span>{r.country}</span>
          <button onClick={() => onEdit(r.country)}>Edit {r.country}</button>
          <button onClick={() => onDelete(r.country)}>Delete {r.country}</button>
        </div>
      ))}
    </div>
  )),
}));

vi.mock("../src/rules/RuleForm", () => ({
  RuleForm: vi.fn(({ initialValues, existingCountryCodes, onSave, onCancel }: {
    initialValues?: CountryRule;
    existingCountryCodes: string[];
    onSave: (rule: CountryRule) => Promise<void>;
    onCancel: () => void;
  }) => (
    <div data-testid="rule-form">
      <span data-testid="form-initial-values">
        {initialValues ? initialValues.country : "new"}
      </span>
      <span data-testid="form-country-codes">
        {existingCountryCodes.join(",")}
      </span>
      <button
        onClick={() =>
          onSave({
            country: initialValues ? initialValues.country : "US",
            name: "",
            threshold: 90,
            window: 180,
          })
        }
      >
        Save
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )),
}));

import { useLiveQuery } from "dexie-react-hooks";
import { addRule, updateRule, deleteRule } from "../src/db/ruleOperations";

const mockUseLiveQuery = vi.mocked(useLiveQuery);
const mockAddRule = vi.mocked(addRule);
const mockUpdateRule = vi.mocked(updateRule);
const mockDeleteRule = vi.mocked(deleteRule);

const sampleRules: CountryRule[] = [
  { country: "DE", name: "Germany", threshold: 90, window: 180 },
  { country: "FR", name: "France", threshold: 60, window: 120 },
];

function setupLiveQuery(rules: CountryRule[] = sampleRules) {
  mockUseLiveQuery.mockImplementation(() => {
    return rules;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupLiveQuery();
});

describe("RulesView", () => {
  describe("initial render", () => {
    it("renders the Rules heading", () => {
      render(<RulesView />);
      expect(screen.getByText("Rules")).toBeInTheDocument();
    });

    it("renders the Add Rule button when form is closed", () => {
      render(<RulesView />);
      expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
    });

    it("renders the RulesTable with all rules", () => {
      render(<RulesView />);
      expect(screen.getByTestId("rules-table")).toBeInTheDocument();
      expect(screen.getByTestId("rule-row-DE")).toBeInTheDocument();
      expect(screen.getByTestId("rule-row-FR")).toBeInTheDocument();
    });

    it("does not render the RuleForm initially", () => {
      render(<RulesView />);
      expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
    });

    it("renders correctly with an empty rules list", () => {
      setupLiveQuery([]);
      render(<RulesView />);
      expect(screen.getByTestId("rules-table")).toBeInTheDocument();
      expect(screen.queryByTestId("rule-row-DE")).not.toBeInTheDocument();
    });

    it("renders correctly when useLiveQuery returns undefined (loading state)", () => {
      mockUseLiveQuery.mockReturnValue(undefined);
      render(<RulesView />);
      // Component falls back to [] via ?? []
      expect(screen.getByTestId("rules-table")).toBeInTheDocument();
    });
  });

  describe("Add Rule flow", () => {
    it("opens the form when Add Rule button is clicked", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));

      expect(screen.getByTestId("rule-form")).toBeInTheDocument();
    });

    it("hides the Add Rule button when the form is open", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));

      expect(screen.queryByRole("button", { name: "Add Rule" })).not.toBeInTheDocument();
    });

    it("passes undefined as initialValues when adding a new rule", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("new");
    });

    it("passes all country codes to the form when adding", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));

      expect(screen.getByTestId("form-country-codes")).toHaveTextContent("DE,FR");
    });

    it("calls addRule when form is saved in add mode", async () => {
      const user = userEvent.setup();
      mockAddRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockAddRule).toHaveBeenCalledWith({
          country: "US",
          name: "",
          threshold: 90,
          window: 180,
        });
      });
    });

    it("does not call updateRule when saving in add mode", async () => {
      const user = userEvent.setup();
      mockAddRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockUpdateRule).not.toHaveBeenCalled();
      });
    });

    it("closes the form after saving a new rule", async () => {
      const user = userEvent.setup();
      mockAddRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
      });
    });

    it("shows Add Rule button again after saving a new rule", async () => {
      const user = userEvent.setup();
      mockAddRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
      });
    });

    it("closes the form when cancel is clicked in add mode", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
    });

    it("shows Add Rule button again after cancel in add mode", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
    });

    it("does not call addRule or updateRule when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockAddRule).not.toHaveBeenCalled();
      expect(mockUpdateRule).not.toHaveBeenCalled();
    });
  });

  describe("Edit Rule flow", () => {
    it("opens the form when edit is triggered from the table", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));

      expect(screen.getByTestId("rule-form")).toBeInTheDocument();
    });

    it("passes the correct existing rule when editing", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("DE");
    });

    it("passes all country codes to the form when editing", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));

      expect(screen.getByTestId("form-country-codes")).toHaveTextContent("DE,FR");
    });

    it("hides the Add Rule button when editing", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));

      expect(screen.queryByRole("button", { name: "Add Rule" })).not.toBeInTheDocument();
    });

    it("calls updateRule when form is saved in edit mode", async () => {
      const user = userEvent.setup();
      mockUpdateRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockUpdateRule).toHaveBeenCalledWith("DE", {
          name: "",
          threshold: 90,
          window: 180,
        });
      });
    });

    it("does not call addRule when saving in edit mode", async () => {
      const user = userEvent.setup();
      mockUpdateRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(mockAddRule).not.toHaveBeenCalled();
      });
    });

    it("closes the form after saving an edited rule", async () => {
      const user = userEvent.setup();
      mockUpdateRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
      });
    });

    it("shows Add Rule button again after saving an edited rule", async () => {
      const user = userEvent.setup();
      mockUpdateRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
      });
    });

    it("closes the form when cancel is clicked in edit mode", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
    });

    it("shows Add Rule button again after cancel in edit mode", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
    });

    it("does not call updateRule or addRule when cancel is clicked in edit mode", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockUpdateRule).not.toHaveBeenCalled();
      expect(mockAddRule).not.toHaveBeenCalled();
    });
  });

  describe("Delete Rule flow", () => {
    it("calls deleteRule with the correct country code", async () => {
      const user = userEvent.setup();
      mockDeleteRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Delete DE" }));

      await waitFor(() => {
        expect(mockDeleteRule).toHaveBeenCalledWith("DE");
      });
    });

    it("calls deleteRule with the correct country code for a different rule", async () => {
      const user = userEvent.setup();
      mockDeleteRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Delete FR" }));

      await waitFor(() => {
        expect(mockDeleteRule).toHaveBeenCalledWith("FR");
      });
    });

    it("does not close or open the form when deleting", async () => {
      const user = userEvent.setup();
      mockDeleteRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Delete DE" }));

      await waitFor(() => {
        expect(mockDeleteRule).toHaveBeenCalled();
      });
      expect(screen.queryByTestId("rule-form")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Rule" })).toBeInTheDocument();
    });

    it("does not affect the form state when form is open and delete is triggered", async () => {
      const user = userEvent.setup();
      mockDeleteRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      // Form is now open; delete should still work
      await user.click(screen.getByRole("button", { name: "Delete FR" }));

      await waitFor(() => {
        expect(mockDeleteRule).toHaveBeenCalledWith("FR");
      });
      // Form should still be open
      expect(screen.getByTestId("rule-form")).toBeInTheDocument();
    });
  });

  describe("switching between add and edit modes", () => {
    it("switches from add mode to edit mode correctly", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      // Open add form
      await user.click(screen.getByRole("button", { name: "Add Rule" }));
      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("new");

      // Cancel and then edit
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(screen.getByRole("button", { name: "Edit DE" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("DE");
    });

    it("switches from edit mode to add mode correctly", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      // Open edit form
      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("DE");

      // Cancel and then add
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(screen.getByRole("button", { name: "Add Rule" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("new");
    });

    it("switches between editing different rules correctly", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      // Edit DE
      await user.click(screen.getByRole("button", { name: "Edit DE" }));
      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("DE");

      // Cancel and edit FR
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(screen.getByRole("button", { name: "Edit FR" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("FR");
    });
  });

  describe("RulesTable props", () => {
    it("passes the correct rules to RulesTable", () => {
      render(<RulesView />);
      expect(screen.getByTestId("rule-row-DE")).toBeInTheDocument();
      expect(screen.getByTestId("rule-row-FR")).toBeInTheDocument();
    });

    it("passes an empty array to RulesTable when no rules exist", () => {
      setupLiveQuery([]);
      render(<RulesView />);
      expect(screen.queryByTestId(/^rule-row-/)).not.toBeInTheDocument();
    });

    it("passes onEdit handler that opens the form for the correct rule", async () => {
      const user = userEvent.setup();
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Edit FR" }));

      expect(screen.getByTestId("form-initial-values")).toHaveTextContent("FR");
    });

    it("passes onDelete handler that calls deleteRule", async () => {
      const user = userEvent.setup();
      mockDeleteRule.mockResolvedValue(undefined as any);
      render(<RulesView />);

      await user.click(screen.getByRole("button", { name: "Delete DE" }));

      await waitFor(() => {
        expect(mockDeleteRule).toHaveBeenCalledWith("DE");
      });
    });
  });
});
