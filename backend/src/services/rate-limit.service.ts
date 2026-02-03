/**
 * 频率限制服务
 * 基于用户ID的起名请求频率控制
 */

import Redis from 'ioredis';
import logger from '../utils/logger';
import { RateLimitResult } from '../types';

class RateLimitService {
  private redis: Redis | null = null;
  private readonly limitSeconds: number = 30; // 30秒
  private readonly useRedis: boolean;

  constructor() {
    // 检查是否配置了Redis
    const redisUrl = process.env.REDIS_URL;
    this.useRedis = !!redisUrl;

    if (this.useRedis) {
      try {
        this.redis = new Redis(redisUrl!, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 100, 2000);
          },
        });

        this.redis.on('error', (error) => {
          logger.error('Redis连接错误', { error });
        });

        this.redis.on('connect', () => {
          logger.info('Redis连接成功');
        });

        logger.info('Redis频率限制已启用');
      } catch (error) {
        logger.error('Redis初始化失败，将使用内存缓存', { error });
        this.redis = null;
      }
    } else {
      logger.info('未配置Redis，将使用内存缓存进行频率限制');
    }

    // 内存缓存（降级方案）
    this.memoryCache = new Map();
  }

  /**
   * 内存缓存（降级方案）
   */
  private memoryCache: Map<string, number>;

  /**
   * 检查频率限制
   * @param userId 用户ID
   * @returns 是否允许请求和等待秒数
   */
  async checkLimit(userId: string): Promise<RateLimitResult> {
    const key = `ratelimit:name:${userId}`;

    try {
      if (this.redis) {
        return await this.checkWithRedis(key);
      } else {
        return this.checkWithMemory(key);
      }
    } catch (error) {
      logger.error('频率限制检查失败', { error, userId });
      // 出错时允许请求，避免影响正常使用
      return { allowed: true, waitSeconds: 0 };
    }
  }

  /**
   * 使用Redis检查频率限制
   */
  private async checkWithRedis(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const lastRequest = await this.redis!.get(key);

    if (lastRequest) {
      const lastTime = parseInt(lastRequest, 10);
      const elapsed = now - lastTime;

      if (elapsed < this.limitSeconds * 1000) {
        const waitSeconds = Math.ceil((this.limitSeconds * 1000 - elapsed) / 1000);
        logger.warn('频率限制触发', { key, waitSeconds });
        return { allowed: false, waitSeconds };
      }
    }

    // 允许请求，设置新的时间戳
    await this.redis!.set(key, now.toString(), 'EX', this.limitSeconds);
    logger.info('频率限制检查通过', { key });
    return { allowed: true, waitSeconds: 0 };
  }

  /**
   * 使用内存检查频率限制
   */
  private checkWithMemory(key: string): Promise<RateLimitResult> {
    return new Promise((resolve) => {
      const now = Date.now();
      const lastRequest = this.memoryCache.get(key);

      if (lastRequest) {
        const elapsed = now - lastRequest;

        if (elapsed < this.limitSeconds * 1000) {
          const waitSeconds = Math.ceil((this.limitSeconds * 1000 - elapsed) / 1000);
          logger.warn('频率限制触发（内存）', { key, waitSeconds });
          resolve({ allowed: false, waitSeconds });
          return;
        }
      }

      // 允许请求，设置新的时间戳
      this.memoryCache.set(key, now);

      // 定期清理过期数据（简单实现）
      if (this.memoryCache.size > 10000) {
        this.cleanupMemoryCache();
      }

      logger.info('频率限制检查通过（内存）', { key });
      resolve({ allowed: true, waitSeconds: 0 });
    });
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    const expireTime = this.limitSeconds * 1000;

    for (const [key, timestamp] of this.memoryCache.entries()) {
      if (now - timestamp > expireTime) {
        this.memoryCache.delete(key);
      }
    }

    logger.info('内存缓存清理完成', { size: this.memoryCache.size });
  }

  /**
   * 重置用户的频率限制
   */
  async resetLimit(userId: string): Promise<void> {
    const key = `ratelimit:name:${userId}`;

    try {
      if (this.redis) {
        await this.redis.del(key);
        logger.info('Redis频率限制已重置', { key });
      } else {
        this.memoryCache.delete(key);
        logger.info('内存频率限制已重置', { key });
      }
    } catch (error) {
      logger.error('重置频率限制失败', { error, userId });
    }
  }

  /**
   * 获取用户剩余等待时间
   */
  async getWaitSeconds(userId: string): Promise<number> {
    const key = `ratelimit:name:${userId}`;

    try {
      if (this.redis) {
        const lastRequest = await this.redis!.get(key);
        if (lastRequest) {
          const now = Date.now();
          const elapsed = now - parseInt(lastRequest, 10);
          if (elapsed < this.limitSeconds * 1000) {
            return Math.ceil((this.limitSeconds * 1000 - elapsed) / 1000);
          }
        }
      } else {
        const lastRequest = this.memoryCache.get(key);
        if (lastRequest) {
          const now = Date.now();
          const elapsed = now - lastRequest;
          if (elapsed < this.limitSeconds * 1000) {
            return Math.ceil((this.limitSeconds * 1000 - elapsed) / 1000);
          }
        }
      }
    } catch (error) {
      logger.error('获取等待时间失败', { error, userId });
    }

    return 0;
  }

  /**
   * 关闭Redis连接
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis连接已关闭');
    }
  }
}

export default new RateLimitService();
