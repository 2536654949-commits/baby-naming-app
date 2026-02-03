/**
 * 设备指纹生成工具
 * 基于User-Agent和IP地址生成SHA256哈希
 */

import * as crypto from 'crypto';

/**
 * 生成设备指纹
 * 算法：SHA256(User-Agent + IP)，取前32位
 *
 * @param userAgent - 浏览器User-Agent
 * @param ip - 客户端IP地址
 * @returns 32位十六进制设备指纹
 */
export function generateDeviceFingerprint(
  userAgent: string,
  ip: string
): string {
  const data = `${userAgent}-${ip}`;
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 32);

  return hash;
}

/**
 * 从请求对象生成设备指纹
 *
 * @param req - Express Request对象
 * @returns 32位十六进制设备指纹
 */
export function generateFingerprintFromRequest(req: any): string {
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = getClientIp(req);
  return generateDeviceFingerprint(userAgent, ip);
}

/**
 * 获取客户端真实IP地址
 * 考虑代理和负载均衡器的情况
 *
 * @param req - Express Request对象
 * @returns 客户端IP地址
 */
export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}
