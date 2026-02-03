/**
 * 起名路由
 * 定义起名相关的API端点
 */

import { Router } from 'express';
import nameController from '../controllers/name.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateNameSchema } from '../middleware/validate.middleware';

const router = Router();

/**
 * POST /api/name/generate
 * 生成名字（需要JWT认证）
 */
router.post(
  '/generate',
  authenticate, // JWT认证必需
  validate(validateNameSchema, 'body'), // 请求体验证
  nameController.generate
);

/**
 * GET /api/name/history
 * 获取历史记录（需要JWT认证）
 */
router.get(
  '/history',
  authenticate, // JWT认证必需
  nameController.getHistory
);

/**
 * GET /api/name/history/:id
 * 获取历史记录详情（需要JWT认证）
 */
router.get(
  '/history/:id',
  authenticate, // JWT认证必需
  nameController.getHistoryDetail
);

/**
 * GET /api/name/stats
 * 获取使用统计（需要JWT认证）
 */
router.get(
  '/stats',
  authenticate, // JWT认证必需
  nameController.getStats
);

/**
 * GET /api/name/rate-limit
 * 获取频率限制状态（需要JWT认证）
 */
router.get(
  '/rate-limit',
  authenticate, // JWT认证必需
  nameController.getRateLimitStatus
);

export default router;
