import { codeRepository } from '../repositories';
import { AuthorizationCode } from '@prisma/client';
import { createError } from '../utils';
import logger from '../utils/logger';

export class CodeService {
  /**
   * 验证授权码格式
   * 格式：BABY-XXXX-XXXX-XXXX（12位）
   *
   * @param code - 授权码
   * @returns 是否有效
   */
  validateFormat(code: string): boolean {
    // 授权码格式：BABY-XXXX-XXXX-XXXX（12位字符，不含BABY-前缀后的实际长度）
    const regex = /^BABY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(code);
  }

  /**
   * 检查授权码是否过期
   * 规则：未激活授权码90天过期
   *
   * @param authCode - 授权码记录
   * @returns 是否过期
   */
  checkExpired(authCode: AuthorizationCode): boolean {
    // 如果是USED状态，永久有效
    if (authCode.status === 'USED') {
      return false;
    }

    // 如果有过期时间，检查是否过期
    if (authCode.expiresAt) {
      return new Date() > authCode.expiresAt;
    }

    return false;
  }

  /**
   * 激活授权码
   *
   * @param code - 授权码
   * @param deviceId - 设备指纹
   * @param activatedIp - 激活IP
   * @returns 激活后的授权码记录
   * @throws ApiError 如果授权码无效或已使用
   */
  async activateCode(
    code: string,
    deviceId: string,
    activatedIp: string
  ): Promise<AuthorizationCode> {
    // 验证格式
    if (!this.validateFormat(code)) {
      throw createError.codeFormatInvalid();
    }

    // 查询授权码
    const authCode = await codeRepository.findByCode(code);
    if (!authCode) {
      throw createError.codeNotFound();
    }

    // 检查状态
    if (authCode.status === 'USED') {
      throw createError.codeAlreadyUsed();
    }

    // 检查过期
    if (this.checkExpired(authCode)) {
      throw createError.codeExpired();
    }

    // 激活授权码
    const activated = await codeRepository.activateCode(code, deviceId, activatedIp);

    logger.info('授权码激活成功', { code, deviceId });
    return activated;
  }

  /**
   * 验证授权码并恢复Token
   *
   * @param code - 授权码
   * @param deviceId - 设备指纹
   * @returns 授权码记录
   * @throws ApiError 如果授权码无效或设备不匹配
   */
  async recoverToken(code: string, deviceId: string): Promise<AuthorizationCode> {
    // 验证格式
    if (!this.validateFormat(code)) {
      throw createError.codeFormatInvalid();
    }

    // 查询授权码
    const authCode = await codeRepository.findByCode(code);
    if (!authCode) {
      throw createError.codeNotFound();
    }

    // 检查状态
    if (authCode.status !== 'USED') {
      throw createError.codeNotFound();
    }

    // 检查设备匹配
    if (authCode.deviceId !== deviceId) {
      logger.warn('设备指纹不匹配', {
        code,
        expected: authCode.deviceId,
        actual: deviceId,
      });
      throw createError.deviceMismatch();
    }

    logger.info('Token恢复成功', { code, deviceId });
    return authCode;
  }
}

export default new CodeService();
