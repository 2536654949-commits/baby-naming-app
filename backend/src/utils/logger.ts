/**
 * Winston日志配置
 * 提供分级日志记录、按日期轮转和自动清理功能
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// 环境配置
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const isDev = process.env.NODE_ENV !== 'production';
const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// 日志轮转配置
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '7d';      // 保留天数
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '10m';       // 单文件大小
const LOG_DATE_PATTERN = 'YYYY-MM-DD';                        // 按日期轮转
const LOG_ZIPPED_ARCHIVE = process.env.LOG_ZIPPED_ARCHIVE !== 'false';

// 日志级别定义
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// 级别 emoji 映射（用于开发环境）
const levelEmoji: Record<string, string> = {
  error: '[x]',
  warn: '[!]',
  info: '[v]',
  http: '[>]',
  debug: '[?]',
};

// BigInt 序列化辅助函数
const stringifyWithBigInt = (obj: any): string => {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
    2
  );
};

// JSON 格式（用于文件）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 开发环境增强控制台格式
const devConsoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    // 提取原始级别名称（去除颜色代码）
    const rawLevel = level.replace(/\x1b\[[0-9;]*m/g, '');
    const emoji = levelEmoji[rawLevel] || '';

    // 格式化 meta 信息
    const metaStr = Object.keys(meta).length > 0
      ? '\n' + stringifyWithBigInt(meta)
      : '';

    return `${emoji} ${timestamp} [${level}] ${message}${metaStr}${stack ? '\n' + stack : ''}`;
  })
);

// 创建传输器
function createTransports(): winston.transport[] {
  const transports: winston.transport[] = [];

  if (isServerless) {
    // Serverless 环境只用控制台
    transports.push(new winston.transports.Console({ format: devConsoleFormat }));
    return transports;
  }

  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 通用日志（使用 DailyRotateFile）
  transports.push(new DailyRotateFile({
    dirname: logDir,
    filename: 'combined-%DATE%.log',
    datePattern: LOG_DATE_PATTERN,
    maxFiles: LOG_MAX_FILES,
    maxSize: LOG_MAX_SIZE,
    zippedArchive: LOG_ZIPPED_ARCHIVE,
    format: fileFormat,
  }));

  // 错误日志（单独文件）
  transports.push(new DailyRotateFile({
    dirname: logDir,
    filename: 'error-%DATE%.log',
    datePattern: LOG_DATE_PATTERN,
    maxFiles: LOG_MAX_FILES,
    maxSize: LOG_MAX_SIZE,
    zippedArchive: LOG_ZIPPED_ARCHIVE,
    level: 'error',
    format: fileFormat,
  }));

  // 开发环境添加控制台输出
  if (isDev) {
    transports.push(new winston.transports.Console({ format: devConsoleFormat }));
  }

  return transports;
}

// 创建 Logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  levels,
  transports: createTransports(),
  exitOnError: false,
});

/**
 * HTTP 请求日志（单独文件）
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: fileFormat,
  transports: isServerless
    ? [new winston.transports.Console({ format: devConsoleFormat })]
    : [
        new DailyRotateFile({
          dirname: logDir,
          filename: 'http-%DATE%.log',
          datePattern: LOG_DATE_PATTERN,
          maxFiles: LOG_MAX_FILES,
          maxSize: LOG_MAX_SIZE,
          zippedArchive: LOG_ZIPPED_ARCHIVE,
        }),
      ],
});

// 导出日志目录路径供其他模块使用
export const LOG_DIR = logDir;

export default logger;
