import { NameResult } from './name.types';

export type FavoriteFilter = 'all' | 'high' | 'new';

export interface FavoriteItem {
  id: bigint;
  userId: string;
  nameId: string;
  nameData: NameResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteListResponse {
  favorites: FavoriteItem[];
  total: number;
  counts?: {
    all: number;
    high: number;
    new: number;
  };
}

export interface AddFavoriteRequest {
  nameData: NameResult;
}
