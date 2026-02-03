/**
 * 健康检查路由
 */

import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

/**
 * GET /health
 * 健康检查端点
 */
router.get('/health', healthController.getHealth);

/**
 * GET /
 * API信息端点
 */
router.get('/', healthController.getInfo);

export default router;
