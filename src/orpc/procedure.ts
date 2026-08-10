import { ORPCError, os } from '@orpc/server'
import { auth } from '@/lib/auth'

export interface ORPCContext {
  headers?: Headers
}

export const publicProcedure = os.$context<ORPCContext>()

export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    if (!context.headers) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Missing request headers',
      })
    }

    const session = await auth.api.getSession({
      headers: context.headers,
    })

    if (!session?.user) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Authentication required',
      })
    }

    return next({
      context: {
        ...context,
        user: session.user,
        session: session.session,
      },
    })
  },
)
