import { Response, NextFunction } from 'express';
import type { Request as AuthRequest } from '../types/express';
import favoriteService from '../services/favorite.service';
import { AddFavoriteRequest, FavoriteFilter } from '../types';
import { createError } from '../utils';

export class FavoriteController {
  async getFavorites(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError.invalidToken();
      }

      const filter = (req.query.filter as FavoriteFilter) || 'all';

      const validFilters: FavoriteFilter[] = ['all', 'high', 'new'];
      if (!validFilters.includes(filter)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILTER',
            message: '筛选参数无效，必须是 all、high 或 new',
          },
        });
        return;
      }

      const result = await favoriteService.getFavorites(userId, filter);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkFavorite(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError.invalidToken();
      }

      const nameId = req.query.nameId as string;
      if (!nameId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_NAME_ID',
            message: 'nameId不能为空',
          },
        });
        return;
      }

      const result = await favoriteService.checkExists(userId, nameId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async addFavorite(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError.invalidToken();
      }

      const { nameData }: AddFavoriteRequest = req.body;

      const favorite = await favoriteService.addFavorite(userId, nameData);

      res.json({
        success: true,
        data: {
          id: favorite.id.toString(),
          message: '收藏成功',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFavorite(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError.invalidToken();
      }

      const { id } = req.params;

      await favoriteService.removeFavorite(userId, id);

      res.json({
        success: true,
        data: {
          message: '取消收藏成功',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FavoriteController();
