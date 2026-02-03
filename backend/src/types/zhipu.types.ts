/**
 * 智谱AI相关类型定义
 */

/**
 * 智谱AI请求消息
 */
export interface ZhipuMessage {
  /** 角色 */
  role: 'system' | 'user' | 'assistant';
  /** 内容 */
  content: string;
}

/**
 * 智谱AI请求参数
 */
export interface ZhipuRequest {
  /** 模型名称 */
  model: string;
  /** 消息列表 */
  messages: ZhipuMessage[];
  /** 温度 (0-1) */
  temperature?: number;
  /** top_p采样 */
  top_p?: number;
  /** 最大token数 */
  max_tokens?: number;
}

/**
 * 智谱AI响应数据
 */
export interface ZhipuChoice {
  /** 索引 */
  index: number;
  /** 消息 */
  message: {
    /** 角色 */
    role: string;
    /** 内容 */
    content: string;
  };
  /** 完成原因 */
  finish_reason: string;
}

/**
 * 智谱AI使用信息
 */
export interface ZhipuUsage {
  /** 提示token数 */
  prompt_tokens: number;
  /** 完成token数 */
  completion_tokens: number;
  /** 总token数 */
  total_tokens: number;
}

/**
 * 智谱AI响应
 */
export interface ZhipuResponse {
  /** ID */
  id: string;
  /** 对象类型 */
  object: string;
  /** 创建时间 */
  created: number;
  /** 模型 */
  model: string;
  /** 选择列表 */
  choices: ZhipuChoice[];
  /** 使用信息 */
  usage: ZhipuUsage;
}

/**
 * 智谱AI错误响应
 */
export interface ZhipuErrorResponse {
  /** 错误信息 */
  error: {
    /** 错误代码 */
    code: string;
    /** 错误消息 */
    message: string;
    /** 错误类型 */
    type: string;
  };
}

/**
 * 起名生成参数
 */
export interface NameGenerationParams {
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
