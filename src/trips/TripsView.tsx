import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { db } from '../db/database';
import { addTrip, updateTrip, deleteTrip } from '../db/tripOperations';
import type { Trip } from '../db/types';
import { TripForm } from './TripForm';
import { TripRow } from './TripRow';
import { exportTripsToJSON, parseImportFile } from './tripIO';
import type { TripFormValues } from './types';

export function TripsView(): JSX.Element {
  const trips = useLiveQuery(() => db.trips.toArray(), []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddClick() {
    setEditingTripId(null);
    setIsFormOpen(true);
  }

  function handleEditClick(id: string) {
    setEditingTripId(id);
    setIsFormOpen(true);
  }

  async function handleFormSave() {
    setIsFormOpen(false);
    setEditingTripId(null);
  }

  function handleFormCancel() {
    setIsFormOpen(false);
    setEditingTripId(null);
  }

  async function handleDelete(id: string) {
    await deleteTrip(id);
  }

  function handleExport() {
    if (!trips) return;
    exportTripsToJSON(trips);
  }

  function handleImportClick() {
    setImportError(null);
    setImportSuccess(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const raw = await file.text();
    const { trips: importedTrips, error } = parseImportFile(raw);

    if (error) {
      setImportError(error);
      setImportSuccess(null);
      return;
    }

    try {
      await db.trips.bulkPut(importedTrips);
      setImportSuccess(`Imported ${importedTrips.length} trip${importedTrips.length !== 1 ? 's' : ''}.`);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import trips.');
      setImportSuccess(null);
    }
  }

  const sortedTrips = trips ? [...trips].sort((a, b) => b.arrival.localeCompare(a.arrival)) : [];
  const editingTrip = editingTripId ? sortedTrips.find((t) => t.id === editingTripId) : undefined;

  const editingInitial: TripFormValues | undefined = editingTrip
    ? { country: editingTrip.country, arrival: editingTrip.arrival, departure: editingTrip.departure ?? '' }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Trips</h2>
        <div className="flex gap-2">
          <button onClick={handleImportClick} className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-600">
            Import
          </button>
          <button onClick={handleExport} className="rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-600">
            Export
          </button>
          <button onClick={handleAddClick} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-500">
            Add Trip
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />

      {importError && <p className="text-sm text-red-400">{importError}</p>}
      {importSuccess && <p className="text-sm text-green-400">{importSuccess}</p>}

      {isFormOpen && (
        <div className="rounded-lg bg-gray-900 p-4">
          <TripForm
            initialValues={editingInitial}
            editingId={editingTripId ?? undefined}
            existingTrips={trips ?? []}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {trips === undefined && <p className="text-gray-500">Loading trips...</p>}

      {trips !== undefined && sortedTrips.length === 0 && !isFormOpen && (
        <p className="text-gray-500">No trips recorded yet.</p>
      )}

      {sortedTrips.length > 0 && (
        <div className="space-y-2">
          {sortedTrips.map((trip) => (
            <TripRow key={trip.id} trip={trip} onEdit={handleEditClick} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
