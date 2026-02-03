/**
 * 自定义API错误类
 * 用于统一错误处理和响应格式
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误码定义
 */
export const ErrorCodes = {
  // 授权码相关错误 (400)
  CODE_FORMAT_INVALID: { code: 'CODE_FORMAT_INVALID', message: '授权码格式不正确，请检查', statusCode: 400 },
  CODE_NOT_FOUND: { code: 'CODE_NOT_FOUND', message: '授权码无效，请确认后重新输入', statusCode: 404 },
  CODE_ALREADY_USED: { code: 'CODE_ALREADY_USED', message: '该授权码已被使用，每个授权码仅限激活一次', statusCode: 400 },
  CODE_EXPIRED: { code: 'CODE_EXPIRED', message: '授权码已过期，请重新购买', statusCode: 400 },

  // 认证相关错误 (401/403)
  INVALID_TOKEN: { code: 'INVALID_TOKEN', message: 'Token无效或已过期', statusCode: 401 },
  DEVICE_MISMATCH: { code: 'DEVICE_MISMATCH', message: '该授权码已在其他设备激活，请联系客服', statusCode: 403 },

  // 频率限制错误 (429)
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', message: '操作过于频繁，请稍后再试', statusCode: 429 },

  // 通用错误 (404/403)
  NOT_FOUND: { code: 'NOT_FOUND', message: '资源不存在', statusCode: 404 },
  FORBIDDEN: { code: 'FORBIDDEN', message: '无权访问', statusCode: 403 },

  // 数据库错误 (500)
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: '数据库错误，请稍后重试', statusCode: 500 },
} as const;

/**
 * 创建错误的快捷方法
 */
export const createError = {
  codeFormatInvalid: () => new ApiError(ErrorCodes.CODE_FORMAT_INVALID.code, ErrorCodes.CODE_FORMAT_INVALID.message, ErrorCodes.CODE_FORMAT_INVALID.statusCode),
  codeNotFound: () => new ApiError(ErrorCodes.CODE_NOT_FOUND.code, ErrorCodes.CODE_NOT_FOUND.message, ErrorCodes.CODE_NOT_FOUND.statusCode),
  codeAlreadyUsed: () => new ApiError(ErrorCodes.CODE_ALREADY_USED.code, ErrorCodes.CODE_ALREADY_USED.message, ErrorCodes.CODE_ALREADY_USED.statusCode),
  codeExpired: () => new ApiError(ErrorCodes.CODE_EXPIRED.code, ErrorCodes.CODE_EXPIRED.message, ErrorCodes.CODE_EXPIRED.statusCode),
  invalidToken: (message?: string) => new ApiError(ErrorCodes.INVALID_TOKEN.code, message || ErrorCodes.INVALID_TOKEN.message, ErrorCodes.INVALID_TOKEN.statusCode),
  deviceMismatch: () => new ApiError(ErrorCodes.DEVICE_MISMATCH.code, ErrorCodes.DEVICE_MISMATCH.message, ErrorCodes.DEVICE_MISMATCH.statusCode),
  rateLimitExceeded: (waitSeconds: number, message?: string) => new RateLimitError(waitSeconds, message),
  databaseError: (message?: string) => new ApiError(ErrorCodes.DATABASE_ERROR.code, message || ErrorCodes.DATABASE_ERROR.message, ErrorCodes.DATABASE_ERROR.statusCode),
  notFound: (message?: string) => new ApiError(ErrorCodes.NOT_FOUND.code, message || ErrorCodes.NOT_FOUND.message, ErrorCodes.NOT_FOUND.statusCode),
  forbidden: (message?: string) => new ApiError(ErrorCodes.FORBIDDEN.code, message || ErrorCodes.FORBIDDEN.message, ErrorCodes.FORBIDDEN.statusCode),
  badRequest: (message?: string) => new ApiError('BAD_REQUEST', message || '请求参数错误', 400),
};

/**
 * 频率限制错误（包含等待时间）
 */
export class RateLimitError extends ApiError {
  constructor(public waitSeconds: number, message?: string) {
    super(ErrorCodes.RATE_LIMIT_EXCEEDED.code, message || ErrorCodes.RATE_LIMIT_EXCEEDED.message, ErrorCodes.RATE_LIMIT_EXCEEDED.statusCode);
    this.name = 'RateLimitError';
  }
}
