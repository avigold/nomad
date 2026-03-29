import { useState } from 'react';
import type { Trip } from '../db/types';
import type { TripFormValues } from './types';
import { validateTrip } from './tripValidation';
import { addTrip, updateTrip } from '../db/tripOperations';
import { CountrySelect } from './CountrySelect';

interface Props {
  initialValues?: TripFormValues;
  editingId?: string;
  existingTrips: Trip[];
  onSave: () => void;
  onCancel: () => void;
}

export function TripForm({ initialValues, editingId, existingTrips, onSave, onCancel }: Props): JSX.Element {
  const [country, setCountry] = useState(initialValues?.country ?? '');
  const [arrival, setArrival] = useState(initialValues?.arrival ?? '');
  const [departure, setDeparture] = useState(initialValues?.departure ?? '');
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!country) {
      setError('Please select a country.');
      return;
    }

    const values: TripFormValues = { country, arrival, departure };
    const result = validateTrip(values, existingTrips, editingId);
    if (!result.valid) {
      setError(result.error);
      return;
    }

    setError(undefined);

    const tripData = {
      country,
      arrival,
      departure: departure || null,
    };

    if (editingId) {
      await updateTrip(editingId, tripData);
    } else {
      await addTrip(tripData);
    }

    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-gray-300 text-sm font-medium">Country</label>
        <CountrySelect value={country} onChange={setCountry} placeholder="Select a country" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-300 text-sm font-medium" htmlFor="arrival">Arrival Date</label>
        <input
          id="arrival"
          type="date"
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
          className="bg-gray-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-300 text-sm font-medium" htmlFor="departure">Departure Date (leave blank for ongoing)</label>
        <input
          id="departure"
          type="date"
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          className="bg-gray-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-300 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-500 transition-colors">
          {editingId ? 'Update' : 'Add Trip'}
        </button>
      </div>
    </form>
  );
}
