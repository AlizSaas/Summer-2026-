import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { t, protectedProcedure } from '../trpc-instance'
import { goals } from '@/db/drizzle-out/schema'

const goalStatus = z.enum(['not-started', 'in-progress', 'completed', 'paused'])
const goalPriority = z.enum(['low', 'medium', 'high'])

const goalInput = z.object({
  title: z.string().min(1),
  category: z.string().default(''),
  description: z.string().default(''),
  status: goalStatus.default('not-started'),
  priority: goalPriority.default('medium'),
  targetDate: z.string().default(''),
  progress: z.number().int().min(0).max(100).default(0),
  notes: z.string().default(''),
})

const listInput =
  z
    .object({
      status: goalStatus.optional(),
      priority: goalPriority.optional(),
    })
    .optional()

export const goalsRouter = t.router({
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const conditions = [eq(goals.userId, ctx.userId)]
    if (input?.status) {
      conditions.push(eq(goals.status, input.status))
    }
    if (input?.priority) {
      conditions.push(eq(goals.priority, input.priority))
    }

    return ctx.db
      .select()
      .from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt))
  }),

  create: protectedProcedure.input(goalInput).mutation(async ({ ctx, input }) => {
    const [goal] = await ctx.db
      .insert(goals)
      .values({ ...input, userId: ctx.userId })
      .returning()
    return goal
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(goalInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const [goal] = await ctx.db
        .update(goals)
        .set(data)
        .where(and(eq(goals.id, id), eq(goals.userId, ctx.userId)))
        .returning()
      return goal
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.userId)))
      return { success: true }
    }),
})
