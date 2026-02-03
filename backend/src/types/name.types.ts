/**
 * 起名相关类型定义
 */

/**
 * 起名输入参数
 */
export interface NameInput {
  /** 姓氏 */
  surname: string;
  /** 性别 */
  gender: 'male' | 'female' | 'unknown';
  /** 出生日期 (可选) */
  birthDate?: string;
  /** 出生时间 (可选) */
  birthTime?: string;
  /** 特殊要求 (可选) */
  requirements?: string;
}

/**
 * AI生成的名字结果
 */
export interface NameResult {
  /** 名字ID */
  id: string;
  /** 名字（不含姓氏） */
  name: string;
  /** 完整姓名 */
  full_name: string;
  /** 拼音标注 */
  pinyin: string;
  /** 详细寓意解释 */
  meaning: string;
  /** 诗词典故出处 */
  cultural_source: string;
  /** 五行分析 */
  wuxing_analysis: string;
  /** 评分 */
  score: number;
  /** 最突出的亮点 */
  highlight: string;
}

/**
 * 起名响应
 */
export interface NameResponse {
  /** 生成的名字列表 */
  names: NameResult[];
  /** 生成耗时(ms) */
  generationTime: number;
}

/**
 * 历史记录
 */
export interface HistoryRecord {
  /** 记录ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 日期 */
  date: string;
  /** 姓氏 */
  surname: string;
  /** 性别 */
  gender: string;
  /** 出生日期 */
  birthDate?: string;
  /** 出生时间 */
  birthTime?: string;
  /** 特殊要求 */
  requirements?: string;
  /** 生成的名字列表（完整对象） */
  names: NameResult[];
  /** 创建时间 */
  createdAt: string;
}

/**
 * 历史记录响应
 */
export interface HistoryResponse {
  /** 历史记录列表 */
  records: HistoryRecord[];
  /** 总数 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
}

/**
 * 宝宝信息 (存储到数据库)
 */
export interface BabyInfo {
  /** 姓氏 */
  surname: string;
  /** 性别 */
  gender: string;
  /** 出生日期 */
  birthDate?: string;
  /** 出生时间 */
  birthTime?: string;
  /** 特殊要求 */
  requirements?: string;
}

/**
 * AI结果 (存储到数据库)
 */
export interface AIResult {
  /** 生成的名字列表 */
  names: NameResult[];
}

/**
 * 频率限制结果
 */
export interface RateLimitResult {
  /** 是否允许请求 */
  allowed: boolean;
  /** 需要等待的秒数 */
  waitSeconds: number;
}
