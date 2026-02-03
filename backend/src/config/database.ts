/**
 * Prisma数据库配置
 */

import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
