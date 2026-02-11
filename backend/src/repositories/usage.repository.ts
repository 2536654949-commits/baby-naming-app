/**
 * 使用记录仓储层
 * 处理使用记录的数据访问
 */

import { prisma } from '../config';
import { BabyInfo, AIResult } from '../types';

export interface UsageRecordCreateInput {
  codeId: number | bigint;
  code: string;
  userId: string;
  deviceId: string;
  babyInfo: BabyInfo;
  aiResult: AIResult;
  generationTime?: number;
}

export interface UsageRecordQueryOptions {
  userId: string;
  limit?: number;
  offset?: number;
}

class UsageRepository {
  /**
   * 创建使用记录
   */
  async create(data: UsageRecordCreateInput) {
    return prisma.usageRecord.create({
      data: {
        codeId: data.codeId as any, // BigInt to Int64
        code: data.code,
        userId: data.userId,
        deviceId: data.deviceId,
        babyInfo: data.babyInfo as any,
        aiResult: data.aiResult as any,
        generationTime: data.generationTime,
      },
    });
  }

  /**
   * 根据用户ID查询历史记录
   * 优化：只选择列表需要的字段，减少数据传输
   */
  async findByUserId(options: UsageRecordQueryOptions) {
    const { userId, limit = 100, offset = 0 } = options;

    const [records, total] = await Promise.all([
      prisma.usageRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        // 只选择列表展示需要的字段，排除大的JSON字段aiResult
        select: {
          id: true,
          userId: true,
          babyInfo: true,
          createdAt: true,
          // 不选择 aiResult，减少数据传输
        },
      }),
      prisma.usageRecord.count({
        where: { userId },
      }),
    ]);

    return { records, total };
  }

  /**
   * 根据ID查询单条记录
   */
  async findById(id: number) {
    return prisma.usageRecord.findUnique({
      where: { id: id as any },
    });
  }

  /**
   * 统计用户使用次数
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.usageRecord.count({
      where: { userId },
    });
  }

  /**
   * 查询用户最近的起名记录
   */
  async findRecentByUserId(userId: string, limit: number = 10) {
    return prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default new UsageRepository();
