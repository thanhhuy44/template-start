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
