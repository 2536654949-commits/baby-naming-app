import { Response, NextFunction } from 'express';
import type { Request as AuthRequest } from '../types/express';
import logger from '../utils/logger';
import nameService from '../services/name.service';
import { NameInput } from '../types';
import { createError } from '../utils';

class NameController {
  /**
   * 生成名字
   * POST /api/name/generate
   */
  generate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 从JWT中获取用户信息
      const userId = req.user?.userId;
      const deviceId = req.user?.deviceId;

      if (!userId || !deviceId) {
        throw createError.invalidToken();
      }

      // 获取起名参数
      const input: NameInput = req.body;

      logger.info('收到起名请求', { userId, surname: input.surname, gender: input.gender });

      // 调用起名服务
      const result = await nameService.generateName(userId, deviceId, input);

      res.json({
        success: true,
        data: {
          names: result.names,
          generationTime: result.generationTime,
        },
      });

      logger.info('起名请求成功', { userId, nameCount: result.names.length });
    } catch (error: any) {
      // 处理频率限制错误
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            waitSeconds: error.waitSeconds || 0,
          },
        });
        return;
      }

      next(error);
    }
  };

  /**
   * 获取历史记录
   * GET /api/name/history
   */
  getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createError.invalidToken();
      }

      // 获取查询参数
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      logger.info('获取历史记录请求', { userId, limit, offset });

      // 调用服务
      const result = await nameService.getHistory(userId, limit, offset);

      res.json({
        success: true,
        data: result,
      });

      logger.info('历史记录获取成功', { userId, count: result.records.length });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取历史记录详情
   * GET /api/name/history/:id
   */
  getHistoryDetail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const recordId = req.params.id;

      if (!userId) {
        throw createError.invalidToken();
      }

      logger.info('获取历史记录详情', { userId, recordId });

      const record = await nameService.getHistoryDetail(userId, recordId);

      res.json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
        return;
      }

      next(error);
    }
  };

  /**
   * 获取使用统计
   * GET /api/name/stats
   */
  getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createError.invalidToken();
      }

      logger.info('获取使用统计', { userId });

      const stats = await nameService.getStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取频率限制状态
   * GET /api/name/rate-limit
   */
  getRateLimitStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createError.invalidToken();
      }

      const status = await nameService.getRateLimitStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new NameController();
