import { Router } from 'express';
import favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateFavoriteSchema } from '../middleware/validate.middleware';

const router = Router();

/**
 * GET /api/favorites
 * 获取收藏列表（需要JWT认证）
 * 查询参数: filter - all（全部）/ high（高分推荐）/ new（最新添加）
 */
router.get(
  '/',
  authenticate,
  favoriteController.getFavorites
);

/**
 * GET /api/favorites/check
 * 检查名字是否已收藏（需要JWT认证）
 * 查询参数: nameId
 */
router.get(
  '/check',
  authenticate,
  favoriteController.checkFavorite
);

/**
 * POST /api/favorites
 * 添加收藏（需要JWT认证）
 */
router.post(
  '/',
  authenticate,
  validate(validateFavoriteSchema, 'body'),
  favoriteController.addFavorite
);

/**
 * DELETE /api/favorites/:id
 * 删除收藏（需要JWT认证）
 */
router.delete(
  '/:id',
  authenticate,
  favoriteController.removeFavorite
);

export default router;
