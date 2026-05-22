import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

export const t = initTRPC.context<Context>().create()

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in.' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

