# Garage Hub — Frontend

React SPA for Garage Hub. See the repo root `CLAUDE.md` for the
project-wide overview, documentation-language rule, and comment
philosophy — this file covers frontend-specific architecture,
commands, and conventions.

**Status:** fresh Vite scaffold, no feature code yet. The
feature-based structure and conventions below are the intended target
this project will grow into, not what exists today — expect them to
be refined once real features land. Some tooling referenced here
(Vitest, Playwright) isn't installed yet; that's called out where
relevant.

## Tech stack

- **React 19** with the **React Compiler** enabled (impacts dev/build
  perf, see `frontend/README.md`)
- **Vite** — build tool, **TypeScript**
- **TanStack Router** — file-based routing, code-split per route
- **TanStack Query** — server state / data fetching
- **React Hook Form + Zod** (`@hookform/resolvers`) — forms and validation
- **shadcn/ui** (`base-nova` style) on **Tailwind CSS v4** — component library, icons via `lucide-react`
- **pnpm** — package manager (this is a pnpm workspace root, see `pnpm-workspace.yaml`)

## Essential commands

Run from `frontend/`:

```bash
pnpm dev       # start the dev server
pnpm build     # tsc -b && vite build
pnpm lint      # eslint .
pnpm preview   # preview the production build
```

`pnpm test` (Vitest) and an E2E command (Playwright) aren't set up
yet — add them alongside the test setup described below.

## Environment variables

| Variable       | Purpose                                                        | Default                 |
| --------------- | ---------------------------------------------------------------- | -------------------------- |
| `VITE_API_URL`  | Base URL of the backend API, used by the dev proxy and the services layer | `http://localhost:8080`   |

Only client-safe values belong in `VITE_*` variables — anything Vite
exposes this way ends up in the client bundle.

## Project structure: features

Code is organized by **feature**, not by technical layer — no
project-wide `domain/`, `services/`, or `store/` split. Each feature
is a self-contained folder under `src/features/`:

```
src/features/cars/
├── contracts/
│   └── car.contract.ts        # exact API shape — single source of truth for types
├── enums/
│   └── fuel-type.enum.ts      # e.g. GASOLINE, ETHANOL, FLEX, ELECTRIC
├── schemas/
│   └── car.schema.ts          # Zod validation schemas
├── services/
│   └── carsApi.ts             # API calls
├── hooks/
│   └── useCars.ts             # TanStack Query hooks
├── rules/
│   ├── car.rules.ts           # pure business logic, no state/API
│   └── car.rules.test.ts      # co-located test
└── index.ts                   # feature's public API (barrel)
```

Shared, cross-feature code stays outside `features/`:

- `src/components/ui/` — shadcn/ui primitives (see `components.json`)
- `src/lib/` — generic helpers only (`cn()`, and similar) — no
  domain/feature-specific logic
- `src/routes/` — TanStack Router file-based routes
- `src/integrations/` — third-party wiring (e.g. `tanstack-query/`)

This structure isn't concrete yet (nothing has been built with it),
but start here and refactor if a feature outgrows it.

### Key rules

- A feature's `rules/` may **only `import type`** from that feature's
  own `contracts/` — no runtime imports from `services/`,
  `components/`, or `hooks/`. This keeps business logic pure and
  testable without mocking the network.
- A feature's `services/` must **never** import from that feature's
  `rules/` — the direction is unilateral: `services` produces data
  shaped by `contracts`, `rules` consumes `contracts` types to make
  decisions.
- Cross-feature imports go through the target feature's `index.ts`
  barrel only — never reach into another feature's internal folders
  (`features/parts/services/...` from inside `features/cars/`).
- `src/lib/` is for **generic** helpers only — domain-specific logic
  belongs in the owning feature's `rules/`.
- Tests are co-located: `{feature}.test.ts` next to `{feature}.ts`
  (typically inside `rules/`, where the pure logic worth unit-testing
  lives).

These boundaries aren't ESLint-enforced yet (no
`@typescript-eslint/no-restricted-imports` rule for this) — add that
once the first couple of features exist and the boundary is real
rather than aspirational.

### Feature-prefixed enums

Different features can end up with overlapping concepts (a `STATUS`
on both `cars` and `parts`, for instance). To avoid ambiguity once
that happens, prefix enum names with a short feature code:

- `CAR_` — cars (`car/`)
- `MTN_` — maintenance (`car/maintenance` equivalent, if it becomes
  its own feature)
- `PRT_` — parts
- `USR_` — user
- `EVT_` — events

```ts
// features/cars/enums/fuel-type.enum.ts
import type { CarFuelType } from '@/features/cars/contracts/car.contract'

export const CAR_FUEL_TYPE = {
  GASOLINE: 'GASOLINE',
  ETHANOL: 'ETHANOL',
  FLEX: 'FLEX',
  ELECTRIC: 'ELECTRIC',
} as const satisfies Record<string, CarFuelType>
```

Bind the const object to the contract's literal-union type with
`as const satisfies Record<string, ContractType>`, so a backend
contract change breaks the build instead of silently drifting. Only
add an options array (`carFuelTypeOptions`) when a dropdown or
multi-select actually needs one — don't build it ahead of that need.

### Type architecture

**`features/{feature}/contracts/` is the single source of truth for
that feature's entity types and enum literal unions.** There's no
separate domain-types or models layer.

1. **No mappers** — services return the backend response type
   directly; only transform the shape if it genuinely differs.
2. **No duplicate entity types** — `rules/`, `schemas/`, and
   `components/` import the type from `contracts/`, they don't
   redeclare it.
3. **Enums bind to contract types via `satisfies`** (see above) so a
   backend change propagates through the type system.
4. **Backend shapes are frontend types** — mirror the backend
   DTO/projection as-is; don't unify two backend representations the
   backend itself hasn't unified.
5. **Structural typing for shared components** — a component that
   works across entity variants takes the minimal inline shape it
   needs instead of importing one specific contract type:

   ```tsx
   type Props = { car: { id: number; name: string } }
   ```

6. **Optional over nullable** — if the backend (Jackson) omits null
   fields from JSON instead of sending `null`, model them as
   `prop?: type`, not `prop: type | null`.

### Routing (TanStack Router)

File-based routes under `src/routes/`, using layout groups
(underscore prefix) once auth exists:

- `_authenticated` — wrapped with an auth guard, redirects to the
  login route if there's no valid token
- `_unauthenticated` — login/recovery flows, redirects away if
  already logged in
- `_public` — accessible either way

```tsx
export const Route = createFileRoute('/_authenticated/cars')({
  component: CarsPage,
})
```

Guards live in `src/components/guards/` (not created yet) and read
auth state to decide whether to redirect.

### Forms (React Hook Form + Zod)

Standard pattern: a Zod schema drives `zodResolver`, fields go through
`Controller` into a shadcn/ui form component.

```tsx
const { control } = useForm<Schema>({
  resolver: zodResolver(carSchema),
})

<Controller
  control={control}
  name="name"
  render={({ field, fieldState }) => (
    <Input {...field} aria-invalid={!!fieldState.error} />
  )}
/>
```

Reach for `src/components/ui/` (shadcn) form primitives directly —
there's no custom `Ui*`-prefixed wrapper library in this project.

### Services layer

No HTTP client is installed yet (no `axios` in `package.json`) — the
plan is a thin `fetch` wrapper per feature, calling the API under an
`/api` prefix that the dev server proxies to `VITE_API_URL` (proxy not
yet configured in `vite.config.ts`):

```ts
// features/cars/services/carsApi.ts
export const carsApi = {
  list: () => fetch('/api/cars').then(r => r.json()),
}
```

Import a feature's services only through that feature's `services/`
folder or its `index.ts` barrel — never call `fetch` directly from a
component.

## Testing strategy (TDD, two layers)

TDD is mandatory: write the failing test before the implementation.

1. **Unit** (Vitest — not yet installed) — co-located as
   `{feature}.test.ts` next to the file it covers, primarily testing
   `rules/` (pure logic) and hooks.
2. **E2E** (Playwright — not yet installed) — drives the real app
   (this frontend against the real backend) through critical user
   flows end to end, in a separate top-level `e2e/` directory once
   added.
