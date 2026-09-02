# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TanStack Start fullstack template with React 19, oRPC type-safe API, Drizzle ORM (PostgreSQL), better-auth authentication, Shadcn UI, and Tailwind CSS v4.

## Commands

```bash
# Dev server on port 3000
bun dev

# Lint & format
bun run lint                   # ESLint
bun run format                 # Prettier write + ESLint fix
bun run check                  # Prettier check only

# Database (Drizzle Kit, reads .env.local then .env)
bun run db:generate            # Generate migrations from schema changes
bun run db:migrate             # Apply pending migrations
bun run db:push                # Push schema directly to DB (dev only)
bun run db:studio              # Interactive DB GUI

# Auth schema generation
bunx @better-auth/cli generate --config src/lib/auth.ts

# Add Shadcn UI components (new-york style, lucide icons)
bunx shadcn@latest add <component>

# Build
bun run build
```

## Architecture

### Path Aliases

Two aliases resolve to `src/`: `@/` (Node subpath imports in package.json) and `@/` (tsconfig paths). Shadcn components use `@/` convention. Both work interchangeably.

### Routing (TanStack Router - file-based)

- `src/routes/` - File-system routes. `routeTree.gen.ts` is auto-generated (DO NOT EDIT).
- `src/routes/__root.tsx` - Root document shell, global providers, devtools.
- Route files should be **thin**: routing, loaders, search params validation, page assembly only. Domain logic goes in `src/features/<name>/`.
- Protected routes: use `_authed.tsx` layout guard pattern (prefix `_` = pathless layout).

### API Layer (oRPC)

- `src/orpc/router/` - Server-side procedure definitions (Zod input validation).
- `src/orpc/schema.ts` - Shared Zod schemas for input/output.
- `src/orpc/client.ts` - Isomorphic client: direct router call on server, RPCLink fetch on client. Exports `client` (raw) and `orpc` (TanStack Query utils).
- `src/routes/api.rpc.$.ts` - RPC catch-all handler at `/api/rpc`.
- `src/routes/api.$.ts` - OpenAPI handler at `/api` with auto-generated docs.

### Database (Drizzle ORM + PostgreSQL)

- `src/db/schema.ts` - Table definitions. Config reads `DATABASE_URL` from `.env.local`.
- `src/db/index.ts` - Drizzle client instance with schema.
- `drizzle/` - Generated migration files.
- `drizzle.config.ts` - Drizzle Kit config (loads dotenv from `.env.local`, `.env`).

### Authentication (better-auth)

- `src/lib/auth.ts` - Server-side auth config with `tanstackStartCookies()` plugin.
- `src/lib/auth-client.ts` - Client-side auth instance (`authClient.useSession()`).
- `src/routes/api/auth/$.ts` - Auth catch-all route handler.
- `src/integrations/better-auth/header-user.tsx` - Session-aware header component.

### Environment Variables

- `src/env.ts` - Type-safe env via `@t3-oss/env-core`. Server vars use `process.env`, client vars require `VITE_` prefix and use `import.meta.env`.
- `.env.local` - Local secrets (DATABASE_URL, BETTER_AUTH_SECRET). Gitignored (`*.local`).

### UI & Styling

- `src/components/ui/` - Shadcn UI primitives (new-york style, zinc base, CSS variables).
- `src/lib/utils.ts` - `cn()` helper (clsx + tailwind-merge).
- `src/styles.css` - Tailwind v4 (`@import 'tailwindcss'`), custom theme tokens (light/dark), custom utility classes (`.island-shell`, `.feature-card`, `.rise-in`).
- Fonts: Manrope (sans), Fraunces (display titles via `.display-title`).

### TanStack Query Integration

- `src/integrations/tanstack-query/root-provider.tsx` - QueryClient factory, wired into router context.
- SSR query integration via `@tanstack/react-router-ssr-query` in `src/router.tsx`.

## Code Rules

### Mandatory
- **ES6 arrow functions only** - No `function` declarations for components, handlers, helpers.
- **Explicit type annotations** - Annotate params, return types, props. Never use `any`.
- **Infer from schemas** - Use `z.infer<typeof schema>`, `typeof table.$inferSelect` / `$inferInsert`. Don't duplicate types.
- **No premature memoization** - React 19 compiler handles it. Only add `useMemo`/`useCallback`/`React.memo` after profiling confirms a bottleneck, with a comment explaining why.

## MCP & CLI Usage Guidelines

- **Proactive by Default**: Inspect and use relevant MCP tools (e.g. Context7 for docs, browser DevTools for UI verification, DB/API tools) automatically without waiting for explicit user prompts.
- **shadcn/ui MCP — Mandatory for UI Development**: When implementing, modifying, or refactoring UI components, Claude Code MUST proactively use the available shadcn/ui MCP whenever applicable.
- **TanStack CLI over TanStack MCP**: For all tasks related to the TanStack ecosystem (searching docs, querying documentation, discovering libraries, add-ons, or templates), use direct `tanstack` CLI commands instead of TanStack MCP (`tanstack mcp` is deprecated/removed).
  - **Prerequisite / Installation**: If `tanstack` command is not available in the environment, suggest the user install it globally (`bun add -g @tanstack/cli` / `npm i -g @tanstack/cli`) or run via `bunx @tanstack/cli`.
  - **Deterministic JSON Output**: Always append `--json` to `tanstack` commands for reliable parsing.
  - **Key Commands**:
    - Search Docs: `tanstack search-docs "<query>" [--library <lib>] --json`
    - Read Specific Doc: `tanstack doc query <doc-path> --json`
    - List Libraries: `tanstack libraries --json`
    - Query Ecosystem: `tanstack ecosystem [--category <category>] --json`
    - List Add-ons: `tanstack create --list-add-ons --framework React --json`
    - Add-on Details: `tanstack create --addon-details <addon> --framework React --json`
- **Verification & Accuracy**: Prefer MCP/CLI over guessing or static knowledge. Before declaring a task complete, verify results using available tools.

## Anti-useState / Anti-useEffect Pattern

Avoid `useState` and `useEffect` by default in React code. Prefer simpler, declarative patterns:

### Preferred Alternatives
- **Derived / Computed Values**: Calculate directly during render; derive from existing props/state/context/constants.
- **Server / Query Data**: Use project query layer (`oRPC` / TanStack Query) instead of manual `useEffect` fetching.
- **URL / Search State**: Store filter and search parameters in URL search params.
- **Event-driven Logic**: Perform state transitions directly inside event handlers.
- **Form State**: Use project form primitives/resolvers (`react-hook-form` + `zod`).

### `useEffect` Rules
- **Do NOT use for**: Derived state, data transformations, synchronizing state, data fetching (when queries exist), handling user events, or work that belongs on the server.
- **Key Question**: *"Is this an external side effect, or state synchronization?"* Do not use effects for state sync.

### `useState` Rules
- **Do NOT use for**: Storing values that can be derived from props, state, URL params, server data, form state, or constants. Avoid duplicated state and maintain a single source of truth.

### Exceptions
- Legitimate use cases: Local interactive UI state (non-derivable), external subscriptions, browser API lifecycle sync, timers, imperative 3rd-party libs, WebSockets. Require clear code justification.

## Code Review & Verification

Before completing any task:
1. Inspect code for unnecessary `useState` / `useEffect` and refactor to derived/event-driven patterns.
2. Avoid introducing non-essential synchronization state.
3. Verify changes using relevant MCP tools whenever available.

### Structural
- **Thin route files** - Routes handle routing, loaders, search params only. Domain logic lives in `src/features/<name>/`.
- **Feature modules** in `src/features/<name>/` - Feature-specific UI, forms, hooks, helpers.
- **Reusable primitives** in `src/components/ui/` - Generic components (Button, Input, Card).
- **Don't run typecheck/build after small changes** - Focus on clean code first. Run only at milestones or when requested.

### Feature Development Lifecycle

When building end-to-end features, follow this order:
1. **Schema** - Define Drizzle table in `src/db/schema.ts`, generate migration.
2. **Procedure** - Create oRPC procedure in `src/orpc/router/` with Zod validation.
3. **Route & Loader** - Prefetch in route loader via `queryClient.ensureQueryData(orpc.<name>.queryOptions(...))`.
4. **Feature UI** - Build components in `src/features/<name>/`, consume data via `useQuery(orpc.<name>.queryOptions(...))`.

## Config Details

- **TypeScript**: strict mode, `ES2022` target, bundler module resolution, `verbatimModuleSyntax`.
- **Prettier**: no semicolons, single quotes, trailing commas.
- **ESLint**: TanStack config base with relaxed cycle/import-order/require-await rules.
- **Vite plugins order**: devtools, tailwindcss, tanstackStart, viteReact (react must come AFTER tanstackStart).
- **Package manager**: bun (uses `bun.lock` for deterministic dependency resolution).
