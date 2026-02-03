/**
 * Express类型扩展
 */
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        deviceId: string;
        code: string;
      };
    }
  }
}

// 导出以支持类型导入
export type { Request };
