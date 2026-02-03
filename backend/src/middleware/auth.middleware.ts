/**
 * JWT认证中间件
 * 验证JWT Token并将用户信息附加到请求对象
 */

import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { createError } from '../utils';
import logger from '../utils/logger';

/**
 * 必需认证中间件
 * Token无效返回401
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从Authorization Header提取Bearer Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError.invalidToken();
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证Token
    const payload = await authService.verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = {
      userId: payload.userId,
      deviceId: payload.deviceId,
      code: payload.code,
    };

    next();
  } catch (error: any) {
    logger.warn('认证失败', { error: error.message });
    next(error);
  }
};

/**
 * 可选认证中间件
 * Token无效继续处理，但req.user可能为undefined
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);

      req.user = {
        userId: payload.userId,
        deviceId: payload.deviceId,
        code: payload.code,
      };
    }

    next();
  } catch (error: any) {
    // 可选认证，忽略错误继续处理
    logger.debug('可选认证失败，继续处理', { error: error.message });
    next();
  }
};

export default {
  authenticate,
  optionalAuth,
};
