import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { addRule, updateRule, deleteRule } from '../db/ruleOperations';
import { RulesTable } from './RulesTable';
import { RuleForm } from './RuleForm';
import type { CountryRule } from '../db/types';

export function RulesView(): JSX.Element {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<string | null>(null);

  const rules = useLiveQuery<CountryRule[]>(() => db.rules.toArray(), []) ?? [];

  function handleAddClick(): void {
    setEditingCountry(null);
    setIsFormOpen(true);
  }

  function handleEditClick(country: string): void {
    setEditingCountry(country);
    setIsFormOpen(true);
  }

  function handleFormCancel(): void {
    setIsFormOpen(false);
    setEditingCountry(null);
  }

  async function handleFormSave(rule: CountryRule): Promise<void> {
    if (editingCountry !== null) {
      await updateRule(rule.country, {
        name: rule.name,
        threshold: rule.threshold,
        window: rule.window,
      });
    } else {
      await addRule(rule);
    }
    setIsFormOpen(false);
    setEditingCountry(null);
  }

  async function handleDelete(country: string): Promise<void> {
    await deleteRule(country);
  }

  const editingRule = editingCountry !== null
    ? rules.find((r) => r.country === editingCountry) ?? null
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">Rules</h1>
        {!isFormOpen && (
          <button
            onClick={handleAddClick}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
          >
            Add Rule
          </button>
        )}
      </div>

      {isFormOpen && (
        <RuleForm
          initialValues={editingRule ?? undefined}
          existingCountryCodes={rules.map((r) => r.country)}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      <RulesTable
        rules={rules}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
    </div>
  );
}
