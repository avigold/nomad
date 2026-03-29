import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Dexie from 'dexie';
import 'fake-indexeddb/auto';

// Mock defaults before importing the module under test
vi.mock('../src/db/defaults', () => ({
  DEFAULT_COUNTRY_RULES: [
    {
      country: 'FR',
      name: 'France',
      threshold: 90,
      window: 180,
    },
    {
      country: 'DE',
      name: 'Germany',
      threshold: 90,
      window: 180,
    },
  ],
}));

// Import after mocks are set up
import { NomadDatabase, db } from '../src/db/database';
import { DEFAULT_COUNTRY_RULES } from '../src/db/defaults';

describe('NomadDatabase', () => {
  describe('constructor and schema', () => {
    it('creates a database named NomadDB', () => {
      const instance = new NomadDatabase();
      expect(instance.name).toBe('NomadDB');
    });

    it('exposes a trips table', () => {
      const instance = new NomadDatabase();
      expect(instance.trips).toBeDefined();
    });

    it('exposes a rules table', () => {
      const instance = new NomadDatabase();
      expect(instance.rules).toBeDefined();
    });

    it('extends Dexie', () => {
      const instance = new NomadDatabase();
      expect(instance).toBeInstanceOf(Dexie);
    });
  });

  describe('trips table operations', () => {
    let testDb: NomadDatabase;

    beforeEach(async () => {
      testDb = new NomadDatabase();
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('can add and retrieve a trip', async () => {
      const trip = {
        id: 'trip-1',
        country: 'FR',
        arrival: '2024-01-01',
        departure: '2024-01-10',
      };

      await testDb.trips.add(trip as any);
      const retrieved = await testDb.trips.get('trip-1');

      expect(retrieved).toMatchObject(trip);
    });

    it('can add multiple trips and retrieve them all', async () => {
      const trips = [
        { id: 'trip-1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: 'trip-2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-15' },
      ];

      await testDb.trips.bulkAdd(trips as any[]);
      const all = await testDb.trips.toArray();

      expect(all).toHaveLength(2);
    });

    it('can delete a trip by id', async () => {
      const trip = { id: 'trip-del', country: 'FR', arrival: '2024-01-01', departure: '2024-01-05' };
      await testDb.trips.add(trip as any);
      await testDb.trips.delete('trip-del');

      const retrieved = await testDb.trips.get('trip-del');
      expect(retrieved).toBeUndefined();
    });

    it('can update a trip', async () => {
      const trip = { id: 'trip-upd', country: 'FR', arrival: '2024-01-01', departure: '2024-01-05' };
      await testDb.trips.add(trip as any);
      await testDb.trips.update('trip-upd', { departure: '2024-01-20' });

      const updated = await testDb.trips.get('trip-upd');
      expect(updated?.departure).toBe('2024-01-20');
    });

    it('returns undefined for a non-existent trip id', async () => {
      const result = await testDb.trips.get('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('can query trips by country index', async () => {
      const trips = [
        { id: 'trip-1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: 'trip-2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-15' },
        { id: 'trip-3', country: 'FR', arrival: '2024-03-01', departure: '2024-03-10' },
      ];
      await testDb.trips.bulkAdd(trips as any[]);

      const frTrips = await testDb.trips.where('country').equals('FR').toArray();
      expect(frTrips).toHaveLength(2);
      expect(frTrips.every((t: any) => t.country === 'FR')).toBe(true);
    });

    it('throws on duplicate trip id', async () => {
      const trip = { id: 'dup-id', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' };
      await testDb.trips.add(trip as any);

      await expect(testDb.trips.add(trip as any)).rejects.toThrow();
    });
  });

  describe('rules table operations', () => {
    let testDb: NomadDatabase;

    beforeEach(async () => {
      testDb = new NomadDatabase();
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('can add and retrieve a rule by country code', async () => {
      const rule = { country: 'ES', name: 'Spain', threshold: 90, window: 180 };
      await testDb.rules.add(rule as any);

      const retrieved = await testDb.rules.get('ES');
      expect(retrieved).toMatchObject(rule);
    });

    it('can update an existing rule', async () => {
      const rule = { country: 'IT', name: 'Italy', threshold: 90, window: 180 };
      await testDb.rules.add(rule as any);
      await testDb.rules.update('IT', { threshold: 60 });

      const updated = await testDb.rules.get('IT');
      expect(updated?.threshold).toBe(60);
    });

    it('returns undefined for a non-existent country code', async () => {
      const result = await testDb.rules.get('ZZ');
      expect(result).toBeUndefined();
    });

    it('can delete a rule by country code', async () => {
      const rule = { country: 'PT', name: 'Portugal', threshold: 90, window: 180 };
      await testDb.rules.add(rule as any);
      await testDb.rules.delete('PT');

      const retrieved = await testDb.rules.get('PT');
      expect(retrieved).toBeUndefined();
    });

    it('throws on duplicate country key', async () => {
      const rule = { country: 'NL', name: 'Netherlands', threshold: 90, window: 180 };
      await testDb.rules.add(rule as any);

      await expect(testDb.rules.add(rule as any)).rejects.toThrow();
    });
  });

  describe('populate hook (seedDefaults)', () => {
    it('seeds DEFAULT_COUNTRY_RULES into the rules table on first open', async () => {
      const freshDb = new NomadDatabase();
      await freshDb.open();

      const rules = await freshDb.rules.toArray();

      expect(rules).toHaveLength(DEFAULT_COUNTRY_RULES.length);

      for (const defaultRule of DEFAULT_COUNTRY_RULES) {
        const found = rules.find((r: any) => r.country === defaultRule.country);
        expect(found).toBeDefined();
        expect(found).toMatchObject(defaultRule);
      }

      await freshDb.delete();
    });

    it('seeds rules with correct country codes', async () => {
      const freshDb = new NomadDatabase();
      await freshDb.open();

      const countryCodes = (await freshDb.rules.toArray()).map((r: any) => r.country);

      expect(countryCodes).toContain('FR');
      expect(countryCodes).toContain('DE');

      await freshDb.delete();
    });

    it('seeds rules with correct threshold and window values', async () => {
      const freshDb = new NomadDatabase();
      await freshDb.open();

      const frRule = await freshDb.rules.get('FR');
      expect(frRule?.threshold).toBe(90);
      expect(frRule?.window).toBe(180);

      await freshDb.delete();
    });

    it('does not re-seed rules when database already has data', async () => {
      // Open once to trigger populate
      const firstDb = new NomadDatabase();
      await firstDb.open();
      const initialCount = await firstDb.rules.count();
      await firstDb.close();

      // Re-open the same database (populate should not fire again)
      const secondDb = new NomadDatabase();
      await secondDb.open();
      const secondCount = await secondDb.rules.count();

      expect(secondCount).toBe(initialCount);

      await secondDb.delete();
    });
  });

  describe('db singleton export', () => {
    it('exports a NomadDatabase instance', () => {
      expect(db).toBeInstanceOf(NomadDatabase);
    });

    it('exports a Dexie instance', () => {
      expect(db).toBeInstanceOf(Dexie);
    });

    it('singleton has trips table', () => {
      expect(db.trips).toBeDefined();
    });

    it('singleton has rules table', () => {
      expect(db.rules).toBeDefined();
    });

    it('singleton database is named NomadDB', () => {
      expect(db.name).toBe('NomadDB');
    });

    it('exports the same instance on multiple imports', async () => {
      const { db: db2 } = await import('../src/db/database');
      expect(db).toBe(db2);
    });
  });

  describe('database version', () => {
    it('opens at version 1', async () => {
      const testDb = new NomadDatabase();
      await testDb.open();

      expect(testDb.verno).toBe(1);

      await testDb.delete();
    });
  });

  describe('trips table — edge cases', () => {
    let testDb: NomadDatabase;

    beforeEach(async () => {
      testDb = new NomadDatabase();
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('returns empty array when no trips exist', async () => {
      const trips = await testDb.trips.toArray();
      expect(trips).toHaveLength(0);
    });

    it('count returns 0 for empty trips table', async () => {
      const count = await testDb.trips.count();
      expect(count).toBe(0);
    });

    it('count returns correct number after adding trips', async () => {
      await testDb.trips.bulkAdd([
        { id: 't1', country: 'FR', arrival: '2024-01-01', departure: '2024-01-10' },
        { id: 't2', country: 'DE', arrival: '2024-02-01', departure: '2024-02-10' },
      ] as any[]);

      expect(await testDb.trips.count()).toBe(2);
    });
  });

  describe('rules table — edge cases', () => {
    let testDb: NomadDatabase;

    beforeEach(async () => {
      testDb = new NomadDatabase();
      await testDb.open();
    });

    afterEach(async () => {
      await testDb.delete();
    });

    it('can bulk add multiple rules', async () => {
      const rules = [
        { country: 'AA', name: 'Alpha', threshold: 30, window: 90 },
        { country: 'BB', name: 'Beta', threshold: 60, window: 120 },
      ];

      await testDb.rules.bulkAdd(rules as any[]);
      const count = await testDb.rules.count();

      // Seeded defaults + 2 new rules
      expect(count).toBe(DEFAULT_COUNTRY_RULES.length + 2);
    });

    it('can clear all rules', async () => {
      await testDb.rules.clear();
      const count = await testDb.rules.count();
      expect(count).toBe(0);
    });
  });
});