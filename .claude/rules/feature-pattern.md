# Feature Module Pattern

All features in `src/features/<feature_name>/` MUST follow this standardized structure to ensure consistency, separation of concerns, and predictable data flow.

## Directory Structure

```
src/features/<feature_name>/
├── index.tsx                  # Page component — assembles layout inside ContextProvider
├── context/
│   └── index.tsx              # Feature Context — all state, queries, mutations
└── components/
    ├── list.tsx               # List view — consumes listQuery from context
    ├── card.tsx               # Detail card/drawer — consumes detailQuery from context
    ├── delete.tsx             # Delete confirmation modal — consumes deleteMutation
    ├── create-form.tsx        # (optional) Create form dialog
    └── update-form.tsx        # (optional) Update form dialog
```

## Non-Negotiable Rules

1. **Thin Route Files**: Route files in `src/routes/` should ONLY handle routing, loaders, search params validation (`validateSearch`), and page assembly. Domain logic belongs in `src/features/<feature_name>/`.
2. **One Context per feature**: Every feature has exactly one `context/index.tsx` that owns ALL data fetching (`useQuery`), mutations (`useMutation`), and shared UI state (`action`, `current`).
3. **Components never fetch data directly**: All `components/*.tsx` files consume data exclusively through the feature context hook (`use<Feature>Context`). No direct `useQuery` or `useMutation` calls inside UI components.
4. **Page (`index.tsx`) is thin**: It only wraps components inside `<ContextProvider>`. No business logic, no data fetching, no state.
5. **Action-driven UI flow**: A single `action` state (`"detail" | "update" | "delete" | null`) controls which modal/drawer is visible. Set `action` + `current` together to trigger a UI flow.
6. **Mutations reset state on success**: Every mutation's `onSuccess` callback resets `action` to `null` and `current` to `null`, then invalidates the list query cache.
7. **Type-safe from oRPC**: Query and mutation types are inferred directly from oRPC procedure definitions (`typeof orpc.<feature>.<method>.$inferOutput`). Never manually duplicate API response types.
8. **Reusable Primitives in `src/components/ui/`**: Place pure, generic UI components (Buttons, Inputs, Cards) in `src/components/ui/`.

---

## Code Examples

### 1. Page Component (`src/features/posts/index.tsx`)

```tsx
import { ContextProvider } from './context'
import { List } from './components/list'
import { DetailCard } from './components/card'
import { DeleteModal } from './components/delete'

export const PostsPage = (): React.ReactNode => {
  return (
    <ContextProvider>
      <div className="space-y-6">
        <List />
        <DetailCard />
        <DeleteModal />
      </div>
    </ContextProvider>
  )
}
```

### 2. Feature Context (`src/features/posts/context/index.tsx`)

```tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/orpc/client'

type Action = 'detail' | 'update' | 'delete' | null
type Post = typeof orpc.posts.list.$inferOutput[number]

interface ContextType {
  action: Action
  setAction: Dispatch<SetStateAction<Action>>
  current: Post | null
  setCurrent: Dispatch<SetStateAction<Post | null>>
  listQuery: ReturnType<typeof useQuery<Post[]>>
  detailQuery: ReturnType<typeof useQuery<Post>>
  deleteMutation: ReturnType<typeof useMutation>
}

const Context = createContext<ContextType>({} as ContextType)

export const ContextProvider = ({ children }: { children: ReactNode }): React.ReactNode => {
  const [action, setAction] = useState<Action>(null)
  const [current, setCurrent] = useState<Post | null>(null)
  const queryClient = useQueryClient()
  const searchParams = useSearch({ from: '/posts/' })

  const listQuery = useQuery(
    orpc.posts.list.queryOptions({
      input: { page: searchParams.page ?? 1 },
    })
  )

  const detailQuery = useQuery({
    ...orpc.posts.find.queryOptions({
      input: { id: current?.id ?? 0 },
    }),
    enabled: !!current?.id,
  })

  const deleteMutation = useMutation(
    orpc.posts.delete.mutationOptions({
      onSuccess: () => {
        setAction(null)
        setCurrent(null)
        queryClient.invalidateQueries({
          queryKey: orpc.posts.list.key(),
        })
      },
    })
  )

  const value = useMemo(
    () => ({
      action,
      setAction,
      current,
      setCurrent,
      listQuery,
      detailQuery,
      deleteMutation,
    }),
    [action, current, listQuery, detailQuery, deleteMutation]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const usePostsContext = (): ContextType => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('usePostsContext must be used within ContextProvider')
  }
  return context
}
```

### 3. List Component (`src/features/posts/components/list.tsx`)

```tsx
import { usePostsContext } from '../context'

export const List = (): React.ReactNode => {
  const { listQuery, setAction, setCurrent } = usePostsContext()
  const { isLoading, isError, data } = listQuery

  if (isLoading) return <div>Loading posts...</div>
  if (isError) return <div className="text-red-500">Failed to load posts.</div>
  if (!data?.length) return <div>No posts found.</div>

  return (
    <div className="grid gap-4">
      {data.map((post) => (
        <div
          key={post.id}
          className="p-4 border rounded cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
          onClick={() => {
            setCurrent(post)
            setAction('detail')
          }}
        >
          <h3 className="font-bold text-lg">{post.title}</h3>
        </div>
      ))}
    </div>
  )
}
```

### 4. Detail Card Component (`src/features/posts/components/card.tsx`)

```tsx
import { usePostsContext } from '../context'

export const DetailCard = (): React.ReactNode => {
  const { action, setAction, current, setCurrent, detailQuery } = usePostsContext()

  if (action !== 'detail') return null

  const handleClose = (): void => {
    setAction(null)
    setCurrent(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{current?.title}</h2>
        {detailQuery.isLoading ? (
          <p>Loading detail...</p>
        ) : (
          <p>{detailQuery.data?.content}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setAction('delete')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 5. Delete Dialog Component (`src/features/posts/components/delete.tsx`)

```tsx
import { usePostsContext } from '../context'

export const DeleteModal = (): React.ReactNode => {
  const { action, setAction, current, setCurrent, deleteMutation } = usePostsContext()

  if (action !== 'delete') return null

  const handleClose = (): void => {
    setAction(null)
    setCurrent(null)
  }

  const handleDelete = (): void => {
    if (current?.id) {
      deleteMutation.mutate({ id: current.id })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-lg font-bold">Delete "{current?.title}"?</h3>
        <p className="text-sm text-neutral-500 mt-2">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 6. Thin Route File (`src/routes/posts/index.tsx`)

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
