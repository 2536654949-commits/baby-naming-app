import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const shouldLogRequest = process.env.ENABLE_HTTP_LOGS !== 'false';
const shouldLogBody = process.env.LOG_REQUEST_BODY === 'true';
const isDev = process.env.NODE_ENV !== 'production';

// 敏感字段列表（需要脱敏）
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'cookie', 'apikey', 'secret', 'key', 'credential'];

/**
 * 脱敏处理
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * 截断大数据
 */
function truncateData(data: any, maxLength: number = 1000): any {
  if (!data) return data;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  if (str.length <= maxLength) return data;
  return { _truncated: true, preview: str.substring(0, maxLength) + '...' };
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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
  const requestId = generateRequestId();

  // 存储请求 ID 用于关联日志
  (req as any)._requestId = requestId;

  // 记录请求开始
  const requestLog: any = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  };

  // 只在有查询参数时记录
  if (Object.keys(req.query).length > 0) {
    requestLog.query = req.query;
  }

  // 开发环境记录请求 body（需要开启 LOG_REQUEST_BODY）
  if (isDev && shouldLogBody && req.body && Object.keys(req.body).length > 0) {
    requestLog.body = truncateData(sanitizeData(req.body));
  }

  logger.http('请求开始', requestLog);

  // 捕获响应 body（仅开发环境且开启了 LOG_REQUEST_BODY）
  if (isDev && shouldLogBody) {
    const originalSend = res.send.bind(res);
    res.send = function(body: any) {
      (res as any)._body = body;
      return originalSend(body);
    };
  }

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const responseLog: any = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    // 开发环境记录响应 body
    if (isDev && shouldLogBody && (res as any)._body) {
      try {
        const bodyData = typeof (res as any)._body === 'string'
          ? JSON.parse((res as any)._body)
          : (res as any)._body;
        responseLog.responseBody = truncateData(sanitizeData(bodyData));
      } catch {
        // 非 JSON 响应不记录
      }
    }

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('请求完成 - 服务器错误', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('请求完成 - 客户端错误', responseLog);
    } else {
      logger.http('请求完成', responseLog);
    }
  });

  next();
};

export default {
  requestLogger,
};
