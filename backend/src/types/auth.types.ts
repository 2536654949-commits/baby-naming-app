/**
 * 认证相关类型定义
 */

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  deviceId: string;
  code: string;
  iat?: number;
  exp?: number;
}

/**
 * 授权码状态
 */
export type CodeStatus = 'UNUSED' | 'USED' | 'EXPIRED';

/**
 * 授权码验证结果
 */
export interface ValidateResult {
  success: boolean;
  token?: string;
  recovered: boolean;
  message: string;
}

/**
 * Token恢复结果
 */
export interface RecoverResult {
  success: boolean;
  token?: string;
  recovered: boolean;
  message: string;
}

/**
 * 授权状态响应
 */
export interface AuthStatusResponse {
  activated: boolean;
  code?: string;
  deviceId?: string;
  activatedAt?: string;
}
