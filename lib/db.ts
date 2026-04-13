import { PrismaClient } from '../app/generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// 开发环境防止热重载时创建多个连接（全局单例模式）
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
