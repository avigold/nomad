import { useState } from 'react';
import type { CountryRule } from '../db/types';
import { CountrySelect } from '../trips/CountrySelect';

interface Props {
  existingCountryCodes: string[];
  initialValues?: CountryRule;
  onSave: (rule: CountryRule) => Promise<void>;
  onCancel: () => void;
}

export function RuleForm({ existingCountryCodes, initialValues, onSave, onCancel }: Props): JSX.Element {
  const isEditMode = initialValues !== undefined;

  const [country, setCountry] = useState(initialValues?.country ?? '');
  const [threshold, setThreshold] = useState(initialValues?.threshold ?? 183);
  const [windowDays, setWindowDays] = useState(initialValues?.window ?? 365);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (!country) {
      setError('Country is required.');
      return;
    }
    if (threshold < 1) {
      setError('Threshold must be at least 1 day.');
      return;
    }
    if (windowDays < 1) {
      setError('Window must be at least 1 day.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ country, name: '', threshold, window: windowDays });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-lg bg-gray-900 p-4 flex flex-col gap-4">
      <h2 className="text-white text-lg font-semibold">{isEditMode ? 'Edit Rule' : 'Add Rule'}</h2>

      <div className="flex flex-col gap-1">
        <label className="text-gray-300 text-sm font-medium">Country</label>
        {isEditMode ? (
          <div className="rounded bg-gray-800 px-3 py-2 text-gray-400 cursor-not-allowed">
            {initialValues?.name || initialValues?.country}
          </div>
        ) : (
          <CountrySelect
            value={country}
            onChange={setCountry}
            excludeCodes={existingCountryCodes}
            placeholder="Select a country"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="rule-threshold" className="text-gray-300 text-sm font-medium">Threshold (days)</label>
        <input
          id="rule-threshold"
          type="number"
          min={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="rounded bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="rule-window" className="text-gray-300 text-sm font-medium">Window (days)</label>
        <input
          id="rule-window"
          type="number"
          min={1}
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="rounded bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {error !== null && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600">
          Cancel
        </button>
      </div>
    </form>
  );
}
