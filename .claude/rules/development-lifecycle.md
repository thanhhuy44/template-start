# End-to-End Feature Development Lifecycle

When implementing any end-to-end feature (e.g. "Posts"), follow this exact 4-step sequence:

```
┌──────────────────────────┐      ┌──────────────────────────┐
│ 1. Define Drizzle Schema │ ───► │ 2. Create oRPC Procedure │
│    (src/db/schema.ts)    │      │    (src/orpc/router/)    │
└──────────────────────────┘      └──────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│ 4. Build UI Component    │ ◄─── │ 3. Prefetch in Loader    │
│    (src/features/posts/) │      │    (src/routes/posts.tsx)│
└──────────────────────────┘      └──────────────────────────┘
```

---

## Step-by-Step Code Walkthrough

### Step 1: Database Schema (`src/db/schema.ts`)

Define table structure, primary keys, non-null columns, and default values.

```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

*CLI Command:*
```bash
npm run db:generate # Generate SQL migration in drizzle/
npm run db:migrate  # Apply migration to PostgreSQL
```

---

### Step 2: oRPC Procedure (`src/orpc/router/posts.ts`)

Define inputs, output schemas with Zod, and server handler accessing Drizzle ORM.

```ts
import { os, ORPCError } from '@orpc/server'
import { z } from 'zod'
import { db } from '#/db'
import { posts } from '#/db/schema'
import { eq, desc } from 'drizzle-orm'

export const listPosts = os
  .input(z.object({ page: z.number().default(1) }))
  .handler(async ({ input }) => {
    const limit = 10
    const offset = (input.page - 1) * limit
    return db.select().from(posts).orderBy(desc(posts.createdAt)).limit(limit).offset(offset)
  })

export const findPost = os
  .input(z.object({ id: z.number() }))
  .handler(async ({ input }) => {
    const [post] = await db.select().from(posts).where(eq(posts.id, input.id))
    if (!post) throw new ORPCError('NOT_FOUND', { message: 'Post not found' })
    return post
  })

export const createPost = os
  .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
  .handler(async ({ input }) => {
    const [post] = await db.insert(posts).values(input).returning()
    return post
  })

export const deletePost = os
  .input(z.object({ id: z.number() }))
  .handler(async ({ input }) => {
    const [deleted] = await db.delete(posts).where(eq(posts.id, input.id)).returning()
    if (!deleted) throw new ORPCError('NOT_FOUND', { message: 'Post not found' })
    return { success: true }
  })
```

Add to router index (`src/orpc/router/index.ts`):
```ts
import { listPosts, findPost, createPost, deletePost } from './posts'

export default {
  posts: {
    list: listPosts,
    find: findPost,
    create: createPost,
    delete: deletePost,
  },
}
```

---

### Step 3: Route Loader Prefetch (`src/routes/posts/index.tsx`)

Validate search params with Zod and prefetch query data in the route loader.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PostsPage } from '#/features/posts'
import { orpc } from '#/orpc/client'

const searchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute('/posts/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps, context }) => {
    await context.queryClient.ensureQueryData(
      orpc.posts.list.queryOptions({ input: { page: deps.page } })
    )
  },
  component: PostsPage,
})
```

---

### Step 4: Feature Module (`src/features/posts/`)

Assemble Context Provider and UI components in `src/features/posts/`:

```
src/features/posts/
├── index.tsx                 # Page layout wrapper
├── context/
│   └── index.tsx             # Context holding listQuery, deleteMutation, etc.
└── components/
    ├── list.tsx              # Component rendering list
    ├── card.tsx              # Component rendering detail
    └── delete.tsx            # Component rendering delete dialog
```
