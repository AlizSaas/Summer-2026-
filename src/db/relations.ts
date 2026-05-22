import { relations } from "drizzle-orm";
import {
  user,
  session,
  account,
  books,
  projects,
  goals,
  todoColumns,
  todoCards,
} from "./drizzle-out/schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  books: many(books),
  projects: many(projects),
  goals: many(goals),
  todoColumns: many(todoColumns),
  todoCards: many(todoCards),
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

export const booksRelations = relations(books, ({ one }) => ({
  user: one(user, {
    fields: [books.userId],
    references: [user.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(user, {
    fields: [goals.userId],
    references: [user.id],
  }),
}));

export const todoColumnsRelations = relations(todoColumns, ({ one, many }) => ({
  user: one(user, {
    fields: [todoColumns.userId],
    references: [user.id],
  }),
  cards: many(todoCards),
}));

export const todoCardsRelations = relations(todoCards, ({ one }) => ({
  user: one(user, {
    fields: [todoCards.userId],
    references: [user.id],
  }),
  column: one(todoColumns, {
    fields: [todoCards.columnId],
    references: [todoColumns.id],
  }),
}));
