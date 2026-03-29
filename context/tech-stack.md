---
type: tech_stack
---

# Tech Stack

## Runtime & Build

- **Vite** — dev server and production bundler (latest stable)
- **TypeScript** — strict mode enabled
- **React 18** — functional components only, no class components
- **Tailwind CSS v3** — utility-first styling, no component library (no MUI, Chakra, etc.)

## Persistence

- **Dexie.js** — IndexedDB wrapper for client-side persistence
  - One database: `NomadDB`
  - Two object stores: `trips` (keyPath: `id`) and `rules` (keyPath: `country`)
  - Dexie was chosen over raw IndexedDB for its clean Promise-based API and over localStorage for structured querying and larger storage limits
  - Version the schema starting at version 1

## Testing

- **Vitest** — test runner, compatible with Vite
- **React Testing Library** — component tests
- **jsdom** — test environment
- Tests live in a top-level `tests/` directory, mirroring the source structure

## Code Quality

- **ESLint** — with `@typescript-eslint` and `eslint-plugin-react-hooks`
- **Prettier** — code formatting (configured in `package.json`, not a separate file)

## Key Libraries (no others unless truly necessary)

| Library | Purpose | Why |
|---------|---------|-----|
| `react` + `react-dom` | UI framework | Required |
| `dexie` + `dexie-react-hooks` | IndexedDB persistence | Clean async DB API + `useLiveQuery` for reactive data |
| `date-fns` | Date arithmetic (differenceInDays, addDays, format, parse, isWithinInterval) | Lightweight, tree-shakeable, no-moment.js bloat |
| `uuid` | Generate trip IDs | Tiny, standard |

## Do NOT Include

- No routing library (react-router, etc.) — use simple state-based view switching
- No state management library (Redux, Zustand, etc.) — React state + Dexie live queries are sufficient
- No CSS-in-JS (styled-components, emotion, etc.) — Tailwind only
- No component library (MUI, Ant Design, Shadcn, etc.) — hand-built with Tailwind
- No backend framework, no API routes, no server
