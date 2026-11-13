# template-start

Fullstack TanStack Start template: React 19, type-safe oRPC API, Drizzle ORM
(PostgreSQL), better-auth authentication, Shadcn UI and Tailwind CSS v4.

## Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Framework    | [TanStack Start](https://tanstack.com/start) + React 19     |
| Routing      | [TanStack Router](https://tanstack.com/router) (file-based) |
| Server state | [TanStack Query](https://tanstack.com/query) + oRPC         |
| API          | [oRPC](https://orpc.unnoq.com) (RPC + OpenAPI)              |
| Database     | [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL        |
| Auth         | [better-auth](https://www.better-auth.com)                  |
| UI           | [Shadcn UI](https://ui.shadcn.com) (Base UI, `base-nova`)   |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com)                  |
| Forms        | react-hook-form + zod                                       |
| Testing      | [Vitest](https://vitest.dev) + Testing Library              |

## Requirements

- [Bun](https://bun.sh) (package manager and script runner)
- PostgreSQL 14+ (only for database-backed features)

## Getting Started

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env.local
bunx @better-auth/cli secret   # paste the value into BETTER_AUTH_SECRET

# 3. Create the database tables
bun run db:generate            # generate SQL migrations from src/db/schema
bun run db:migrate             # apply pending migrations

# 4. Start the dev server on http://localhost:3000
bun dev
```

`.env.local` is gitignored. Use `.env.local` for local secrets and `.env` for
shared defaults — `drizzle.config.ts` loads `.env.local` first, then `.env`.

## Commands

| Command                 | Description                               |
| ----------------------- | ----------------------------------------- |
| `bun dev`               | Dev server on port 3000                   |
| `bun run build`         | Production build                          |
| `bun run start`         | Run the built server                      |
| `bun run lint`          | ESLint                                    |
| `bun run format`        | Prettier write + ESLint fix               |
| `bun run check`         | Prettier check only                       |
| `bun run test`          | Run all unit tests (Vitest)               |
| `bun run test:watch`    | Vitest watch mode                         |
| `bun run test:coverage` | Vitest with coverage                      |
| `bun run db:generate`   | Generate migrations from schema changes   |
| `bun run db:migrate`    | Apply pending migrations                  |
| `bun run db:push`       | Push schema directly to the DB (dev only) |
| `bun run db:studio`     | Drizzle Studio GUI                        |

## Project Structure

```
src/
├── routes/                     # File-based routes (thin: routing, loaders, search params)
│   ├── __root.tsx              # Root document shell, global providers, devtools, Toaster
│   ├── index.tsx               # Landing page
│   ├── login.tsx               # Login page
│   ├── register.tsx            # Registration page
│   ├── _authenicated/          # Pathless layout guard (auth required)
│   │   ├── route.tsx           # beforeLoad session check → redirect to /login
│   │   └── todos/index.tsx     # /todos: search-schema validation + loader prefetch
│   ├── api.$.ts                # OpenAPI handler at /api (auto-generated docs)
│   ├── api.rpc.$.ts            # oRPC RPC handler at /api/rpc
│   └── api/auth/$.ts           # better-auth catch-all handler
├── features/                   # Feature modules (see "Feature Modules" below)
│   ├── auth/                   # login.tsx, register.tsx, schema.ts, __test__/
│   └── todo/                   # Canonical reference feature
├── orpc/
│   ├── router/                 # Procedure definitions (todo.ts) + index.ts barrel
│   ├── procedure.ts            # publicProcedure / protectedProcedure middleware
│   └── client.ts               # Isomorphic client + TanStack Query utils (`orpc`)
├── db/
│   ├── schema/                 # One file per table, barrel-exported from index.ts
│   └── index.ts                # Drizzle client instance
├── lib/
│   ├── auth/                   # index.ts (server), client.ts, functions.ts (server fns)
│   └── utils.ts                # cn() helper
├── components/
│   ├── ui/                     # Shadcn primitives
│   ├── root-provider.tsx       # QueryClient factory
│   └── devtools.tsx            # TanStack Query devtools panel
├── test/                       # Vitest setup + shared test utils
├── env.ts                      # Type-safe env via @t3-oss/env-core
├── router.tsx                  # Router instance + SSR query integration
└── styles.css                  # Tailwind v4 + Shadcn theme tokens
```

## Architecture

### Routing (TanStack Router)

Routes are files in `src/routes/`. `src/routeTree.gen.ts` is generated — do not
edit it. Route files stay **thin**: they own routing, loaders, `validateSearch`
and page assembly only; domain logic lives in `src/features/<name>/`.

Protected routes use the pathless layout guard at `src/routes/_authenicated/`
(the spelling is legacy — keep it when adding nested pages). Its `beforeLoad`
calls the `getSession` server function and redirects to `/login` when there is
no session.

Search params are validated with Zod and used as the single source of truth for
pagination, filtering and search:

```tsx
export const Route = createFileRoute("/_authenicated/todos/")({
  validateSearch: todoSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    await context.queryClient.query(
      orpc.todo.getAll.queryOptions({ input: deps }),
    );
  },
  component: TodosPage,
});
```

### Feature Modules

All feature modules in `src/features/<feature_name>/` follow the canonical
pattern implemented by `src/features/todo/`:

```
src/features/<feature_name>/
├── index.tsx                  # Page assembly inside ContextProvider
├── context/index.tsx          # ALL queries, mutations and UI state (action, selected<Item>)
├── components/                # In-page views (header, filter, table)
├── modals/                    # Overlay dialogs (upsert, delete-confirm)
└── __test__/                  # Unit tests mocking the feature context
```

Key rules:

- **One context per feature.** Components never call `useQuery` / `useMutation`
  directly — they read everything from `use<Feature>Context()`.
- **Action-driven UI.** `type Action = null | "create" | "update" | "delete"`
  plus `selected<Item>` controls which modal is open. Mutations reset both and
  invalidate `orpc.<feature>.getAll.key()` on success.
- **Single upsert modal.** Create and edit share `modals/upsert.tsx`, with a
  unified schema, `form.reset()` when opening, and `isEditing` derived from
  `action` and `selected<Item>`.
- **URL-first filters.** Search input is debounced (500 ms) before navigating,
  and every filter change resets the page to `1`.
- **Tests are mandatory.** Every component and modal gets a test in `__test__/`
  that spies on `use<Feature>Context` — no network or MSW mocks.

See `.claude/rules/feature-pattern.md` for the full specification and
`.claude/rules/testing-rules.md` for the testing contract.

### API Layer (oRPC)

- `src/orpc/router/*.ts` — procedures with Zod input validation.
- `src/orpc/procedure.ts` — `publicProcedure` and `protectedProcedure` (session
  check that injects `user` and `session` into the context).
- `src/orpc/client.ts` — isomorphic client: calls the router directly on the
  server, `RPCLink` fetch on the client. Exports `client` (raw) and `orpc`
  (TanStack Query utils: `.queryOptions()`, `.mutationOptions()`, `.key()`).
- Handlers: `/api/rpc` (RPC) and `/api` (OpenAPI + interactive docs).

Example procedure:

```ts
export const todoRouter = {
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(10),
        search: z.string().optional(),
        status: todoStatusEnum.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      // ...drizzle query scoped to context.user.id
      return { data, pagination: { page, limit, total } };
    }),
};
```

### Database (Drizzle ORM + PostgreSQL)

- One file per table/module in `src/db/schema/`, re-exported from
  `src/db/schema/index.ts`; `relations.ts` holds table relations.
- `src/db/index.ts` exposes the Drizzle client (`db`).
- `drizzle/` contains generated migrations; `drizzle.config.ts` points at
  `./src/db/schema/*.ts` and reads `DATABASE_URL`.
- Infer types from the schema instead of duplicating them:
  `typeof todo.$inferSelect` / `$inferInsert`.

### Authentication (better-auth)

- `src/lib/auth/index.ts` — server config: Drizzle adapter (PostgreSQL), UUID
  ids, email + password, `tanstackStartCookies()` plugin.
- `src/lib/auth/client.ts` — `authClient` for the browser
  (`authClient.useSession()`).
- `src/lib/auth/functions.ts` — `getSession` / `ensureSession` server functions.
- `src/routes/api/auth/$.ts` — auth catch-all handler.
- Auth feature UI lives in `src/features/auth/` (login, register, zod schemas).

Regenerate auth tables after changing the config:

```bash
bunx @better-auth/cli generate --config src/lib/auth/index.ts
bun run db:generate
bun run db:migrate
```

### Environment Variables

`src/env.ts` validates variables with `@t3-oss/env-core`:

| Variable             | Scope  | Purpose                                  |
| -------------------- | ------ | ---------------------------------------- |
| `DATABASE_URL`       | server | PostgreSQL connection string             |
| `BETTER_AUTH_SECRET` | server | Session signing secret                   |
| `BETTER_AUTH_URL`    | server | Public base URL of the app               |
| `SERVER_URL`         | server | Optional server URL                      |
| `VITE_APP_TITLE`     | client | Optional app title (`VITE_` prefix only) |
| `PORT`               | server | Port used by the production server       |

Client variables must be prefixed with `VITE_` and are read from
`import.meta.env`; server variables come from `process.env`.

### UI & Styling

- `components.json` — Shadcn CLI config (`base-nova` style, Base UI primitives,
  `@/components` aliases).
- `src/components/ui/` — Shadcn primitives; add more with:

  ```bash
  bunx shadcn@latest add <component>
  ```

- `src/styles.css` — Tailwind v4 import, Shadcn theme tokens, light/dark themes.
- Fonts: Geist Variable via `@fontsource-variable/geist`.
- Toasts: `sonner` (`<Toaster />` is mounted in `src/routes/__root.tsx`).
- Both `@/` path aliases (package.json subpath imports and tsconfig paths)
  resolve to `src/`.

### Testing

```bash
bun run test                      # all unit tests
bun run test src/features/todo    # a single feature
```

- Config: `vitest.config.ts` (jsdom, globals, `src/test/setup.ts`).
- Tests live next to the code: `src/features/<name>/__test__/` for UI and
  `src/orpc/router/__test__/` for procedures.
- UI tests mock the feature context with
  `vi.spyOn(ContextModule, "use<Feature>Context")` and use
  `@testing-library/user-event` for interactions.

## Adding a Feature

Follow the lifecycle in `.claude/rules/development-lifecycle.md`:

1. **Schema** — add `src/db/schema/<table>.ts`, export it from the barrel, run
   `bun run db:generate` and `bun run db:migrate`.
2. **Procedure** — add `src/orpc/router/<feature>.ts` (use `protectedProcedure`
   for user-scoped data) and register it in `src/orpc/router/index.ts`.
3. **Route & loader** — add a thin route under `src/routes/`, validate search
   params with Zod, and prefetch with
   `context.queryClient.query(orpc.<feature>.<method>.queryOptions(...))`.
4. **Feature UI** — create `src/features/<feature>/` following
   `src/features/todo/` (context, components, modals, `__test__`).

## Code Conventions

- **ES6 arrow functions only** — no `function` declarations for components,
  handlers or helpers.
- **Explicit types** — annotate params, return types and props; never `any`.
- **Infer from schemas** — `z.infer<typeof schema>`, `typeof table.$inferSelect`.
- **No premature memoization** — React 19 compiler handles it; profile first.
- **Minimize `useState` / `useEffect`** — derive values, keep filter/search
  state in the URL, do state transitions in event handlers, and use
  react-hook-form for forms.
- **Don't run typecheck/build after small edits** — save them for milestones or
  when explicitly requested.
