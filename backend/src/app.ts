import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRouter from './routes';
import { errorHandler, notFoundHandler, requestLogger, performanceMonitor } from './middleware';

/**
 * 创建Express应用
 */
export function createApp(): Application {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // 支持多个前端地址（用逗号分隔）
  const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如移动端应用、Postman等）
      if (!origin) {
        return callback(null, true);
      }
      // 生产环境：允许所有 vercel.app 子域名和配置的域名
      if (process.env.NODE_ENV === 'production') {
        const allowedPatterns = [
          ...frontendUrls,
          /\.vercel\.app$/,
        ];
        const isAllowed = allowedPatterns.some(pattern => {
          if (pattern instanceof RegExp) {
            return pattern.test(origin);
          }
          return origin === pattern || origin.startsWith(pattern.replace(/\/$/, ''));
        });
        if (isAllowed) {
          return callback(null, true);
        }
      } else {
        // 开发环境：检查是否在允许列表中
        if (frontendUrls.some(url => origin === url || origin.startsWith(url.replace(/\/$/, '')))) {
          return callback(null, true);
        }
      }
      callback(new Error('CORS not allowed'));
    },
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(compression({ threshold: 1024 }));

  app.use(performanceMonitor);
  app.use(requestLogger);

  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
