import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../../lib/db';
import { TRPCError } from '@trpc/server';

export const conversationRouter = router({
  // 获取对话列表
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.conversation.findMany({
      where: { userId: ctx.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });
  }),

  // 创建新对话
  create: protectedProcedure.mutation(async ({ ctx }) => {
    return db.conversation.create({
      data: { title: '新对话', userId: ctx.userId },
    });
  }),

  // 获取某个对话的消息
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 验证归属
      const conv = await db.conversation.findFirst({
        where: { id: input.conversationId, userId: ctx.userId },
      });
      if (!conv) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '对话不存在' });
      }
      return db.message.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: 'asc' },
      });
    }),

  // 删除对话
  delete: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.conversation.deleteMany({
        where: { id: input.conversationId, userId: ctx.userId },
      });
      return { success: true };
    }),

  // 更新标题
  updateTitle: protectedProcedure
    .input(z.object({ conversationId: z.string(), title: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return db.conversation.update({
        where: { id: input.conversationId, userId: ctx.userId },
        data: { title: input.title },
      });
    }),
});
