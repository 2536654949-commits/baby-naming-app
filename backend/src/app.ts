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

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.use(cors({
    origin: frontendUrl,
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
