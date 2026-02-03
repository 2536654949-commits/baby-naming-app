/**
 * 数据脱敏工具
 * 用于日志输出和错误响应中的敏感数据脱敏
 */

/**
 * 授权码脱敏
 * 只显示前缀和后4位，中间用****代替
 * @example BABY-A3F7-92D1-4E8C -> BABY-A3F7-****-****
 * @param code - 授权码
 * @returns 脱敏后的授权码
 */
export function maskCode(code: string): string {
  if (!code || code.length < 16) {
    return '****';
  }

  // 格式: BABY-XXXX-XXXX-XXXX-XXXX
  // 保留: BABY-XXXX，中间用****代替，最后也用****
  const parts = code.split('-');
  if (parts.length === 4) {
    return `${parts[0]}-${parts[1]}-****`;
  } else if (parts.length === 5) {
    return `${parts[0]}-${parts[1]}-****`;
  }

  // 兜底：只显示前8位和后4位
  return `${code.substring(0, 8)}****`;
}

/**
 * IP地址脱敏
 * 保留前两段，后两段用xxx代替
 * @example 192.168.1.100 -> 192.168.xxx.xxx
 * @param ip - IP地址
 * @returns 脱敏后的IP地址
 */
export function maskIp(ip: string): string {
  if (!ip) {
    return 'xxx.xxx.xxx.xxx';
  }

  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }

  // IPv6或其他格式，返回脱敏标记
  return 'xxx.xxx.xxx.xxx';
}

/**
 * 设备指纹脱敏
 * 只显示前8位和后8位
 * @param deviceId - 设备指纹
 * @returns 脱敏后的设备指纹
 */
export function maskDeviceId(deviceId: string): string {
  if (!deviceId || deviceId.length < 16) {
    return '****';
  }

  return `${deviceId.substring(0, 8)}****${deviceId.substring(deviceId.length - 8)}`;
}

/**
 * JWT Token脱敏
 * 只显示前20位和后20位
 * @param token - JWT Token
 * @returns 脱敏后的Token
 */
export function maskToken(token: string): string {
  if (!token || token.length < 40) {
    return '****';
  }

  return `${token.substring(0, 20)}****${token.substring(token.length - 20)}`;
}
