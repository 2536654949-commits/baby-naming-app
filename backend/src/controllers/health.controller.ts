/**
 * Health Controller
 * 健康检查控制器
 */

import { Request, Response } from 'express';
import { prisma } from '../config';

export class HealthController {
  /**
   * 获取服务健康状态
   * GET /health
   */
  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const uptime = process.uptime();
      const minutes = Math.floor(uptime / 60);
      const seconds = Math.floor(uptime % 60);

      try {
        // 检查数据库连接
        await prisma.$queryRaw`SELECT 1`;

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          uptime: `${minutes}m ${seconds}s`,
        });
      } catch (error) {
        res.status(503).json({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          uptime: `${minutes}m ${seconds}s`,
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      });
    }
  }

  /**
   * 获取API信息
   * GET /
   */
  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      name: 'Baby Name API',
      version: '2.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    });
  }
}

export default new HealthController();
