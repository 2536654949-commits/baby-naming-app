import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// 配置常量
const SLOW_REQUEST_THRESHOLD = 5000; // 5秒
const MEMORY_LOG_INTERVAL = 300000; // 5分钟
const MEMORY_WARNING_THRESHOLD = 0.8; // 80%内存使用率
const PERFORMANCE_LOG_SAMPLE_RATE = Number(process.env.PERFORMANCE_LOG_SAMPLE_RATE || '1');
const ENABLE_PERFORMANCE_LOGS = process.env.ENABLE_PERFORMANCE_LOGS !== 'false';
// 上次记录内存的时间
let lastMemoryLogTime = Date.now();

/**
 * 格式化响应时间
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 获取内存使用情况
 */
function getMemoryUsage(): NodeJS.MemoryUsage {
  const memUsage = process.memoryUsage();
  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
  };
}

/**
 * 格式化字节数
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
}

/**
 * 记录内存使用情况
 */
function logMemoryUsage(): void {
  if (!ENABLE_PERFORMANCE_LOGS) {
    return;
  }
  const now = Date.now();
  if (now - lastMemoryLogTime < MEMORY_LOG_INTERVAL) {
    return;
  }

  lastMemoryLogTime = now;

  const memUsage = getMemoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  logger.info('内存使用情况', {
    rss: formatBytes(memUsage.rss),
    heapTotal: formatBytes(memUsage.heapTotal),
    heapUsed: formatBytes(memUsage.heapUsed),
    heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
    external: formatBytes(memUsage.external),
  });

  // 内存使用率告警
  if (heapUsedPercent > MEMORY_WARNING_THRESHOLD * 100) {
    logger.warn('内存使用率过高', {
      heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
      threshold: `${(MEMORY_WARNING_THRESHOLD * 100).toFixed(0)}%`,
    });
  }
}

/**
 * 扩展Request接口以添加开始时间
 */
declare global {
  namespace Express {
    interface Request {
      _startTime?: number;
    }
  }
}

/**
 * 性能监控中间件
 * 记录请求响应时间，检测慢请求
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!ENABLE_PERFORMANCE_LOGS) {
    next();
    return;
  }
  // 记录请求开始时间
  req._startTime = Date.now();

  // 定期记录内存使用情况
  logMemoryUsage();

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = req._startTime ? Date.now() - req._startTime : 0;
    const formattedDuration = formatDuration(duration);

    // 记录性能指标
    const performanceData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: formattedDuration,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    };

    const shouldSample = PERFORMANCE_LOG_SAMPLE_RATE >= 1
      ? true
      : Math.random() < Math.max(PERFORMANCE_LOG_SAMPLE_RATE, 0);

    // 慢请求告警
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logger.warn('慢请求检测', {
        ...performanceData,
        threshold: `${SLOW_REQUEST_THRESHOLD / 1000}s`,
      });
    } else if (shouldSample) {
      logger.http('请求完成', performanceData);
    }
  });

  next();
};

/**
 * 性能指标收集器
 * 用于收集和聚合性能指标
 */
class PerformanceMetrics {
  private requests: Map<string, number[]> = new Map();
  private slowRequests: Array<{
    path: string;
    method: string;
    duration: number;
    timestamp: Date;
  }> = [];

  /**
   * 记录请求耗时
   */
  recordRequest(path: string, duration: number): void {
    if (!this.requests.has(path)) {
      this.requests.set(path, []);
    }
    this.requests.get(path)!.push(duration);

    // 记录慢请求
    if (duration > SLOW_REQUEST_THRESHOLD) {
      this.slowRequests.push({
        path,
        method: '',
        duration,
        timestamp: new Date(),
      });
    }
  }

  /**
   * 获取路径的性能统计
   */
  getPathStats(path: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const durations = this.requests.get(path);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  /**
   * 获取所有路径的性能统计
   */
  getAllStats(): Map<string, ReturnType<typeof this.getPathStats>> {
    const stats = new Map();
    for (const path of this.requests.keys()) {
      const pathStats = this.getPathStats(path);
      if (pathStats) {
        stats.set(path, pathStats);
      }
    }
    return stats;
  }

  /**
   * 获取慢请求列表
   */
  getSlowRequests(limit: number = 100): typeof this.slowRequests {
    return this.slowRequests.slice(-limit);
  }

  /**
   * 清除统计数据
   */
  clear(): void {
    this.requests.clear();
    this.slowRequests = [];
  }
}

// 导出性能指标收集器实例
export const performanceMetrics = new PerformanceMetrics();

export default {
  performanceMonitor,
  performanceMetrics,
  PerformanceMetrics,
};
