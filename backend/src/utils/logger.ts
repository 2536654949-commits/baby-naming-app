/**
 * Winston日志配置
 * 提供分级日志记录和文件轮转功能
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

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

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// BigInt 序列化辅助函数
const stringifyWithBigInt = (obj: any): string => {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
    2
  );
};

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, stack, ...meta } = info;
      const metaStr = Object.keys(meta).length > 0 ? '\n' + stringifyWithBigInt(meta) : '';
      return `${timestamp} ${level}: ${message}${metaStr}${stack ? '\n' + stack : ''}`;
    }
  )
);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const logDir = path.join(process.cwd(), 'logs');

// 传输器配置
const transports: winston.transport[] = [];

if (!isServerless) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 错误日志文件
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // 全部日志文件
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// 开发环境添加控制台输出
if (!isServerless && process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

if (isServerless) {
  transports.push(new winston.transports.Console({ format: consoleFormat }));
}

// 创建Logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * HTTP请求日志中间件
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: isServerless
    ? [new winston.transports.Console({ format: consoleFormat })]
    : [
      new winston.transports.File({
        filename: path.join(logDir, 'http.log'),
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ],
});

export default logger;
