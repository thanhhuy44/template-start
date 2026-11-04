---
description: Generate a standardized base feature module pattern in src/features/<feature-name> following src/features/todo
---

Generate a base feature module in `src/features/<feature_name>/` following the project's standard feature pattern architecture established by the reference implementation in `src/features/todo/`.

## Non-Negotiable Architecture & Base Guidelines

### 1. Minimal Base Principles

- **No Dummy UI / Mock Code**: Build clean, minimal skeleton components following the standard directory pattern.
- **Strict Coding Rules**:
  - **ES6 Arrow Functions Only**: Use `export const Component = (): React.ReactNode => ...`. No `function` declarations.
  - **Explicit Type Annotations**: Annotate props, params, and return types explicitly.

### 2. Standard Directory & Minimal Files

```
src/features/<feature_name>/
├── index.tsx                  # Page component — wraps layout in ContextProvider
├── context/
│   └── index.tsx              # Feature Context — Action, selectedItem, listQuery, mutations
├── components/
│   ├── header.tsx             # Header component (Title, description, Create CTA)
│   ├── filter.tsx             # Filter & Search bar (debounced URL search params sync)
│   └── table.tsx              # Data table with status badges, action buttons, pagination
├── modals/
│   ├── upsert.tsx             # Unified Create & Update modal (react-hook-form + zodResolver)
│   └── delete-confirm.tsx     # Delete confirmation modal
└── __test__/                  # Mandatory unit tests with Context mocking
    ├── filter.test.tsx        # Tests for components/filter.tsx
    ├── table.test.tsx         # Tests for components/table.tsx
    └── upsert.test.tsx        # Tests for modals/upsert.tsx
```

### 3. Core Implementation Invariants

1. **Feature Context (`context/index.tsx`)**:
   - `type Action = null | "create" | "update" | "delete"`.
   - `selected<Item>: <Item> | null` (inferred from Drizzle schema `typeof <table>.$inferSelect`).
   - Mutations reset state (`setAction(null)`, `setSelected<Item>(null)`), display toast (`toast.success` from `sonner`), and invalidate the list query cache (`queryClient.invalidateQueries({ queryKey: orpc.<feature>.getAll.key() })`).
2. **Components Never Fetch Directly**: Components in `components/` and `modals/` consume data and dispatch mutations exclusively via `use<FeatureName>Context()`.
3. **Unified Upsert Modal (`modals/upsert.tsx`)**: Combine Create and Edit into a single modal driven by `action === "create" || action === "update"` and `isEditing = action === "update" && Boolean(selected<Item>)`. Sync form fields via `form.reset` in `useEffect`.
4. **URL-First Filter & Search (`components/filter.tsx`)**: Debounce search input by 500ms before navigating via TanStack Router search params and resetting `page: 1`.
5. **High-Performance Unit Tests (`__test__/`)**: Mock `use<FeatureName>Context()` directly using `vi.spyOn(ContextModule, "use<FeatureName>Context").mockReturnValue(...)`.
