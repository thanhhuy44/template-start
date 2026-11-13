import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./user";

export const todo = pgTable("todo", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text({
    enum: [
      "draft",
      "not_started",
      "in_progress",
      "pending",
      "done",
      "canncelled",
    ],
  })
    .default("draft")
    .notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
