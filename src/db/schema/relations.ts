import { relations } from "drizzle-orm";

import { account } from "./account";
import { session } from "./session";
import { todo } from "./todo";
import { user } from "./user";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const todoRelations = relations(todo, ({ one }) => ({
  user: one(user, {
    fields: [todo.createdBy],
    references: [user.id],
  }),
}));
