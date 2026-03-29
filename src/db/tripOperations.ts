import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { Trip } from './types';

export async function addTrip(trip: Omit<Trip, 'id'>): Promise<string> {
  const id = uuidv4();
  await db.trips.add({ ...trip, id });
  return id;
}

export async function updateTrip(id: string, changes: Partial<Omit<Trip, 'id'>>): Promise<void> {
  await db.trips.update(id, changes);
}

export async function deleteTrip(id: string): Promise<void> {
  await db.trips.delete(id);
}

export async function replaceAllTrips(trips: Trip[]): Promise<void> {
  await db.transaction('rw', db.trips, async () => {
    await db.trips.clear();
    await db.trips.bulkAdd(trips);
  });
}