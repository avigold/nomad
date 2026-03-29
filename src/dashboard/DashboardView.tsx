import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { computeCountryStatus } from '../calculations/engine';
import { CountryCard } from './CountryCard';
import { EmptyState } from './EmptyState';
import type { CountryStatus } from '../calculations/types';

export function DashboardView(): JSX.Element {
  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const rules = useLiveQuery(() => db.rules.toArray(), []);

  if (trips === undefined || rules === undefined) {
    return <div className="text-gray-300 p-4">Loading...</div>;
  }

  if (trips.length === 0) {
    return <EmptyState />;
  }

  const countriesWithTrips = new Set(trips.map((t) => t.country));
  const countriesWithRules = new Set(rules.map((r) => r.country));
  const allCountries = new Set([...countriesWithTrips, ...countriesWithRules]);

  const ruleMap = new Map(rules.map((r) => [r.country, r]));

  const statuses: CountryStatus[] = Array.from(allCountries).map((country) =>
    computeCountryStatus(country, trips, ruleMap.get(country) ?? null)
  );

  statuses.sort((a, b) => {
    const aExceeded = a.daysRemaining < 0;
    const bExceeded = b.daysRemaining < 0;
    if (aExceeded && !bExceeded) return -1;
    if (!aExceeded && bExceeded) return 1;
    return b.percentage - a.percentage;
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statuses.map((status) => (
        <CountryCard key={status.country} status={status} />
      ))}
    </div>
  );
}
