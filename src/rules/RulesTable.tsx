import type { CountryRule } from '../db/types';
import { getCountryMeta } from '../calculations/countries';

interface Props {
  rules: CountryRule[];
  onEdit: (country: string) => void;
  onDelete: (country: string) => void;
}

export function RulesTable({ rules, onEdit, onDelete }: Props): JSX.Element {
  const sorted = [...rules].sort((a, b) => a.country.localeCompare(b.country));

  return (
    <div className="rounded-lg bg-gray-900 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-gray-300 font-medium">Country</th>
            <th className="px-4 py-3 text-gray-300 font-medium">Threshold (days)</th>
            <th className="px-4 py-3 text-gray-300 font-medium">Window (days)</th>
            <th className="px-4 py-3 text-gray-300 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                No rules configured.
              </td>
            </tr>
          ) : (
            sorted.map((rule) => {
              const meta = getCountryMeta(rule.country);
              return (
                <tr key={rule.country} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{meta.flag} {meta.name}</td>
                  <td className="px-4 py-3 text-gray-300">{rule.threshold}</td>
                  <td className="px-4 py-3 text-gray-300">{rule.window}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => onEdit(rule.country)}
                      className="rounded bg-gray-700 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(rule.country)}
                      className="rounded bg-red-700 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
