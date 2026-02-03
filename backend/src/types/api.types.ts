/**
 * API通用类型定义
 */

/**
 * API成功响应
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * API错误响应
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    waitSeconds?: number;
  };
}

/**
 * API响应类型
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 授权码验证请求
 */
export interface ValidateCodeRequest {
  code: string;
  deviceId: string;
}

/**
 * 授权码验证响应
 */
export interface ValidateCodeResponse {
  token: string;
  recovered: boolean;
  message: string;
}

/**
 * Token恢复请求
 */
export interface RecoverTokenRequest {
  code: string;
  deviceId: string;
}
