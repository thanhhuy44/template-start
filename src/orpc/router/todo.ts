import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { todo } from "@/db/schema/todo";

import { protectedProcedure } from "../procedure";

const todoStatusEnum = z.enum([
  "draft",
  "not_started",
  "in_progress",
  "pending",
  "done",
  "canncelled",
]);

export const todoRouter = {
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(10),
        search: z.string().optional(),
        status: todoStatusEnum.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const page = input.page ?? 1;
      const limit = input.limit ?? 10;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [eq(todo.createdBy, context.user.id)];

      if (input.status) {
        conditions.push(eq(todo.status, input.status));
      }

      if (input.search && input.search.trim()) {
        const searchTerm = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(todo.name, searchTerm),
            ilike(todo.description, searchTerm),
          )!,
        );
      }

      const whereClause = and(...conditions);

      const [data, [{ total }]] = await Promise.all([
        db
          .select()
          .from(todo)
          .where(whereClause)
          .orderBy(desc(todo.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(todo).where(whereClause),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total: Number(total),
        },
      };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [item] = await db
        .select()
        .from(todo)
        .where(and(eq(todo.id, input.id), eq(todo.createdBy, context.user.id)));

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
      }

      return item;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().default(""),
        status: todoStatusEnum.optional().default("draft"),
      }),
    )
    .handler(async ({ input, context }) => {
      const [created] = await db
        .insert(todo)
        .values({
          name: input.name,
          description: input.description,
          status: input.status,
          createdBy: context.user.id,
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        body: z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          status: todoStatusEnum.optional(),
        }),
      }),
    )
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(todo)
        .set({
          ...input.body,
          updatedAt: new Date(),
        })
        .where(and(eq(todo.id, input.id), eq(todo.createdBy, context.user.id)))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [deleted] = await db
        .delete(todo)
        .where(and(eq(todo.id, input.id), eq(todo.createdBy, context.user.id)))
        .returning();

      if (!deleted) {
        throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
      }

      return { success: true };
    }),
};
