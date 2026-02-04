/**
 * Vercel Serverless入口
 * 导出Express应用供Vercel使用
 */

import 'dotenv/config';
import { createApp } from './app';

// 创建Express应用实例
const app = createApp();

// 导出供Vercel使用
export default app;
