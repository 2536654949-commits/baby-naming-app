/**
 * 收藏仓储层
 * 处理收藏的数据访问
 */

import { prisma } from '../config';
import { FavoriteItem, FavoriteFilter, NameResult } from '../types';

/**
 * 创建收藏的输入参数
 */
export interface FavoriteCreateInput {
  userId: string;
  nameId: string;
  nameData: any;
}

/**
 * 查询收藏的选项
 */
export interface FavoriteQueryOptions {
  userId: string;
  filter?: FavoriteFilter;
  limit?: number;
  offset?: number;
}

class FavoriteRepository {
  /**
   * 单个用户最大收藏数量
   */
  private static readonly MAX_FAVORITES_PER_USER = 100;

  /**
   * 评分阈值（高分收藏）
   */
  private static readonly HIGH_SCORE_THRESHOLD = 96;

  /**
   * 创建收藏记录
   */
  async create(data: FavoriteCreateInput) {
    return prisma.favorite.create({
      data: {
        userId: data.userId,
        nameId: data.nameId,
        nameData: data.nameData,
      },
    });
  }

  /**
   * 根据用户ID查询收藏列表
   * 支持筛选功能
   */
  async findByUserId(options: FavoriteQueryOptions): Promise<{ items: FavoriteItem[]; total: number }> {
    const { userId, filter = 'all', limit = 100, offset = 0 } = options;

    // 构建查询条件 - 在数据库层面进行筛选
    const where: any = { userId };

    // 高分筛选：使用Prisma的JSON过滤功能在数据库层面筛选
    if (filter === 'high') {
      where.nameData = {
        path: ['score'],
        gte: FavoriteRepository.HIGH_SCORE_THRESHOLD
      };
    }

    // 并行执行查询和计数，提高效率
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.favorite.count({ where })
    ]);

    // 转换类型，并将 BigInt 转为字符串
    const typedItems: FavoriteItem[] = items.map(item => ({
      ...item,
      id: item.id.toString() as any, // 将 BigInt 转为字符串
      nameData: item.nameData as unknown as NameResult,
    }));

    return { items: typedItems, total };
  }

  /**
   * 根据ID查询单个收藏
   */
  async findById(id: bigint): Promise<FavoriteItem | null> {
    const item = await prisma.favorite.findUnique({
      where: { id },
    });
    if (!item) return null;
    return {
      ...item,
      id: item.id.toString() as any, // 将 BigInt 转为字符串
      nameData: item.nameData as unknown as NameResult,
    };
  }

  /**
   * 根据用户ID和名字ID查询收藏（用于检查是否已收藏）
   */
  async findByUserIdAndNameId(userId: string, nameId: string): Promise<FavoriteItem | null> {
    const item = await prisma.favorite.findFirst({
      where: { userId, nameId },
    });
    if (!item) return null;
    return {
      ...item,
      id: item.id.toString() as any, // 将 BigInt 转为字符串
      nameData: item.nameData as unknown as NameResult,
    };
  }

  /**
   * 删除收藏
   */
  async delete(id: bigint): Promise<void> {
    await prisma.favorite.delete({
      where: { id },
    });
  }

  /**
   * 统计用户收藏数量
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.favorite.count({
      where: { userId },
    });
  }

  /**
   * 检查用户是否已达到收藏上限
   */
  async isAtLimit(userId: string): Promise<boolean> {
    const count = await this.countByUserId(userId);
    return count >= FavoriteRepository.MAX_FAVORITES_PER_USER;
  }
}

export default new FavoriteRepository();
