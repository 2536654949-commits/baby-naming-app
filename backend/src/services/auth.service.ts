/**
 * Auth Service
 * 认证服务层，编排授权码验证和JWT生成
 */

import jwtService from './jwt.service';
import codeService from './code.service';
import { codeRepository } from '../repositories';
import { ValidateResult, RecoverResult, AuthStatusResponse } from '../types';
import { maskCode } from '../utils';
import logger from '../utils/logger';

export class AuthService {
  /**
   * 验证授权码并生成Token
   *
   * @param code - 授权码
   * @param deviceId - 设备指纹
   * @param activatedIp - 激活IP
   * @returns 验证结果
   */
  async validateCode(
    code: string,
    deviceId: string,
    activatedIp: string
  ): Promise<ValidateResult> {
    try {
      // 激活授权码
      await codeService.activateCode(code, deviceId, activatedIp);

      // 生成JWT Token
      const token = await jwtService.generateToken(code, deviceId, code);

      logger.info('授权码验证成功', { code: maskCode(code), deviceId });

      return {
        success: true,
        token,
        recovered: false,
        message: '激活成功',
      };
    } catch (error: any) {
      logger.warn('授权码验证失败', { error: error.message, code: maskCode(code) });

      // 重新抛出ApiError
      throw error;
    }
  }

  /**
   * 恢复Token
   *
   * @param code - 授权码
   * @param deviceId - 设备指纹
   * @returns 恢复结果
   */
  async recoverToken(code: string, deviceId: string): Promise<RecoverResult> {
    try {
      // 验证授权码和设备指纹
      await codeService.recoverToken(code, deviceId);

      // 生成新的JWT Token
      const token = await jwtService.generateToken(code, deviceId, code);

      logger.info('Token恢复成功', { code: maskCode(code), deviceId });

      return {
        success: true,
        token,
        recovered: true,
        message: 'Token恢复成功',
      };
    } catch (error: any) {
      logger.warn('Token恢复失败', { error: error.message, code: maskCode(code) });

      // 重新抛出ApiError
      throw error;
    }
  }

  /**
   * 获取授权状态
   *
   * @param userId - 用户ID（授权码）
   * @returns 授权状态
   */
  async getStatus(userId: string): Promise<AuthStatusResponse> {
    try {
      const authCode = await codeRepository.findByCode(userId);

      if (!authCode || authCode.status !== 'USED') {
        return {
          activated: false,
        };
      }

      return {
        activated: true,
        code: maskCode(authCode.code),
        deviceId: authCode.deviceId || undefined,
        activatedAt: authCode.activatedAt?.toISOString(),
      };
    } catch (error: any) {
      logger.error('获取授权状态失败', { error, userId });
      throw error;
    }
  }

  /**
   * 验证Token
   *
   * @param token - JWT Token
   * @returns 解码后的Payload
   */
  async verifyToken(token: string) {
    return jwtService.verifyToken(token);
  }
}

export default new AuthService();
