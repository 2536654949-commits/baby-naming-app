import api, { ApiResponse } from './api';
import type { NameResult, FavoriteListResponse } from '../../types';

export type { NameResult, FavoriteListResponse };

export async function addFavorite(nameData: NameResult): Promise<ApiResponse<{ id: string }>> {
  return await api.post('/favorites', { nameData });
}

export async function getFavorites(filter: 'all' | 'high' | 'new' = 'all'): Promise<ApiResponse<FavoriteListResponse>> {
  return await api.get('/favorites', {
    params: { filter }
  });
}

export async function removeFavorite(favoriteId: string): Promise<ApiResponse<void>> {
  return await api.delete(`/favorites/${favoriteId}`);
}

export async function checkIsFavorite(nameId: string): Promise<{ isFavorite: boolean; favoriteId?: string }> {
  try {
    const response = await api.get('/favorites/check', {
      params: { nameId }
    });
    if (response.success && response.data) {
      return response.data as { isFavorite: boolean; favoriteId?: string };
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
  return { isFavorite: false };
}
