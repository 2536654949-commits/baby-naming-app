import { Request, Response, NextFunction } from 'express';
import { ApiError, RateLimitError } from '../utils';
import logger from '../utils/logger';

/**
 * 错误响应中间件
 */
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 记录错误日志
  logger.error('请求错误', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // 处理ApiError
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof RateLimitError ? { waitSeconds: error.waitSeconds } : {}),
      },
    });
    return;
  }

  // 处理Zod验证错误
  if (error.name === 'ZodError' || error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || '请求数据格式不正确',
      },
    });
    return;
  }

  // 处理JSON解析错误
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '请求数据格式不正确',
      },
    });
    return;
  }

  // 处理未知错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误，请稍后重试',
    },
  });
};

/**
 * 404处理
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `请求的路径 ${req.method} ${req.path} 不存在`,
    },
  });
};

export default {
  errorHandler,
  notFoundHandler,
};
