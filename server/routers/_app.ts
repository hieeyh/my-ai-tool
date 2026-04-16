import { router } from '../trpc';
import { conversationRouter } from './conversation';

export const appRouter = router({
  conversation: conversationRouter,
});

// 导出类型供前端使用
export type AppRouter = typeof appRouter;
