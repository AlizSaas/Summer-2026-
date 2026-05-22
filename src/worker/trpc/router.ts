import { t } from './trpc-instance'
import { booksRouter } from './router/books'
import { projectsRouter } from './router/projects'
import { goalsRouter } from './router/goals'
import { todosRouter } from './router/todos'

export const appRouter = t.router({
  books: booksRouter,
  projects: projectsRouter,
  goals: goalsRouter,
  todos: todosRouter,
})

export type AppRouter = typeof appRouter

