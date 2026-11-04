# Feature Module Pattern

All features in `src/features/<feature_name>/` MUST follow the standardized structure established by the canonical reference implementation in `src/features/todo/` to ensure consistency, separation of concerns, and predictable data flow.

## Directory Structure

```
src/features/<feature_name>/
├── index.tsx                  # Page assembly component — wraps layout in ContextProvider
├── context/
│   └── index.tsx              # Feature Context — all state, queries, and mutations
├── components/                # Page-level UI views
│   ├── header.tsx             # Page header with title, description, and primary CTA
│   ├── filter.tsx             # Filter & Search bar with debounced URL search params sync
│   └── table.tsx              # Data table with status badges, action buttons, and pagination
├── modals/                    # Overlay dialogs and forms
│   ├── upsert.tsx             # Unified Create & Update modal (react-hook-form + zodResolver)
│   └── delete-confirm.tsx     # Delete confirmation modal with isPending state
└── __test__/                  # Mandatory unit tests using Context mocking
    ├── filter.test.tsx        # Tests for components/filter.tsx (debounce, clear, render)
    ├── table.test.tsx         # Tests for components/table.tsx (states, badges, actions, pagination)
    └── upsert.test.tsx        # Tests for modals/upsert.tsx (create, edit, validation, cancel)
```

---

## Non-Negotiable Rules

1. **Canonical Reference**: `src/features/todo/` is the GOLD STANDARD implementation. Every new or refactored feature must mirror its architecture and conventions.
2. **Thin Route Files**: Route files in `src/routes/` should ONLY handle routing, loaders, search params validation (`validateSearch`), and page assembly (`component: <Feature>Page`). Domain logic, state, and UI belong strictly in `src/features/<feature_name>/`.
3. **One Context Per Feature (`context/index.tsx`)**:
   - Every feature has exactly one `context/index.tsx` that owns all data fetching (`useQuery`), mutations (`useMutation`), and shared UI state (`action`, `selected<Item>`).
   - Define action state: `type Action = null | "create" | "update" | "delete"`.
   - Infer item type directly from the Drizzle schema: `type <Item> = typeof <table_name>.$inferSelect`.
   - All mutations MUST handle:
     - `onSuccess`: Display toast (`toast.success(...)`), reset state (`setAction(null)`, `setSelected<Item>(null)`), and invalidate the list query (`queryClient.invalidateQueries({ queryKey: orpc.<feature>.getAll.key() })`).
     - `onError`: Display toast error (`toast.error(error.message ?? "...")`).
4. **Components Never Fetch Data Directly**: All `components/*.tsx` and `modals/*.tsx` consume data exclusively through the feature context hook (`use<Feature>Context`). Direct `useQuery` or `useMutation` calls inside UI components are strictly forbidden.
5. **Separation of Views vs Modals**:
   - `components/`: View components placed directly in page flow (Header, Filter, Table, List).
   - `modals/`: Overlay dialogs and forms triggered by `action` (Upsert, DeleteConfirm).
6. **Unified Upsert Modal (`modals/upsert.tsx`)**:
   - Combine Create and Edit into a single upsert modal component.
   - Derive edit mode: `const isEditing = action === "update" && Boolean(selected<Item>);`.
   - Sync form values when opening for edit or create using `useEffect` with `form.reset(...)`.
   - Use `react-hook-form` + `@hookform/resolvers/zod` with Shadcn `Form`, `FormField`, `Input`, `Select`, etc.
7. **URL-First Filter & Search (`components/filter.tsx`)**:
   - Store filter and search parameters in TanStack Router search params using `useSearch` and `useNavigate`.
   - Debounce search input changes by 500ms before navigating to prevent query thrashing.
   - Reset pagination to `page: 1` whenever search term or filter options change.
   - Show a Reset button when active filters exist to quickly clear filters.
8. **Data Table with Pagination (`components/table.tsx`)**:
   - Consumes `listQuery` from context.
   - Handles loading state, error state, and empty state.
   - Formats status values with Shadcn `Badge`.
   - Action buttons (Edit, Delete) update `selected<Item>` and `setAction("update" | "delete")`.
   - Render pagination controls ("Showing X to Y of Z entries", Previous/Next page buttons).
9. **Delete Confirmation Modal (`modals/delete-confirm.tsx`)**:
   - Renders only when `action === "delete" && selected<Item>`.
   - Displays confirmation message with the target item's name.
   - Disables actions and displays loading state during `deleteMutation.isPending`.
10. **Mandatory High-Performance Unit Tests (`__test__/`)**:
    - Every component in `components/` and `modals/` MUST have corresponding unit tests in `__test__/`.
    - Mock `use<Feature>Context` directly using `vi.spyOn(ContextModule, "use<Feature>Context").mockReturnValue(...)`.
    - Never use expensive network or server mocks for UI unit tests. Keep test execution under 30ms per file.

---

## Code Examples (Based on `src/features/todo/`)

### 1. Page Component (`src/features/todo/index.tsx`)

```tsx
import { TodoFilter } from "./components/filter";
import { TodoHeader } from "./components/header";
import { TodoTable } from "./components/table";
import { TodoContextProvider } from "./context";
import { DeleteConfirmModal } from "./modals/delete-confirm";
import { UpsertTodo } from "./modals/upsert";

export const TodosPage = (): React.ReactNode => {
  return (
    <TodoContextProvider>
      <div className="container mx-auto space-y-6 p-4 sm:p-6 max-w-6xl">
        <TodoHeader />
        <TodoFilter />
        <TodoTable />
        <UpsertTodo />
        <DeleteConfirmModal />
      </div>
    </TodoContextProvider>
  );
};
```

---

### 2. Feature Context (`src/features/todo/context/index.tsx`)

```tsx
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";

import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { toast } from "sonner";

import type { todo } from "@/db/schema/todo";
import { orpc } from "@/orpc/client";

export type Action = null | "create" | "update" | "delete";

export type TodoItem = typeof todo.$inferSelect;

export interface TodoContextType {
  action: Action;
  setAction: Dispatch<SetStateAction<Action>>;
  selectedTodo: TodoItem | null;
  setSelectedTodo: Dispatch<SetStateAction<TodoItem | null>>;
  listQuery: UseQueryResult<ListResponse<TodoItem[]>, Error>;
  createMutation: UseMutationResult<
    TodoItem,
    Error,
    { name: string; description?: string; status?: TodoItem["status"] }
  >;
  updateMutation: UseMutationResult<
    TodoItem,
    Error,
    {
      id: string;
      body: {
        name?: string;
        description?: string;
        status?: TodoItem["status"];
      };
    }
  >;
  deleteMutation: UseMutationResult<
    { success: boolean },
    Error,
    { id: string }
  >;
}

const TodoContext = createContext<TodoContextType>({} as TodoContextType);

export const TodoContextProvider = ({
  children,
}: {
  children?: ReactNode;
}): React.ReactNode => {
  const [action, setAction] = useState<Action>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const queryClient = useQueryClient();
  const searchParams = useSearch({ from: "/_authenicated/todos/" });

  const listQuery = useQuery(
    orpc.todo.getAll.queryOptions({
      input: searchParams,
    }),
  );

  const createMutation = useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => {
        toast.success("Todo created successfully!");
        setAction(null);
        setSelectedTodo(null);
        queryClient.invalidateQueries({
          queryKey: orpc.todo.getAll.key(),
        });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to create todo");
      },
    }),
  );

  const updateMutation = useMutation(
    orpc.todo.update.mutationOptions({
      onSuccess: () => {
        toast.success("Todo updated successfully!");
        setAction(null);
        setSelectedTodo(null);
        queryClient.invalidateQueries({
          queryKey: orpc.todo.getAll.key(),
        });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to update todo");
      },
    }),
  );

  const deleteMutation = useMutation(
    orpc.todo.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Todo deleted successfully!");
        setAction(null);
        setSelectedTodo(null);
        queryClient.invalidateQueries({
          queryKey: orpc.todo.getAll.key(),
        });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete todo");
      },
    }),
  );

  return (
    <TodoContext.Provider
      value={{
        action,
        setAction,
        selectedTodo,
        setSelectedTodo,
        listQuery,
        createMutation,
        updateMutation,
        deleteMutation,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodoContext = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodoContext must be used within a TodoContextProvider");
  }
  return context;
};
```

---

### 3. Header Component (`src/features/todo/components/header.tsx`)

```tsx
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTodoContext } from "../context";

export const TodoHeader = (): React.ReactNode => {
  const { setAction, setSelectedTodo } = useTodoContext();

  const handleCreate = (): void => {
    setSelectedTodo(null);
    setAction("create");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Todo List</h1>
        <p className="text-muted-foreground text-sm">
          Manage and track your tasks efficiently.
        </p>
      </div>
      <Button onClick={handleCreate} className="w-fit">
        <PlusIcon className="size-4 mr-1.5" />
        Create Todo
      </Button>
    </div>
  );
};
```

---

### 4. Filter Component (`src/features/todo/components/filter.tsx`)

```tsx
import { useEffect, useState } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TodoFilter = (): React.ReactNode => {
  const searchParams = useSearch({ from: "/_authenicated/todos/" });
  const navigate = useNavigate({ from: "/todos/" });

  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.search ?? "",
  );

  useEffect(() => {
    setSearchTerm(searchParams.search ?? "");
  }, [searchParams.search]);

  // Debounce 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();
      const currentParam = searchParams.search ?? "";

      if (trimmed !== currentParam) {
        navigate({
          search: {
            ...searchParams,
            search: trimmed || undefined,
            page: 1,
          },
        });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchParams, navigate]);

  const handleStatusChange = (val: string | null): void => {
    navigate({
      search: {
        ...searchParams,
        status:
          val && val !== "all"
            ? (val as typeof searchParams.status)
            : undefined,
        page: 1,
      },
    });
  };

  const handleClear = (): void => {
    setSearchTerm("");
    navigate({
      search: {
        ...searchParams,
        search: undefined,
        status: undefined,
        page: 1,
      },
    });
  };

  const hasActiveFilters = Boolean(searchTerm || searchParams.status);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search todos by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={searchParams.status ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="canncelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

### 5. Table Component (`src/features/todo/components/table.tsx`)

```tsx
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Edit2Icon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type TodoItem, useTodoContext } from "../context";

export const TodoTable = (): React.ReactNode => {
  const { listQuery, setSelectedTodo, setAction } = useTodoContext();
  const searchParams = useSearch({ from: "/_authenicated/todos/" });
  const navigate = useNavigate({ from: "/todos/" });

  const { data: response, isLoading, isError } = listQuery;
  const items = response?.data ?? [];
  const pagination = response?.pagination ?? {
    page: searchParams.page ?? 1,
    limit: searchParams.limit ?? 10,
    total: 0,
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const currentPage = pagination.page;

  const handlePageChange = (newPage: number): void => {
    navigate({
      search: {
        ...searchParams,
        page: newPage,
      },
    });
  };

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <p className="font-medium">Failed to load todos.</p>
        <p className="text-sm opacity-80 mt-1">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[160px]">Created At</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Loading todos...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No todos found. Try clearing your filters or create a new
                  todo.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: TodoItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-md">
                    {item.description || "—"}
                  </TableCell>
                  <TableCell>{/* Status Badge */}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setSelectedTodo(item);
                          setAction("update");
                        }}
                      >
                        <Edit2Icon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedTodo(item);
                          setAction("delete");
                        }}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2 text-sm text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-medium text-foreground">
            {pagination.total === 0
              ? 0
              : (currentPage - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * pagination.limit, pagination.total)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {pagination.total}
          </span>{" "}
          entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeftIcon className="size-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

### 6. Unified Upsert Modal (`src/features/todo/modals/upsert.tsx`)

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useTodoContext } from "../context";

const upsertTodoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  status: z.enum([
    "draft",
    "not_started",
    "in_progress",
    "pending",
    "done",
    "canncelled",
  ]),
});

type UpsertTodoFormValues = z.infer<typeof upsertTodoSchema>;

export const UpsertTodo = (): React.ReactNode => {
  const {
    action,
    setAction,
    selectedTodo,
    setSelectedTodo,
    createMutation,
    updateMutation,
  } = useTodoContext();

  const isEditing = action === "update" && Boolean(selectedTodo);
  const isOpen = action === "create" || action === "update";

  const form = useForm<UpsertTodoFormValues>({
    resolver: zodResolver(upsertTodoSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (action === "update" && selectedTodo) {
      form.reset({
        name: selectedTodo.name,
        description: selectedTodo.description ?? "",
        status: selectedTodo.status,
      });
    } else if (action === "create") {
      form.reset({
        name: "",
        description: "",
        status: "draft",
      });
    }
  }, [action, selectedTodo, form]);

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = (): void => {
    setAction(null);
    setSelectedTodo(null);
    form.reset();
  };

  const onSubmit = async (values: UpsertTodoFormValues): Promise<void> => {
    if (isEditing && selectedTodo) {
      updateMutation.mutate({
        id: selectedTodo.id,
        body: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleClose}
          disabled={isPending}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </Button>

        <CardHeader>
          <CardTitle>{isEditing ? "Edit Todo" : "Create Todo"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update task details."
              : "Add a new task to your todo list."}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Todo"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};
```

---

### 7. Delete Modal (`src/features/todo/modals/delete-confirm.tsx`)

```tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTodoContext } from "../context";

export const DeleteConfirmModal = (): React.ReactNode => {
  const { action, setAction, selectedTodo, setSelectedTodo, deleteMutation } =
    useTodoContext();

  if (action !== "delete" || !selectedTodo) return null;

  const handleClose = (): void => {
    setAction(null);
    setSelectedTodo(null);
  };

  const handleDelete = (): void => {
    deleteMutation.mutate({ id: selectedTodo.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Delete Todo</CardTitle>
          <CardDescription>
            Are you sure you want to delete &quot;{selectedTodo.name}&quot;?
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
```

---

### 8. Thin Route File (`src/routes/_authenicated/todos/index.tsx`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { TodosPage } from "@/features/todo";
import { orpc } from "@/orpc/client";

export const todoSearchSchema = z.object({
  page: z.number().int().positive().default(1).catch(1),
  limit: z.number().int().positive().default(10).catch(10),
  search: z.string().optional().catch(undefined),
  status: z
    .enum([
      "draft",
      "not_started",
      "in_progress",
      "pending",
      "done",
      "canncelled",
    ])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_authenicated/todos/")({
  validateSearch: todoSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    await context.queryClient.query(
      orpc.todo.getAll.queryOptions({
        input: deps,
      }),
    );
  },
  component: TodosPage,
});
```
