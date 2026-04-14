import { PrismaClient } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 懒加载：只在真正调用时才初始化，build 阶段不会触发
export function getDb(): PrismaClient {
  if (global.__prisma) return global.__prisma;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const adapter = new PrismaPg({ connectionString: url });
  global.__prisma = new PrismaClient({ adapter });
  return global.__prisma;
}

// 兼容旧代码的 db 导出（动态 getter）
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
