import type { CountryRule } from './types';
import { db } from './database';

export async function addRule(rule: CountryRule): Promise<void> {
  await db.rules.add(rule);
}

export async function updateRule(
  country: string,
  changes: Partial<Omit<CountryRule, 'country'>>
): Promise<void> {
  await db.rules.update(country, changes);
}

export async function deleteRule(country: string): Promise<void> {
  await db.rules.delete(country);
}