# AGENTS.md

TanStack Start fullstack template: React 19, TanStack Router/Start/Query, oRPC,
Drizzle ORM + PostgreSQL, better-auth, Shadcn UI (Base UI, `base-nova`), Tailwind
CSS v4, Vitest.

## Read First — Authoritative Rules

`CLAUDE.md` and `.claude/rules/*` are mandatory project instructions. Read the
relevant rule before changing code; this file only summarizes them.

- `knowledge-retrieval-and-honesty.md` — do not guess APIs from model memory.
  This stack changes fast; verify current docs via Context7, shadcn MCP,
  `tanstack ... --json`, or web search before implementing. State clearly what
  is verified vs. unknown.
- `code-style.md` — arrow functions only, explicit types, no `any`.
- `development-lifecycle.md` — schema → oRPC procedure → route loader → UI.
- `feature-pattern.md` — every feature mirrors `src/features/todo/`.
- `testing-rules.md` — tests are mandatory for every feature UI change.
- `tech-stack.md` — stack reference examples.

Use `bun`/`bunx` only. `.claude/settings.json` permits Bun commands, web access,
and file edits.

## Commands

```bash
bun install
bun dev                         # http://localhost:3000
bun run test                    # all Vitest tests
bun run test src/features/todo  # one feature directory
bun run test src/features/todo/__test__/filter.test.tsx  # one file
bun run lint                    # ESLint
bun run format                  # Prettier write + ESLint --fix
bun run check                   # Prettier check only
bun run build                   # Vite + Nitro build; output in .output/
bun run start                   # node .output/server/index.mjs (build first)
bun run db:generate             # generate Drizzle migrations
bun run db:migrate              # apply pending migrations
bun run db:push                 # direct schema push, dev only
bun run db:studio               # Drizzle Studio
bunx @better-auth/cli generate --config src/lib/auth/index.ts
bunx shadcn@latest add <component>
```

- No `typecheck` script and no CI workflows exist. Verification is targeted
  Vitest plus ESLint/Prettier. Do not run build/tsc after every small edit
  (project rule).
- `test:coverage` needs `@vitest/coverage-v8`, which is not installed.

## Architecture

### Routing

- File-based routes live in `src/routes/`. `src/routeTree.gen.ts` is generated
  and marked read-only in VS Code; never edit it. Use `bun run generate-routes`
  if the watcher misses a change.
- Keep routes thin: `validateSearch`, `loaderDeps`, loader prefetch via
  `context.queryClient` + `orpc.<router>.<method>.queryOptions(...)`, and page
  assembly only. Domain logic belongs in `src/features/<name>/`.
- Protected pages live under `src/routes/_authenicated/`. The misspelling is
  legacy and intentional — keep it when adding nested pages. Its `beforeLoad`
  calls `getSession()` and redirects to `/login`.
- Filter/search/pagination state belongs in URL search params.
- API handlers: `/api/rpc` (`api.rpc.$.ts`), `/api` OpenAPI/docs (`api.$.ts`),
  better-auth (`api/auth/$.ts`).

### Feature Modules

Canonical reference: `src/features/todo/`.

```text
src/features/<name>/
├── index.tsx          # Page assembly inside ContextProvider
├── context/index.tsx  # All queries, mutations, action + selected<Item>
├── components/        # Header, filter, table (consume context only)
├── modals/            # Unified upsert + delete confirmation
└── __test__/          # Mandatory context-mocked tests
```

- One context per feature. Components and modals must not call `useQuery` or
  `useMutation` directly; use `use<Feature>Context()`.
- Context owns `action: null | "create" | "update" | "delete"` and
  `selected<Item>`. Mutations must toast, reset both, and invalidate
  `orpc.<feature>.getAll.key()`.
- Create/edit share one upsert modal; derive `isEditing` from `action` and
  `selected<Item>`.
- Search input debounces 500 ms before updating URL state; filter changes reset
  `page` to `1`.
- New features follow the 4-step lifecycle in
  `.claude/rules/development-lifecycle.md`; do not build UI before the schema
  and procedure exist.

### API (oRPC)

- Procedures live in `src/orpc/router/<feature>.ts` and are registered in
  `src/orpc/router/index.ts`; validate inputs with Zod.
- `publicProcedure` / `protectedProcedure` come from `src/orpc/procedure.ts`.
  Protected procedures read request headers, call `auth.api.getSession`, and
  inject `context.user` and `context.session`.
- `src/orpc/client.ts` is isomorphic: direct router call on the server, RPC
  fetch to `/api/rpc` in the browser. It exports `client` and `orpc` (TanStack
  Query utils).
- List responses use the global `ListResponse<T>` type declared in
  `src/types/index.d.ts`.

### Database & Auth

- One table per file in `src/db/schema/`, re-exported from
  `src/db/schema/index.ts`; relations live in `relations.ts`.
- Infer types: `typeof table.$inferSelect` / `$inferInsert`.
- `src/db/index.ts` creates the Drizzle client with `DATABASE_URL`;
  migrations live in `drizzle/`.
- Auth config: `src/lib/auth/index.ts` (Drizzle adapter, UUID ids,
  email/password, `tanstackStartCookies()`); browser client:
  `src/lib/auth/client.ts`; server functions: `src/lib/auth/functions.ts`.
- After changing auth config, run the better-auth generate command, then
  `db:generate` and `db:migrate`.

### Environment

- Bun auto-loads `.env`/`.env.local`; `drizzle.config.ts` loads `.env.local`
  first, then `.env`.
- `src/env.ts` validates only `SERVER_URL` and `VITE_APP_TITLE`.
  `DATABASE_URL` is read directly in `src/db/index.ts`; better-auth reads
  `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` directly. Do not assume the
  README env table is wired through `env.ts`.
- Client-side variables must use the `VITE_` prefix.

## Conventions

- ES6 arrow functions only for new code; annotate params, props, and return
  types; never `any`. A few old route files still use `function` declarations —
  do not replicate that.
- Infer from schemas (`z.infer`, `$inferSelect`) instead of duplicating types.
- No premature `useMemo`/`useCallback`/`React.memo`; React 19 compiler handles
  it unless profiling proves a bottleneck.
- Avoid `useState`/`useEffect` for derived, synchronized, or fetched data. Use
  URL search params, query data, event handlers, and react-hook-form instead.
  Only legitimate local UI state, subscriptions, timers, or imperative browser
  APIs justify state/effects.
- Follow the component declaration order in `CLAUDE.md` (imports → constants →
  component signature → state → hooks → derived values → queries/mutations →
  handlers → effects → JSX).
- Shadcn primitives live in `src/components/ui/` (Base UI, `base-nova`, lucide
  icons). Add components with the Shadcn CLI or MCP; `src/components/ui` is
  excluded from Prettier.
- `@/` maps to `src/` via `tsconfig.json` paths and Vite's
  `resolve.tsconfigPaths`. Prettier sorts imports: react → packages → `@/` →
  relative, blank-line separated.

## Testing

- Any new or changed component/modal under `src/features/<name>/` must get or
  update a test in `__test__/`; changes without tests are incomplete.
- Mock the feature hook directly with
  `vi.spyOn(ContextModule, "use<Feature>Context").mockReturnValue(...)`. Do not
  use MSW or network mocks for feature UI tests.
- Cover loading, error, empty, and loaded states; user interactions with
  `@testing-library/user-event`; action triggers; debounced search.
- Vitest config: jsdom, globals, `src/test/setup.ts` (includes matchMedia and
  ResizeObserver polyfills). Shared render helpers are in `src/test/utils.tsx`.
