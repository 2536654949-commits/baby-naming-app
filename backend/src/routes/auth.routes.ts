/**
 * 认证路由
 * 定义认证相关的API端点
 */

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate, validate, validateCodeSchema } from '../middleware';
import { authLimiter } from '../middleware';

const router = Router();

/**
 * POST /api/auth/validate
 * 验证授权码并激活
 */
router.post(
  '/validate',
  authLimiter,
  validate(validateCodeSchema),
  authController.validate
);

/**
 * POST /api/auth/recover
 * 恢复Token（设备匹配）
 */
router.post(
  '/recover',
  authLimiter,
  validate(validateCodeSchema),
  authController.recover
);

/**
 * GET /api/auth/status
 * 获取授权状态（需要认证）
 */
router.get('/status', authenticate, authController.getStatus);

export default router;
