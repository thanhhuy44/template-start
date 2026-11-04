import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { TodosPage } from "@/features/todo";
import { orpc } from "@/orpc/client";

const todoStatusEnum = z.enum([
  "draft",
  "not_started",
  "in_progress",
  "pending",
  "done",
  "canncelled",
]);

export const todoSearchSchema = z.object({
  page: z.number().int().positive().default(1).catch(1),
  limit: z.number().int().positive().default(10).catch(10),
  search: z.string().optional().catch(undefined),
  status: todoStatusEnum.optional().catch(undefined),
});

export type TodoSearchParams = z.infer<typeof todoSearchSchema>;

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
