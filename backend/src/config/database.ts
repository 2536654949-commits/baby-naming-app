/**
 * Prisma数据库配置
 */

import { PrismaClient } from '@prisma/client';

// 全局缓存Prisma实例（Vercel Serverless环境需要）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建Prisma客户端实例
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 开发环境下缓存实例，避免热重载创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
