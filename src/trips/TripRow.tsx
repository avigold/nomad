import type { Trip } from '../db/types';
import { formatDateRange, tripDurationDays } from '../calculations/date-utils';
import { getCountryMeta } from '../calculations/countries';

interface Props {
  trip: Trip;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TripRow({ trip, onEdit, onDelete }: Props): JSX.Element {
  const days = tripDurationDays(trip.arrival, trip.departure);
  const meta = getCountryMeta(trip.country);
  const dateRange = formatDateRange(trip.arrival, trip.departure);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-900 p-4">
      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        <span className="font-semibold text-white">{meta.flag} {meta.name}</span>
        <span className="text-gray-300">{dateRange}</span>
        <span className="text-gray-500">{days} {days === 1 ? 'day' : 'days'}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(trip.id)}
          className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(trip.id)}
          className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-red-700 hover:text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
