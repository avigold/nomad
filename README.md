# Nomad — Residency Day Tracker

A local-first web app for digital nomads who need to track how many days they've spent in each country within a rolling time window. The goal: avoid accidentally triggering de facto tax residency by exceeding a country's day-count threshold.

## Why

Many countries define tax residency as spending more than N days within a rolling M-day window (commonly 183 days in 365). If you're moving between countries regularly, it's surprisingly easy to lose track. Nomad gives you a simple dashboard that shows exactly where you stand for every country you've visited.

## Features

- **Dashboard** with per-country day counts and color-coded progress bars (green → amber → red)
- **Trip logging** with arrival/departure dates, country search, overlap validation
- **Configurable rules** — set custom thresholds and rolling windows per country
- **Rolling window calculations** with inclusive day counting
- **JSON export/import** for backing up and restoring trip data
- **Offline-first** — all data stored locally in IndexedDB via Dexie, no server required
- **Dark theme** UI built with Tailwind CSS

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How It Works

For each country, Nomad calculates how many days you've been present within a rolling window (default: 365 days ending today). A trip from Jan 1 to Jan 3 counts as 3 days (inclusive on both ends). Ongoing trips (no departure date) count through today.

The dashboard shows a card for every country you've visited or configured a rule for:

| Status | Color | Threshold |
|--------|-------|-----------|
| Safe | Green | 0–59% |
| Warning | Amber | 60–84% |
| Danger | Red | 85%+ |
| Exceeded | Red | Over limit |

### Default Rules

Ships with sensible defaults for 12 common countries (US, UK, Portugal, Spain, France, Germany, Thailand, Canada, Australia, Japan, Netherlands, Italy). All default to 183 days / 365-day window except Thailand (180 days). You can add, edit, or delete rules.

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** for dev server and production builds
- **Tailwind CSS** for styling (dark theme)
- **Dexie.js** + `dexie-react-hooks` for IndexedDB persistence with reactive live queries
- **date-fns** for date arithmetic
- **Vitest** + **React Testing Library** for tests

No backend. No authentication. No network requests. Pure client-side SPA.

## Project Structure

```
src/
  app/           App shell and navigation
  dashboard/     Dashboard view with country cards and progress bars
  trips/         Trip management — list, add/edit form, country search, export/import
  rules/         Country rule management — table and form
  calculations/  Pure functions: day counting, overlap detection, window computation
  db/            Dexie database, types, CRUD operations, default data
```

## Testing

```bash
npm test
```

693 tests across 22 test files covering calculation logic, database operations, component rendering, form validation, and data import/export.

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server.

## License

MIT
