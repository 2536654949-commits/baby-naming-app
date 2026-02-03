import { Response, NextFunction } from 'express';
import type { Request as AuthRequest } from '../types/express';
import authService from '../services/auth.service';
import { ValidateCodeRequest, RecoverTokenRequest } from '../types';
import { getClientIp } from '../utils';
import { createError } from '../utils';

export class AuthController {
  /**
   * 验证授权码
   * POST /api/auth/validate
   */
  async validate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, deviceId }: ValidateCodeRequest = req.body;
      const activatedIp = getClientIp(req);

      const result = await authService.validateCode(code, deviceId, activatedIp);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 恢复Token
   * POST /api/auth/recover
   */
  async recover(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, deviceId }: RecoverTokenRequest = req.body;

      const result = await authService.recoverToken(code, deviceId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取授权状态
   * GET /api/auth/status
   */
  async getStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 从认证中间件获取用户信息
      const userId = req.user?.userId;
      if (!userId) {
        throw createError.invalidToken();
      }

      const status = await authService.getStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
