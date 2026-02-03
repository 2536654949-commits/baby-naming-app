import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const shouldLogRequest = process.env.ENABLE_HTTP_LOGS !== 'false';

/**
 * HTTP请求日志中间件
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!shouldLogRequest) {
    next();
    return;
  }
  const startTime = Date.now();

  // 记录请求开始
  logger.http('请求开始', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http('请求完成', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

export default {
  requestLogger,
};
