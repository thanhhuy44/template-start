---
description: Generate a standardized oRPC CRUD router in src/orpc/router/<router-name>.ts based on the crudExampleRouter pattern
---

Generate an oRPC CRUD router in `src/orpc/router/<router_name>.ts` matching the project's standard oRPC procedure pattern.

## Guidelines & Rules

1. **Imports**:
   - Import `protectedProcedure` and/or `publicProcedure` from `../procedure` (or `#/orpc/procedure`).
   - Import `z` from `'zod'`.

2. **Structure**:
   - Export a router object (e.g. `export const <routerName>Router = { ... }`).
   - Define standard CRUD methods:
     - `getAll`: Paginated listing with default `page` (1) and `limit` (10). Returns data array and pagination metadata.
     - `getById`: Accepts `{ id: z.uuid() }` (or `z.string()`).
     - `create`: Accepts creation input schema.
     - `update`: Accepts `{ id: z.uuid(), body: ... }`.
     - `delete`: Accepts `{ id: z.uuid() }`.

3. **Coding Style**:
   - Use **ES6 Arrow Functions Only** for handlers and callbacks (`({ input }) => { ... }`).
   - Use strict Zod validation for inputs and outputs where appropriate.

## Minimal Code Template

```ts
import { protectedProcedure, publicProcedure } from '../procedure'
import { z } from 'zod'

export const <routerName>Router = {
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
      }),
    )
    .output(
      z.object({
        data: z.array(z.object({ id: z.string() })),
        pagination: z.object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
        }),
      }),
    )
    .handler(({ input }) => {
      const { page, limit } = input
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
        },
      }
    }),
  getById: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .handler(() => {
      return {}
    }),
  create: publicProcedure.input(z.object({ name: z.string() })).handler(() => {
    return {}
  }),
  update: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
        body: z.object({ name: z.string() }),
      }),
    )
    .handler(() => {
      return {}
    }),
  delete: publicProcedure.input(z.object({ id: z.uuid() })).handler(() => {
    return {}
  }),
}
```
