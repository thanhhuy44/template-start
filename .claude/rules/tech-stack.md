# Core Tech Stack Architecture & Code Examples

This reference provides code examples and architectural rules for TanStack Router/Start, oRPC, Drizzle ORM, better-auth, and Shadcn UI.

---

## 1. TanStack Router & TanStack Start

### Search Params Validation & Loader Prefetching
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { orpc } from '#/orpc/client'

const searchSchema = z.object({
  page: z.number().catch(1),
  query: z.string().optional(),
})

export const Route = createFileRoute('/posts/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { page, query } }) => ({ page, query }),
  loader: async ({ deps, context }) => {
    await context.queryClient.ensureQueryData(
      orpc.posts.list.queryOptions({
        input: { page: deps.page, query: deps.query },
      })
    )
  },
  component: (): React.ReactNode => <div>Posts Page</div>,
})
```

### Protected Layout Guard (`src/routes/_authed.tsx`)
```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { session }
  },
  component: (): React.ReactNode => <Outlet />,
})
```

---

## 2. oRPC API Layer

### Procedure Builder & Middleware Composition (`src/orpc/router/base.ts`)
```ts
import { os, ORPCError } from '@orpc/server'
import type { getRequestHeaders } from '@tanstack/react-start/server'

export const pub = os

export const authed = pub.use(async ({ context, next }) => {
  const session = (context as { session?: { user?: { id: string; role: string } } }).session
  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' })
  }
  return next({
    context: { ...context, user: session.user },
  })
})

export const admin = authed.use(async ({ context, next }) => {
  if (context.user.role !== 'admin') {
    throw new ORPCError('FORBIDDEN', { message: 'Admin access required' })
  }
  return next({ context })
})
```

### Client Setup (`src/orpc/client.ts`)
```ts
import { createRouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { createIsomorphicFn } from '@tanstack/react-start'
import type { RouterClient } from '@orpc/server'
import router from '#/orpc/router'

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: () => ({ headers: getRequestHeaders() }),
    })
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({ url: `${window.location.origin}/api/rpc` })
    return createORPCClient(link)
  })

export const client: RouterClient<typeof router> = getORPCClient()
export const orpc = createTanstackQueryUtils(client)
```

---

## 3. Drizzle ORM (PostgreSQL)

### Schema Definition (`src/db/schema.ts`)
```ts
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull(),
})

export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

### Database Transactions
```ts
import { db } from '#/db'
import { posts, users } from '#/db/schema'
import { eq } from 'drizzle-orm'

export const createPostWithAudit = async (title: string, authorId: number): Promise<typeof posts.$inferSelect> => {
  return await db.transaction(async (tx) => {
    const [newPost] = await tx.insert(posts).values({ title, authorId }).returning()
    return newPost
  })
}
```

---

## 4. better-auth Authentication

### Server Config (`src/lib/auth.ts`)
```ts
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
```

### Client Usage (`src/lib/auth-client.ts`)
```ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()
export const { signIn, signUp, signOut, useSession } = authClient
```

---

## 5. Shadcn UI & Form Patterns

### React Hook Form + Zod + Shadcn Form Pattern
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

type FormValues = z.infer<typeof formSchema>

export const CreatePostForm = ({
  onSubmit,
}: {
  onSubmit: (values: FormValues) => Promise<void>
}): React.ReactNode => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', content: '' },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          {...form.register('title')}
          className="mt-1 block w-full rounded border p-2"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Content</label>
        <textarea
          {...form.register('content')}
          className="mt-1 block w-full rounded border p-2"
        />
        {form.formState.errors.content && (
          <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  )
}
```
