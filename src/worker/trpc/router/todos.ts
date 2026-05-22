import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { t, protectedProcedure } from '../trpc-instance'
import { todoCards, todoColumns } from '@/db/drizzle-out/schema'

export const todosRouter = t.router({
  getBoard: protectedProcedure.query(async ({ ctx }) => {
    let cols = await ctx.db
      .select()
      .from(todoColumns)
      .where(eq(todoColumns.userId, ctx.userId))
      .orderBy(asc(todoColumns.position))

    if (cols.length === 0) {
      const defaults = [
        { title: 'To Do', position: 0, userId: ctx.userId },
        { title: 'In Progress', position: 1, userId: ctx.userId },
        { title: 'Done', position: 2, userId: ctx.userId },
      ]
      cols = await ctx.db.insert(todoColumns).values(defaults).returning()
    }

    const cards = await ctx.db
      .select()
      .from(todoCards)
      .where(eq(todoCards.userId, ctx.userId))
      .orderBy(asc(todoCards.position))

    return cols.map((col) => ({
      ...col,
      cards: cards
        .filter((c) => c.columnId === col.id)
        .sort((a, b) => a.position - b.position),
    }))
  }),

  createColumn: protectedProcedure
    .input(z.object({ title: z.string().min(1), position: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const [col] = await ctx.db
        .insert(todoColumns)
        .values({ ...input, userId: ctx.userId })
        .returning()
      return col
    }),

  renameColumn: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [col] = await ctx.db
        .update(todoColumns)
        .set({ title: input.title })
        .where(and(eq(todoColumns.id, input.id), eq(todoColumns.userId, ctx.userId)))
        .returning()
      return col
    }),

  deleteColumn: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(todoColumns)
        .where(and(eq(todoColumns.id, input.id), eq(todoColumns.userId, ctx.userId)))
      return { success: true }
    }),

  createCard: protectedProcedure
    .input(z.object({ columnId: z.string(), text: z.string().min(1), position: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .insert(todoCards)
        .values({ ...input, userId: ctx.userId })
        .returning()
      return card
    }),

  // ✅ No transaction
  deleteCard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .select()
        .from(todoCards)
        .where(and(eq(todoCards.id, input.id), eq(todoCards.userId, ctx.userId)))

      if (!card) return { success: false }

      await ctx.db
        .delete(todoCards)
        .where(and(eq(todoCards.id, input.id), eq(todoCards.userId, ctx.userId)))

      const remaining = await ctx.db
        .select()
        .from(todoCards)
        .where(and(eq(todoCards.userId, ctx.userId), eq(todoCards.columnId, card.columnId)))
        .orderBy(asc(todoCards.position))

      for (const [position, c] of remaining.entries()) {
        await ctx.db
          .update(todoCards)
          .set({ position })
          .where(and(eq(todoCards.id, c.id), eq(todoCards.userId, ctx.userId)))
      }

      return { success: true }
    }),

  // ✅ No transaction
  moveCard: protectedProcedure
    .input(z.object({ id: z.string(), toColumnId: z.string(), position: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [movedCard] = await ctx.db
        .select()
        .from(todoCards)
        .where(and(eq(todoCards.id, input.id), eq(todoCards.userId, ctx.userId)))

      if (!movedCard) return { success: false }

      const allCards = await ctx.db
        .select()
        .from(todoCards)
        .where(eq(todoCards.userId, ctx.userId))

      const sameColumn = movedCard.columnId === input.toColumnId
      const sourceCards = allCards
        .filter((c) => c.columnId === movedCard.columnId)
        .sort((a, b) => a.position - b.position)
      const sourceIndex = sourceCards.findIndex((c) => c.id === movedCard.id)

      if (sourceIndex === -1) return { success: false }

      if (sameColumn) {
        const reordered = [...sourceCards]
        reordered.splice(sourceIndex, 1)
        const insertIndex = Math.max(
          0,
          Math.min(
            input.position - (sourceIndex < input.position ? 1 : 0),
            reordered.length,
          ),
        )
        reordered.splice(insertIndex, 0, movedCard)

        for (const [position, card] of reordered.entries()) {
          await ctx.db
            .update(todoCards)
            .set({ position })
            .where(and(eq(todoCards.id, card.id), eq(todoCards.userId, ctx.userId)))
        }
      } else {
        const targetCards = allCards
          .filter((c) => c.columnId === input.toColumnId)
          .sort((a, b) => a.position - b.position)

        const reorderedSource = sourceCards.filter((c) => c.id !== movedCard.id)
        const reorderedTarget = [...targetCards]
        const insertIndex = Math.max(0, Math.min(input.position, reorderedTarget.length))
        reorderedTarget.splice(insertIndex, 0, { ...movedCard, columnId: input.toColumnId })

        for (const [position, card] of reorderedSource.entries()) {
          await ctx.db
            .update(todoCards)
            .set({ position })
            .where(and(eq(todoCards.id, card.id), eq(todoCards.userId, ctx.userId)))
        }

        for (const [position, card] of reorderedTarget.entries()) {
          await ctx.db
            .update(todoCards)
            .set({ columnId: input.toColumnId, position })
            .where(and(eq(todoCards.id, card.id), eq(todoCards.userId, ctx.userId)))
        }
      }

      return { success: true }
    }),
})