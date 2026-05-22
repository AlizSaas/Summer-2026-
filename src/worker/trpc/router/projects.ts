import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { t, protectedProcedure } from '../trpc-instance'
import { projects } from '@/db/drizzle-out/schema'

const projectInput = z.object({
  title: z.string().min(1),
  type: z.enum(['project', 'open-source']).default('project'),
  description: z.string().default(''),
  link: z.string().default(''),
  techStack: z.string().default(''),
  status: z.enum(['in-progress', 'completed', 'abandoned']).default('in-progress'),
  impact: z.string().default(''),
  lessonsLearned: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
})

export const projectsRouter = t.router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.userId, ctx.userId))
      .orderBy(desc(projects.createdAt))
  }),

  create: protectedProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const [project] = await ctx.db
      .insert(projects)
      .values({ ...input, userId: ctx.userId })
      .returning()
    return project
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(projectInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const [project] = await ctx.db
        .update(projects)
        .set(data)
        .where(and(eq(projects.id, id), eq(projects.userId, ctx.userId)))
        .returning()
      return project
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.userId)))
      return { success: true }
    }),
})
