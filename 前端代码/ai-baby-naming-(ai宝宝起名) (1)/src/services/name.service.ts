import api, { ApiResponse } from './api';
import type {
  NameInputParams,
  NameResult,
  NameGenerateResponse,
  HistoryRecord,
  HistoryListResponse,
  RateLimitResponse
} from '../../types';

// 重新导出类型以便使用
export type {
  NameInputParams,
  NameResult,
  NameGenerateResponse,
  HistoryRecord,
  HistoryListResponse,
  RateLimitResponse
};

// 生成名字
export async function generateName(params: NameInputParams): Promise<ApiResponse<NameGenerateResponse>> {
  return await api.post('/name/generate', params);
}

// 获取历史记录
export async function getHistory(limit = 100, offset = 0): Promise<ApiResponse<HistoryListResponse>> {
  return await api.get('/name/history', {
    params: { limit, offset }
  });
}

// 获取历史记录详情
export async function getHistoryDetail(id: string): Promise<ApiResponse<{ record: HistoryRecord }>> {
  return await api.get(`/name/history/${id}`);
}

// 获取频率限制状态
export async function getRateLimitStatus(): Promise<ApiResponse<RateLimitResponse>> {
  return await api.get('/name/rate-limit');
}
