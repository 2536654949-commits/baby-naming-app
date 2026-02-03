/**
 * 起名服务
 * 起名功能的核心业务逻辑层
 */

import logger from '../utils/logger';
import { createError } from '../utils';
import zhipuService from './zhipu.service';
import rateLimitService from './rate-limit.service';
import codeRepository from '../repositories/code.repository';
import usageRepository from '../repositories/usage.repository';
import { NameInput, NameResult, BabyInfo, AIResult, HistoryRecord } from '../types';

class NameService {
  /**
   * 生成名字
   * @param userId 用户ID（从JWT解析）
   * @param deviceId 设备ID
   * @param input 起名输入参数
   * @returns 生成的名字列表和生成耗时
   */
  async generateName(userId: string, deviceId: string, input: NameInput): Promise<{ names: NameResult[]; generationTime: number }> {
    const startTime = Date.now();

    try {
      logger.info('开始起名流程', { userId, surname: input.surname, gender: input.gender });

      // 1. 验证授权码状态（确保用户已激活）
      const authCode = await codeRepository.findByUserId(userId);
      if (!authCode || authCode.status !== 'USED') {
        throw createError.invalidToken('用户未激活或授权状态异常');
      }

      // 2. 频率限制检查
      const rateLimitResult = await rateLimitService.checkLimit(userId);
      if (!rateLimitResult.allowed) {
        const error = createError.rateLimitExceeded(rateLimitResult.waitSeconds, '操作过于频繁，请稍后再试');
        throw error;
      }

      // 3. 构建AI请求参数
      const aiParams = {
        surname: input.surname,
        gender: input.gender,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        requirements: input.requirements,
      };

      // 4. 调用智谱AI生成名字
      const names = await zhipuService.generateNames(aiParams);

      // 5. 记录使用日志
      const generationTime = Date.now() - startTime;

      const babyInfo: BabyInfo = {
        surname: input.surname,
        gender: input.gender,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        requirements: input.requirements,
      };

      const aiResult: AIResult = {
        names,
      };

      await usageRepository.create({
        codeId: authCode.id,
        code: authCode.code,
        userId,
        deviceId,
        babyInfo,
        aiResult,
        generationTime,
      });

      logger.info('起名完成', {
        userId,
        nameCount: names.length,
        generationTime: `${generationTime}ms`,
      });

      return { names, generationTime };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      logger.error('起名失败', { error, userId, elapsedTime: `${elapsedTime}ms` });
      throw error;
    }
  }

  /**
   * 获取历史记录
   * @param userId 用户ID（从JWT解析）
   * @param limit 返回数量限制
   * @param offset 偏移量
   * @returns 历史记录列表
   */
  async getHistory(userId: string, limit: number = 100, offset: number = 0): Promise<{
    records: HistoryRecord[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      logger.info('获取历史记录', { userId, limit, offset });

      const { records, total } = await usageRepository.findByUserId({
        userId,
        limit,
        offset,
      });

      // 转换为前端需要的格式
      const historyRecords: HistoryRecord[] = records.map((record: any) => {
        const babyInfo = record.babyInfo as any;
        const aiResult = record.aiResult as any;

        // 格式化日期
        const date = new Date(record.createdAt).toISOString().split('T')[0];

        // 提取名字列表（保留完整的 NameResult 对象）
        const names = aiResult.names || [];

        return {
          id: record.id.toString(),
          userId: record.userId,
          date,
          surname: babyInfo.surname || '',
          gender: babyInfo.gender || 'unknown',
          birthDate: babyInfo.birthDate,
          birthTime: babyInfo.birthTime,
          requirements: babyInfo.requirements,
          names,
          createdAt: record.createdAt.toISOString(),
        };
      });

      const hasMore = offset + records.length < total;

      logger.info('历史记录获取成功', { userId, count: records.length, total, hasMore });

      return {
        records: historyRecords,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('获取历史记录失败', { error, userId });
      throw error;
    }
  }

  /**
   * 根据ID获取单条历史记录详情
   * @param userId 用户ID
   * @param recordId 记录ID
   * @returns 历史记录详情
   */
  async getHistoryDetail(userId: string, recordId: string): Promise<{ record: HistoryRecord }> {
    try {
      const recordIdNum = parseInt(recordId, 10);
      if (isNaN(recordIdNum)) {
        throw createError.badRequest('无效的记录ID');
      }
      const record = await usageRepository.findById(recordIdNum);

      if (!record) {
        throw createError.notFound('记录不存在');
      }

      // 验证记录是否属于该用户
      if (record.userId !== userId) {
        throw createError.forbidden('无权访问此记录');
      }

      logger.info('获取历史记录详情', { userId, recordId });

      // 转换为前端需要的格式
      const babyInfo = record.babyInfo as any;
      const aiResult = record.aiResult as any;
      const date = new Date(record.createdAt).toISOString().split('T')[0];

      const historyRecord: HistoryRecord = {
        id: record.id.toString(),
        userId: record.userId,
        date,
        surname: babyInfo.surname || '',
        gender: babyInfo.gender || 'unknown',
        birthDate: babyInfo.birthDate,
        birthTime: babyInfo.birthTime,
        requirements: babyInfo.requirements,
        names: aiResult.names || [],
        createdAt: record.createdAt.toISOString(),
      };

      return { record: historyRecord };
    } catch (error) {
      logger.error('获取历史记录详情失败', { error, userId, recordId });
      throw error;
    }
  }

  /**
   * 获取用户使用统计
   * @param userId 用户ID
   * @returns 使用统计数据
   */
  async getStats(userId: string): Promise<{
    totalUsage: number;
    recentUsage: number;
  }> {
    try {
      const [totalUsage, recentRecords] = await Promise.all([
        usageRepository.countByUserId(userId),
        usageRepository.findRecentByUserId(userId, 10),
      ]);

      // 最近7天的使用次数
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsage = recentRecords.filter(
        (r: any) => new Date(r.createdAt) > sevenDaysAgo
      ).length;

      logger.info('获取使用统计', { userId, totalUsage, recentUsage });

      return { totalUsage, recentUsage };
    } catch (error) {
      logger.error('获取使用统计失败', { error, userId });
      throw error;
    }
  }

  /**
   * 获取频率限制状态
   * @param userId 用户ID
   * @returns 频率限制信息
   */
  async getRateLimitStatus(userId: string): Promise<{
    waitSeconds: number;
    canGenerate: boolean;
  }> {
    try {
      const waitSeconds = await rateLimitService.getWaitSeconds(userId);
      const canGenerate = waitSeconds === 0;

      return { waitSeconds, canGenerate };
    } catch (error) {
      logger.error('获取频率限制状态失败', { error, userId });
      // 出错时允许生成
      return { waitSeconds: 0, canGenerate: true };
    }
  }
}

export default new NameService();
