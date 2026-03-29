import Dexie from 'dexie';
import type { Trip, CountryRule } from './types';
import { DEFAULT_COUNTRY_RULES } from './defaults';

export class NomadDatabase extends Dexie {
  trips!: Dexie.Table<Trip, string>;
  rules!: Dexie.Table<CountryRule, string>;

  constructor() {
    super('NomadDB');
    this.version(1).stores({
      trips: 'id, country, arrival, departure',
      rules: 'country, name, threshold, window',
    });
    this.on('populate', seedDefaults);
  }
}

async function seedDefaults(tx: Dexie.Transaction): Promise<void> {
  await tx.table('rules').bulkAdd(DEFAULT_COUNTRY_RULES as CountryRule[]);
}

export const db = new NomadDatabase();