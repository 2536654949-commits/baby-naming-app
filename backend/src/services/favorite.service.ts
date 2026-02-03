import favoriteRepository from '../repositories/favorite.repository';
import { NameResult, FavoriteFilter } from '../types';
import { createError } from '../utils';
import logger from '../utils/logger';

export class FavoriteService {
  private static readonly MAX_FAVORITES_PER_USER = 100;

  async addFavorite(userId: string, nameData: NameResult) {
    try {
      const existing = await favoriteRepository.findByUserIdAndNameId(userId, nameData.id);
      if (existing) {
        logger.warn('重复收藏', { userId, nameId: nameData.id });
        return existing;
      }

      const isAtLimit = await favoriteRepository.isAtLimit(userId);
      if (isAtLimit) {
        throw createError.forbidden(`收藏数量已达上限（${FavoriteService.MAX_FAVORITES_PER_USER}个），请先删除部分收藏`);
      }

      const favorite = await favoriteRepository.create({
        userId,
        nameId: nameData.id,
        nameData,
      });

      logger.info('收藏添加成功', { userId, favoriteId: favorite.id });

      return favorite;
    } catch (error: any) {
      logger.error('添加收藏失败', { error: error.message, userId });
      throw error;
    }
  }

  async removeFavorite(userId: string, favoriteId: string): Promise<void> {
    try {
      const favorite = await favoriteRepository.findById(BigInt(favoriteId));
      if (!favorite) {
        throw createError.notFound('收藏不存在');
      }

      if (favorite.userId !== userId) {
        throw createError.forbidden('无权删除此收藏');
      }

      await favoriteRepository.delete(BigInt(favoriteId));

      logger.info('收藏删除成功', { userId, favoriteId });
    } catch (error: any) {
      logger.error('删除收藏失败', { error: error.message, userId, favoriteId });
      throw error;
    }
  }

  async getFavorites(userId: string, filter: FavoriteFilter = 'all') {
    try {
      const { items, total } = await favoriteRepository.findByUserId({
        userId,
        filter,
        limit: 100,
        offset: 0,
      });

      logger.info('获取收藏列表成功', { userId, filter, count: items.length });

      return { favorites: items, total };
    } catch (error: any) {
      logger.error('获取收藏列表失败', { error: error.message, userId });
      throw error;
    }
  }

  async checkExists(userId: string, nameId: string): Promise<{ isFavorite: boolean; favoriteId?: string }> {
    try {
      const favorite = await favoriteRepository.findByUserIdAndNameId(userId, nameId);
      return { isFavorite: !!favorite, favoriteId: favorite?.id.toString() };
    } catch (error: any) {
      logger.error('检查收藏状态失败', { error: error.message, userId, nameId });
      return { isFavorite: false };
    }
  }
}

export default new FavoriteService();
