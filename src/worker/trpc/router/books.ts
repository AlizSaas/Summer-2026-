import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { t, protectedProcedure } from '../trpc-instance'
import { books } from '@/db/drizzle-out/schema'

const bookInput = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  dateFinished: z.string().default(''),
  summary: z.string().default(''),
  knowledgeRating: z.number().int().min(1).max(10).default(5),
  learningDepth: z.number().int().min(1).max(10).default(5),
  practicalValue: z.number().int().min(1).max(10).default(5),
  overallRating: z.number().int().min(1).max(10).default(5),
  genre: z.string().default(''),
  notes: z.string().default(''),
})

export const booksRouter = t.router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(books)
      .where(eq(books.userId, ctx.userId))
      .orderBy(desc(books.createdAt))
  }),

  create: protectedProcedure.input(bookInput).mutation(async ({ ctx, input }) => {
    const [book] = await ctx.db
      .insert(books)
      .values({ ...input, userId: ctx.userId })
      .returning()
    return book
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(bookInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const [book] = await ctx.db
        .update(books)
        .set(data)
        .where(and(eq(books.id, id), eq(books.userId, ctx.userId)))
        .returning()
      return book
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(books)
        .where(and(eq(books.id, input.id), eq(books.userId, ctx.userId)))
      return { success: true }
    }),
})
