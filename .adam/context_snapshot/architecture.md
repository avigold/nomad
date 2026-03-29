# Architecture

## Directory Structure

```
nomad/
  index.html
  vite.config.ts
  tsconfig.json
  tailwind.config.js
  postcss.config.js
  package.json
  src/
    main.tsx                    # ReactDOM.createRoot, render <App />
    globals.css                 # Tailwind directives (@tailwind base/components/utilities)
    app/
      App.tsx                   # Top-level: NavBar + view switcher
      NavBar.tsx                # Navigation: Dashboard | Trips | Rules
    db/
      database.ts               # Dexie DB instance, schema, default data seeding
      types.ts                  # Trip, CountryRule, and related TypeScript types
    dashboard/
      Dashboard.tsx             # Main dashboard view
      CountryCard.tsx           # Single country card with progress bar
      ProgressBar.tsx           # Reusable progress bar component (green/amber/red)
    trips/
      TripsView.tsx             # Trip list view + add/edit form
      TripForm.tsx              # Add/edit trip form (inline, not modal)
      TripRow.tsx               # Single trip row in the list
    rules/
      RulesView.tsx             # Rules table + add/edit form
      RuleForm.tsx              # Add/edit rule form (inline)
      RuleRow.tsx               # Single rule row in the table
    shared/
      CountrySelect.tsx         # Searchable country dropdown (used by TripForm and RuleForm)
      countries.ts              # Static list of countries: { code, name, flag } — all ISO 3166-1 alpha-2
      calculations.ts           # Pure functions: daysInWindow, daysRemaining, overlapDays, etc.
      date-utils.ts             # Thin wrappers around date-fns for formatting and parsing
  tests/
    db/
      database.test.ts          # DB initialisation, seeding, CRUD
    dashboard/
      Dashboard.test.tsx
      CountryCard.test.tsx
      calculations.test.ts      # Unit tests for pure calculation functions (most important tests)
    trips/
      TripsView.test.tsx
      TripForm.test.tsx
    rules/
      RulesView.test.tsx
      RuleForm.test.tsx
    shared/
      CountrySelect.test.tsx
```

## Component Hierarchy

```
<App>
  <NavBar activeView onViewChange />
  {activeView === 'dashboard' && <Dashboard />}
  {activeView === 'trips' && <TripsView />}
  {activeView === 'rules' && <RulesView />}
</App>
```

App manages `activeView` state (a union type: `'dashboard' | 'trips' | 'rules'`).

## Data Flow

1. **Dexie live queries** (`useLiveQuery` from `dexie-react-hooks`) are the primary data source. Components subscribe to DB tables and re-render automatically when data changes.
2. **No prop drilling for data.** Each view queries the DB directly via hooks. Only UI state (like "which trip is being edited") lives in React component state.
3. **Writes go directly to Dexie.** When the user adds/edits/deletes a trip or rule, the component calls Dexie methods directly (`db.trips.add(...)`, `db.trips.update(...)`, `db.trips.delete(...)`). The live query automatically picks up the change.

## Calculation Architecture

All calculation logic lives in `shared/calculations.ts` as pure functions:

```typescript
// Core calculation: how many days has the user spent in a country
// within the rolling window ending on referenceDate?
function daysInWindow(
  trips: Trip[],
  country: string,
  windowDays: number,
  referenceDate: Date
): number

// Compute overlap between a trip and a date range [windowStart, windowEnd]
function overlapDays(
  tripArrival: Date,
  tripDeparture: Date,  // use "today" if trip is ongoing
  windowStart: Date,
  windowEnd: Date
): number

// Full status for a country
interface CountryStatus {
  country: string;
  name: string;
  flag: string;
  daysPresent: number;
  threshold: number;
  windowDays: number;
  daysRemaining: number;    // negative if exceeded
  percentage: number;        // 0.0 to 1.0
  level: 'safe' | 'warning' | 'danger' | 'exceeded';
  windowStart: Date;
  windowEnd: Date;
}

function computeCountryStatus(
  trips: Trip[],
  rule: CountryRule,
  referenceDate: Date
): CountryStatus
```

These functions are pure (no side effects, no DB access) and are the most important things to test.

## Persistence Layer

The Dexie database (`db/database.ts`) should:

1. Define the schema with `db.version(1).stores(...)`.
2. On first run (empty `rules` table), seed with the default country rules from the spec.
3. Export typed table accessors for `db.trips` and `db.rules`.

```typescript
import Dexie, { Table } from 'dexie';
import { Trip, CountryRule } from './types';

class NomadDB extends Dexie {
  trips!: Table<Trip, string>;
  rules!: Table<CountryRule, string>;

  constructor() {
    super('NomadDB');
    this.version(1).stores({
      trips: 'id, country, arrival, departure',
      rules: 'country',
    });
  }
}

export const db = new NomadDB();
```

## View Switching

No router. App.tsx holds `activeView` state:

```typescript
const [activeView, setActiveView] = useState<'dashboard' | 'trips' | 'rules'>('dashboard');
```

NavBar renders three buttons/tabs. The active one gets a visual indicator (e.g. underline + bold text).

## Error Handling

- Trip overlap validation happens in TripForm before saving. Show error inline.
- Dexie errors (e.g. storage quota) should be caught and shown as a toast or inline error.
- No global error boundary needed for this app size.

## Responsiveness

- Desktop-first but should work on tablet screens.
- Dashboard cards: CSS grid, 1 column on mobile, 2 on tablet, 3 on desktop.
- Trip and rule tables: horizontally scrollable on small screens.