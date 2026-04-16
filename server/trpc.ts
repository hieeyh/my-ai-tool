import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '../auth';

// Context：每次请求都会创建，包含当前用户信息
export async function createContext() {
  const session = await auth();
  return { session };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

// 基础 router 和 procedure
export const router = t.router;
export const publicProcedure = t.procedure;

// 需要登录的 procedure——未登录自动报 401
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: '请先登录' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
    },
  });
});
