import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addTrip, updateTrip, deleteTrip, replaceAllTrips } from '../src/db/tripOperations';
import type { Trip } from '../src/db/types';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

// Mock the database
const mockTripsTable = {
  add: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  bulkAdd: vi.fn(),
};

const mockTransaction = vi.fn(async (_mode: string, _tables: unknown, callback: () => Promise<void>) => {
  await callback();
});

vi.mock('../src/db/database', () => ({
  db: {
    trips: {
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      bulkAdd: vi.fn(),
    },
    transaction: vi.fn(async (_mode: string, _tables: unknown, callback: () => Promise<void>) => {
      await callback();
    }),
  },
}));

// Import db after mocking so we get the mocked version
import { db } from '../src/db/database';

const sampleTripData: Omit<Trip, 'id'> = {
  country: 'Paris',
  arrival: '2024-06-01',
  departure: '2024-06-10',
};

const sampleTrip: Trip = {
  id: 'existing-id-1',
  country: 'Paris',
  arrival: '2024-06-01',
  departure: '2024-06-10',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('addTrip', () => {
  it('returns the generated UUID as the new trip id', async () => {
    (db.trips.add as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const id = await addTrip(sampleTripData);

    expect(id).toBe('mock-uuid-1234');
  });

  it('calls db.trips.add with the trip data merged with the generated id', async () => {
    (db.trips.add as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await addTrip(sampleTripData);

    expect(db.trips.add).toHaveBeenCalledOnce();
    expect(db.trips.add).toHaveBeenCalledWith({
      ...sampleTripData,
      id: 'mock-uuid-1234',
    });
  });

  it('does not include any extra fields beyond what was provided plus id', async () => {
    (db.trips.add as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await addTrip(sampleTripData);

    const callArg = (db.trips.add as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Object.keys(callArg)).toEqual(expect.arrayContaining(['id', 'country', 'arrival', 'departure']));
  });

  it('propagates errors thrown by db.trips.add', async () => {
    const dbError = new Error('IndexedDB write failed');
    (db.trips.add as ReturnType<typeof vi.fn>).mockRejectedValue(dbError);

    await expect(addTrip(sampleTripData)).rejects.toThrow('IndexedDB write failed');
  });

  it('works with minimal trip data', async () => {
    (db.trips.add as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const minimalTrip: Omit<Trip, 'id'> = {
      country: 'Tokyo',
      arrival: '2024-01-01',
      departure: '2024-01-02',
    };

    const id = await addTrip(minimalTrip);

    expect(id).toBe('mock-uuid-1234');
    expect(db.trips.add).toHaveBeenCalledWith({ ...minimalTrip, id: 'mock-uuid-1234' });
  });
});

describe('updateTrip', () => {
  it('calls db.trips.update with the correct id and changes', async () => {
    (db.trips.update as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const changes = { country: 'Berlin' };
    await updateTrip('existing-id-1', changes);

    expect(db.trips.update).toHaveBeenCalledOnce();
    expect(db.trips.update).toHaveBeenCalledWith('existing-id-1', changes);
  });

  it('resolves without returning a value', async () => {
    (db.trips.update as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await updateTrip('existing-id-1', { country: 'Rome' });

    expect(result).toBeUndefined();
  });

  it('can update multiple fields at once', async () => {
    (db.trips.update as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const changes = { country: 'Madrid', arrival: '2024-07-01', departure: '2024-07-15' };
    await updateTrip('existing-id-1', changes);

    expect(db.trips.update).toHaveBeenCalledWith('existing-id-1', changes);
  });

  it('can update with an empty changes object', async () => {
    (db.trips.update as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await updateTrip('existing-id-1', {});

    expect(db.trips.update).toHaveBeenCalledWith('existing-id-1', {});
  });

  it('propagates errors thrown by db.trips.update', async () => {
    const dbError = new Error('Update failed');
    (db.trips.update as ReturnType<typeof vi.fn>).mockRejectedValue(dbError);

    await expect(updateTrip('existing-id-1', { country: 'Lisbon' })).rejects.toThrow('Update failed');
  });

  it('works with a non-existent id without throwing', async () => {
    // Dexie returns 0 when no record is updated but does not throw
    (db.trips.update as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    await expect(updateTrip('non-existent-id', { country: 'Oslo' })).resolves.toBeUndefined();
  });
});

describe('deleteTrip', () => {
  it('calls db.trips.delete with the correct id', async () => {
    (db.trips.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await deleteTrip('existing-id-1');

    expect(db.trips.delete).toHaveBeenCalledOnce();
    expect(db.trips.delete).toHaveBeenCalledWith('existing-id-1');
  });

  it('resolves without returning a value', async () => {
    (db.trips.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await deleteTrip('existing-id-1');

    expect(result).toBeUndefined();
  });

  it('propagates errors thrown by db.trips.delete', async () => {
    const dbError = new Error('Delete failed');
    (db.trips.delete as ReturnType<typeof vi.fn>).mockRejectedValue(dbError);

    await expect(deleteTrip('existing-id-1')).rejects.toThrow('Delete failed');
  });

  it('does not throw when deleting a non-existent id', async () => {
    // Dexie resolves silently for missing keys
    (db.trips.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await expect(deleteTrip('non-existent-id')).resolves.toBeUndefined();
    expect(db.trips.delete).toHaveBeenCalledWith('non-existent-id');
  });
});

describe('replaceAllTrips', () => {
  it('runs inside a read-write transaction on the trips table', async () => {
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await replaceAllTrips([sampleTrip]);

    expect(db.transaction).toHaveBeenCalledOnce();
    expect(db.transaction).toHaveBeenCalledWith('rw', db.trips, expect.any(Function));
  });

  it('clears the trips table before adding new trips', async () => {
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await replaceAllTrips([sampleTrip]);

    expect(db.trips.clear).toHaveBeenCalledOnce();
  });

  it('bulk-adds all provided trips after clearing', async () => {
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const trips: Trip[] = [
      { id: 'id-1', country: 'Paris', arrival: '2024-06-01', departure: '2024-06-10' },
      { id: 'id-2', country: 'London', arrival: '2024-07-01', departure: '2024-07-05' },
    ];

    await replaceAllTrips(trips);

    expect(db.trips.bulkAdd).toHaveBeenCalledOnce();
    expect(db.trips.bulkAdd).toHaveBeenCalledWith(trips);
  });

  it('calls clear before bulkAdd', async () => {
    const callOrder: string[] = [];
    (db.trips.clear as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('clear');
    });
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('bulkAdd');
    });

    await replaceAllTrips([sampleTrip]);

    expect(callOrder).toEqual(['clear', 'bulkAdd']);
  });

  it('works with an empty array, clearing all trips and adding none', async () => {
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await replaceAllTrips([]);

    expect(db.trips.clear).toHaveBeenCalledOnce();
    expect(db.trips.bulkAdd).toHaveBeenCalledWith([]);
  });

  it('resolves without returning a value', async () => {
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await replaceAllTrips([sampleTrip]);

    expect(result).toBeUndefined();
  });

  it('propagates errors thrown during the transaction', async () => {
    const dbError = new Error('Transaction failed');
    (db.transaction as ReturnType<typeof vi.fn>).mockRejectedValue(dbError);

    await expect(replaceAllTrips([sampleTrip])).rejects.toThrow('Transaction failed');
  });

  it('propagates errors thrown by db.trips.clear inside the transaction', async () => {
    // Re-establish the transaction mock to call the callback (clearAllMocks doesn't reset implementations)
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (_mode: string, _tables: unknown, callback: () => Promise<void>) => { await callback(); }
    );
    const clearError = new Error('Clear failed');
    (db.trips.clear as ReturnType<typeof vi.fn>).mockRejectedValue(clearError);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await expect(replaceAllTrips([sampleTrip])).rejects.toThrow('Clear failed');
  });

  it('propagates errors thrown by db.trips.bulkAdd inside the transaction', async () => {
    // Re-establish the transaction mock to call the callback
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (_mode: string, _tables: unknown, callback: () => Promise<void>) => { await callback(); }
    );
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const bulkAddError = new Error('BulkAdd failed');
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockRejectedValue(bulkAddError);

    await expect(replaceAllTrips([sampleTrip])).rejects.toThrow('BulkAdd failed');
  });

  it('handles a large array of trips', async () => {
    // Re-establish the transaction mock to call the callback
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (_mode: string, _tables: unknown, callback: () => Promise<void>) => { await callback(); }
    );
    (db.trips.clear as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.trips.bulkAdd as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const manyTrips: Trip[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `id-${i}`,
      country: `Destination ${i}`,
      arrival: '2024-01-01',
      departure: '2024-01-10',
    }));

    await replaceAllTrips(manyTrips);

    expect(db.trips.clear).toHaveBeenCalledOnce();
    expect(db.trips.bulkAdd).toHaveBeenCalledWith(manyTrips);
  });
});