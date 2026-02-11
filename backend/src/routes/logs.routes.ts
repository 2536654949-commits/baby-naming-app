/**
 * 日志查看路由 - 仅开发环境
 * 提供日志文件的查看、搜索和清理 API
 */
import { Router, Request, Response, NextFunction } from 'express';
import logsController from '../controllers/logs.controller';

const router = Router();

/**
 * 开发环境检查中间件
 * 生产环境禁止访问日志 API
 */
const devOnly = (_req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: '生产环境禁止访问' },
    });
    return;
  }
  next();
};

router.use(devOnly);

// GET /api/logs - 获取日志文件列表
router.get('/', logsController.listLogs.bind(logsController));

// GET /api/logs/search - 搜索日志（需要放在 /:filename 之前）
router.get('/search', logsController.searchLogs.bind(logsController));

// GET /api/logs/:filename - 获取日志内容
router.get('/:filename', logsController.getLogContent.bind(logsController));

// DELETE /api/logs/cleanup - 清理旧日志
router.delete('/cleanup', logsController.cleanupLogs.bind(logsController));

export default router;
