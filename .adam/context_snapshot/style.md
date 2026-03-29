# Coding Style

## TypeScript

- Strict mode (`"strict": true` in tsconfig).
- Prefer `interface` for object shapes, `type` for unions and intersections.
- No `any` — use `unknown` if the type is truly unknown.
- No enums — use string literal union types instead.
- Named exports for everything (no default exports except for the Vite-required main entry).
- Destructure props in function signatures.

## React

- Functional components only.
- Use `function` declarations for components, not arrow functions:
  ```tsx
  // Good
  export function CountryCard({ status }: Props): JSX.Element { ... }

  // Avoid
  export const CountryCard: React.FC<Props> = ({ status }) => { ... }
  ```
- Keep components small. If a component exceeds ~80 lines, split it.
- Colocate component-specific types in the same file (e.g. the `Props` interface).
- Use early returns for empty/loading states at the top of components.
- Do not add inline comments unless the logic is genuinely non-obvious.
- No `useEffect` for derived state — compute it inline or with `useMemo`.

## Tailwind

- All styling via Tailwind utility classes — no custom CSS except the Tailwind directives in globals.css.
- Use a dark theme:
  - Background: `bg-gray-950` (page), `bg-gray-900` (cards/panels), `bg-gray-800` (inputs/interactive)
  - Text: `text-white` (headings), `text-gray-300` (body), `text-gray-500` (muted/secondary)
  - Accent: `text-blue-400` / `bg-blue-600` for primary actions
  - Danger: `text-red-400` / `bg-red-600`
  - Warning: `text-amber-400`
  - Success: `text-emerald-400`
- Consistent spacing: `p-4` for card padding, `gap-4` between cards, `gap-2` within cards.
- Rounded corners: `rounded-lg` for cards, `rounded` for buttons and inputs.
- Transitions: `transition-colors` on interactive elements.

## Testing

- Test file naming: `ComponentName.test.tsx` or `module-name.test.ts`.
- Use `describe` / `it` blocks.
- Prioritise testing pure logic (`calculations.ts`) over UI rendering.
- For component tests, test user-visible behaviour, not implementation details.
- Mock Dexie in component tests (don't hit real IndexedDB).

## File Organisation

- One component per file.
- Types for a module live in the module's directory or in `db/types.ts` for data model types.
- Shared utilities in `shared/`.
- No barrel files (`index.ts` re-exports) — import directly from the source file.