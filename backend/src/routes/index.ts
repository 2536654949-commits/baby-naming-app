/**
 * 路由聚合
 * 统一注册所有路由
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import nameRoutes from './name.routes';
import healthRoutes from './health.routes';
import favoriteRoutes from './favorite.routes';
import logsRoutes from './logs.routes';

const apiRouter = Router();

// 注册各模块路由
apiRouter.use('/auth', authRoutes);
apiRouter.use('/name', nameRoutes);
apiRouter.use('/favorites', favoriteRoutes);
apiRouter.use('/', healthRoutes);

// 开发环境注册日志查看路由
if (process.env.NODE_ENV !== 'production') {
  apiRouter.use('/logs', logsRoutes);
}

export default apiRouter;
