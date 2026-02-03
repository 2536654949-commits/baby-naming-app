/**
 * Code Repository
 * 授权码数据访问层
 */

import { prisma } from '../config';
import { AuthorizationCode } from '@prisma/client';
import { CodeStatus } from '../types';
import logger from '../utils/logger';

export type AuthorizationCodeWithRelations = AuthorizationCode;

export class CodeRepository {
  /**
   * 根据授权码查找
   *
   * @param code - 授权码
   * @returns 授权码记录，如果不存在则返回null
   */
  async findByCode(code: string): Promise<AuthorizationCode | null> {
    try {
      const record = await prisma.authorizationCode.findUnique({
        where: { code },
      });
      return record;
    } catch (error) {
      logger.error('查询授权码失败', { error, code });
      throw error;
    }
  }

  /**
   * 根据用户ID查找授权码（用户ID即授权码）
   *
   * @param userId - 用户ID（授权码）
   * @returns 授权码记录，如果不存在则返回null
   */
  async findByUserId(userId: string): Promise<AuthorizationCode | null> {
    try {
      const record = await prisma.authorizationCode.findUnique({
        where: { code: userId },
      });
      return record;
    } catch (error) {
      logger.error('根据用户ID查询授权码失败', { error, userId });
      throw error;
    }
  }

  /**
   * 根据设备ID查找已激活的授权码
   *
   * @param deviceId - 设备指纹
   * @returns 授权码记录数组
   */
  async findByDeviceId(deviceId: string): Promise<AuthorizationCode[]> {
    try {
      const records = await prisma.authorizationCode.findMany({
        where: {
          deviceId,
          status: 'USED',
        },
        orderBy: {
          activatedAt: 'desc',
        },
      });
      return records;
    } catch (error) {
      logger.error('根据设备ID查询授权码失败', { error, deviceId });
      throw error;
    }
  }

  /**
   * 激活授权码
   *
   * @param code - 授权码
   * @param deviceId - 设备指纹
   * @param activatedIp - 激活IP
   * @returns 更新后的授权码记录
   */
  async activateCode(
    code: string,
    deviceId: string,
    activatedIp: string
  ): Promise<AuthorizationCode> {
    try {
      const now = new Date();
      const updated = await prisma.authorizationCode.update({
        where: { code },
        data: {
          status: 'USED',
          deviceId,
          activatedAt: now,
          activatedIp,
        },
      });

      logger.info('授权码激活成功', { code, deviceId, activatedIp });
      return updated;
    } catch (error) {
      logger.error('激活授权码失败', { error, code, deviceId });
      throw error;
    }
  }

  /**
   * 创建授权码
   *
   * @param data - 授权码数据
   * @returns 创建的授权码记录
   */
  async create(data: {
    code: string;
    expiresAt?: Date;
    batchId?: string;
    metadata?: string;
  }): Promise<AuthorizationCode> {
    try {
      const created = await prisma.authorizationCode.create({
        data: {
          code: data.code,
          expiresAt: data.expiresAt,
          batchId: data.batchId,
          metadata: data.metadata,
        },
      });

      logger.info('授权码创建成功', { code: data.code });
      return created;
    } catch (error) {
      logger.error('创建授权码失败', { error, code: data.code });
      throw error;
    }
  }

  /**
   * 根据状态查找授权码
   *
   * @param status - 授权码状态
   * @param skip - 跳过记录数
   * @param take - 获取记录数
   * @returns 授权码记录数组
   */
  async findByStatus(
    status: CodeStatus,
    skip: number = 0,
    take: number = 100
  ): Promise<AuthorizationCode[]> {
    try {
      const records = await prisma.authorizationCode.findMany({
        where: { status },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
      return records;
    } catch (error) {
      logger.error('根据状态查询授权码失败', { error, status });
      throw error;
    }
  }

  /**
   * 更新授权码状态
   *
   * @param code - 授权码
   * @param status - 新状态
   * @returns 更新后的授权码记录
   */
  async updateStatus(code: string, status: CodeStatus): Promise<AuthorizationCode> {
    try {
      const updated = await prisma.authorizationCode.update({
        where: { code },
        data: { status },
      });

      logger.info('授权码状态更新成功', { code, status });
      return updated;
    } catch (error) {
      logger.error('更新授权码状态失败', { error, code, status });
      throw error;
    }
  }

  /**
   * 批量创建授权码
   *
   * @param codes - 授权码数组
   * @returns 创建的授权码记录数组
   */
  async createMany(codes: Array<{
    code: string;
    expiresAt?: Date;
    batchId?: string;
  }>): Promise<{ count: number }> {
    try {
      const result = await prisma.authorizationCode.createMany({
        data: codes,
        skipDuplicates: true,
      });

      logger.info('批量创建授权码成功', { count: result.count });
      return result;
    } catch (error) {
      logger.error('批量创建授权码失败', { error });
      throw error;
    }
  }
}

export default new CodeRepository();
