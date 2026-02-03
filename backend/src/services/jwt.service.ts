/**
 * JWT Service
 * 负责JWT Token的生成和验证
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';
import { JWTPayload } from '../types';
import { createError } from '../utils';
import logger from '../utils/logger';

export class JwtService {
  /**
   * 生成JWT Token
   *
   * @param userId - 用户ID（使用授权码作为唯一标识）
   * @param deviceId - 设备指纹
   * @param code - 授权码
   * @returns JWT Token
   */
  async generateToken(userId: string, deviceId: string, code: string): Promise<string> {
    try {
      const payload: JWTPayload = {
        userId,
        deviceId,
        code,
      };

      const token = jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
        algorithm: jwtConfig.algorithm,
      } as jwt.SignOptions);

      logger.info('Token生成成功', { userId, deviceId });
      return token;
    } catch (error) {
      logger.error('Token生成失败', { error, userId, deviceId });
      throw createError.invalidToken('Token生成失败');
    }
  }

  /**
   * 验证JWT Token
   *
   * @param token - JWT Token
   * @returns 解码后的Payload
   * @throws ApiError 如果Token无效或过期
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
      }) as JWTPayload;

      logger.info('Token验证成功', { userId: decoded.userId });
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Token已过期', { error: error.message });
        throw createError.invalidToken();
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Token无效', { error: error.message });
        throw createError.invalidToken();
      }
      logger.error('Token验证失败', { error });
      throw createError.invalidToken();
    }
  }

  /**
   * 解码JWT Token（不验证签名）
   * 用于快速获取Payload内容
   *
   * @param token - JWT Token
   * @returns 解码后的Payload，如果Token格式错误则返回null
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}

export default new JwtService();
