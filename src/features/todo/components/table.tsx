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

const getStatusBadge = (status: TodoItem["status"]): React.ReactNode => {
  switch (status) {
    case "done":
      return (
        <Badge className="bg-emerald-600/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
          Done
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-600/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
          In Progress
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-600/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
          Pending
        </Badge>
      );
    case "not_started":
      return <Badge variant="outline">Not Started</Badge>;
    case "canncelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "draft":
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
};

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
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
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
                        title="Edit todo"
                      >
                        <Edit2Icon className="size-4" />
                        <span className="sr-only">Edit {item.name}</span>
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
                        title="Delete todo"
                      >
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Delete {item.name}</span>
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
