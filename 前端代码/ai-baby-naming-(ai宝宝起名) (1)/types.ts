// ========== API响应类型 ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  waitSeconds?: number; // 频率限制等待时间
}

// ========== 授权相关类型 ==========
export interface AuthValidateRequest {
  code: string;
  deviceId: string;
}

export interface AuthValidateResponse {
  token: string;
  recovered: boolean;
  message: string;
}

export interface AuthStatusResponse {
  activated: boolean;
  code: string; // 脱敏后
  deviceId: string;
  activatedAt: string;
}

// ========== 起名相关类型 ==========
export interface NameInputParams {
  surname: string;
  gender: 'male' | 'female' | 'unknown';
  birthDate?: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  requirements?: string;
}

export interface NameResult {
  id: string;
  name: string;
  full_name: string;
  pinyin: string;
  meaning: string;
  cultural_source: string;
  wuxing_analysis: string;
  score: number;
  highlight: string;
  three_scores?: {
    rhythm: number;
    culture: number;
    luck: number;
  };
  elements?: {
    [key: string]: string; // 字符到五行的映射
  };
}

export interface NameGenerateResponse {
  names: NameResult[];
  generationTime: number;
}

// ========== 历史记录类型 ==========
export interface HistoryRecord {
  id: string;
  userId: string;
  date: string;
  surname: string;
  gender: string;
  birthDate?: string;
  birthTime?: string;
  requirements?: string;
  names: NameResult[];
  createdAt: string;
}

export interface HistoryListResponse {
  records: HistoryRecord[];
  total: number;
  hasMore: boolean;
}

// ========== 收藏相关类型 ==========
export interface Favorite {
  id: string;
  userId: string;
  nameId: string;
  nameData: NameResult;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
  counts?: {
    all: number;
    high: number;
    new: number;
  };
}

// ========== 频率限制类型 ==========
export interface RateLimitResponse {
  allowed: boolean;
  waitSeconds: number;
  lastRequestTime?: string;
}
