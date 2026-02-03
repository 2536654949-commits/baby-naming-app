/**
 * 服务入口
 * 启动HTTP服务并处理优雅关机
 *
 * 重要: dotenv/config 必须在其他导入之前加载。
 * 因为某些服务（如 zhipuService）会在导入时读取环境变量。
 */

import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { prisma } from './config';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;
const allowNoDatabase = process.env.ALLOW_NO_DB === 'true';
const app = createApp();
const server = http.createServer(app);

/**
 * 启动服务
 */
async function startServer() {
  try {
    // 测试数据库连接
    try {
      await prisma.$connect();
      logger.info('数据库连接成功');
    } catch (error) {
      if (allowNoDatabase) {
        logger.warn('数据库连接失败，已启用无数据库模式', { error });
      } else {
        throw error;
      }
    }

    // 启动HTTP服务
    server.listen(PORT, () => {
      logger.info(`服务启动成功，端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('服务启动失败', { error });
    process.exit(1);
  }
}

/**
 * 优雅关机
 */
async function gracefulShutdown(signal: string) {
  logger.info(`收到 ${signal} 信号，开始优雅关机...`);

  // 停止接收新请求
  server.close(() => {
    logger.info('HTTP服务已关闭');
  });

  // 等待现有请求完成（最多10秒）
  const shutdownTimeout = setTimeout(() => {
    logger.error('优雅关机超时，强制退出');
    process.exit(1);
  }, 10000);

  try {
    // 关闭数据库连接
    await prisma.$disconnect();
    logger.info('数据库连接已关闭');

    clearTimeout(shutdownTimeout);
    logger.info('优雅关机完成');
    process.exit(0);
  } catch (error) {
    logger.error('关机过程中发生错误', { error });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// 监听退出信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的错误
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

// 启动服务
startServer();
