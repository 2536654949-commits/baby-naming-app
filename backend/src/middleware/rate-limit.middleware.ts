/**
 * 限流中间件
 * 基于express-rate-limit实现请求频率限制
 */

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

/**
 * 授权码验证/恢复限流器
 * 15分钟内最多10次
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '操作过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('触发授权限流', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '操作过于频繁，请15分钟后再试',
      },
    });
  },
});

/**
 * 全局API限流器
 * 15分钟内最多100次请求
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('触发全局限流', { ip: req.ip });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
      },
    });
  },
});

export default {
  authLimiter,
  apiLimiter,
};
