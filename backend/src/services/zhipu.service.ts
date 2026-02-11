import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { NameGenerationParams, NameResult } from '../types';
import { ZhipuRequest, ZhipuResponse } from '../types';
import { ApiError } from '../utils/error';
import fs from 'fs';
import path from 'path';

class ZhipuService {
  private readonly apiKey?: string;
  private readonly hasApiKey: boolean;
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly healthTimeout: number;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly topP?: number;
  private readonly promptTemplate: string;

  constructor() {
    this.apiKey = (process.env.AI_API_KEY || '').replace(/^"|"$/g, '');
    this.apiUrl = (process.env.AI_API_URL || 'https://api.deepseek.com/v1/chat/completions').replace(/^"|"$/g, '');
    this.model = (process.env.AI_MODEL || 'deepseek-chat').replace(/^"|"$/g, '');
    this.hasApiKey = Boolean(this.apiKey);

    const isDeepSeek = this.apiUrl.includes('deepseek') || this.model.includes('deepseek');
    const timeoutEnv = process.env.AI_API_TIMEOUT ? Number(process.env.AI_API_TIMEOUT) : undefined;
    const maxTokensEnv = process.env.AI_MAX_TOKENS ? Number(process.env.AI_MAX_TOKENS) : undefined;
    const temperatureEnv = process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : undefined;
    const topPEnv = process.env.AI_TOP_P ? Number(process.env.AI_TOP_P) : undefined;

    this.timeout = (timeoutEnv !== undefined && Number.isFinite(timeoutEnv) && timeoutEnv > 0)
      ? timeoutEnv
      : (isDeepSeek ? 60000 : 30000);
    this.healthTimeout = Math.min(this.timeout, 10000);
    this.temperature = (temperatureEnv !== undefined && Number.isFinite(temperatureEnv)) ? temperatureEnv : 1.0;
    this.maxTokens = (maxTokensEnv !== undefined && Number.isFinite(maxTokensEnv)) ? maxTokensEnv : (isDeepSeek ? 3000 : 4000);
    this.topP = (topPEnv !== undefined && Number.isFinite(topPEnv)) ? topPEnv : (isDeepSeek ? undefined : 0.9);

    // 加载Prompt模板
    this.promptTemplate = this.loadPromptTemplate();

    // 调试日志
    logger.info('AI服务配置', {
      apiUrl: this.apiUrl,
      model: this.model,
      hasApiKey: this.hasApiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'N/A',
      timeout: this.timeout,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      topP: this.topP ?? 'unset',
    });
  }

  /**
   * 加载Prompt模板文件
   */
  private loadPromptTemplate(): string {
    try {
      const promptPath = path.join(__dirname, '../prompts/name-generation.prompt.md');
      const template = fs.readFileSync(promptPath, 'utf-8');
      logger.info('Prompt模板加载成功', { path: promptPath });
      return template;
    } catch (error) {
      logger.error('Prompt模板加载失败，使用默认模板', { error });
      // 返回默认模板作为fallback
      return this.getDefaultPromptTemplate();
    }
  }

  /**
   * 默认Prompt模板（fallback）
   */
  private getDefaultPromptTemplate(): string {
    return `角色设定：你是一位拥有20年经验的起名大师，精通周易五行、古诗词、现代美学、心理学（包括MBTI性格理论）。
任务：根据用户提供的宝宝信息，生成{nameCount}个精选名字。要求：名字风格多样化，字数包含2个字和3个字的名字。
输入信息：- 姓氏：{surname}
- 性别：{gender}
- 出生日期：{birthDate}
- 出生时间：{birthTime}
- 特殊要求：{requirements}

起名标准：1. 寓意美好：名字要有积极的寓意和内涵
2. 音律和谐：声调搭配，朗朗上口，无不良谐音
3. 字形美观：结构匀称，书写流畅
4. 文化底蕴：优先从诗词典故中取材
5. 时代感：既要有传统底蕴，又要符合现代审美
6. 避免生僻：使用GB2312常用字，方便生活
7. 字数多样：{nameCount}个名字中，建议包含2-3个两字名和2-3个三字名
8. 风格多样：包含古典诗词风、现代简约风、国学经典风、文艺清新风、寓意吉祥风等不同风格

输出要求：严格按以下JSON格式输出，不要任何额外文字：

{
  "names": [
    {
      "id": "唯一标识符(uuid格式)",
      "name": "名字（不含姓氏，可以是1-2个字）",
      "full_name": "完整姓名",
      "pinyin": "拼音标注",
      "meaning": "详细寓意解释(100字以内)",
      "cultural_source": "诗词典故出处(如有，没有则写'无')",
      "wuxing_analysis": "五行分析(如提供出生时间)",
      "score": 95,
      "highlight": "最突出的亮点(一句话)",
      "mbti_tendency": "根据名字的寓意和气质，分析可能对应的MBTI性格倾向(如：INFJ-内敛而富有洞察力，适合从事...)，约50字"
    }
  ]
}

注意事项：- 不要输出JSON以外的任何内容
- 确保{nameCount}个名字风格各异，字数混合（2字名和3字名都要有），给用户更多选择
- 评分要客观，90分以上为优质
- 如果用户提供了特殊要求，必须优先满足
- MBTI倾向参考需结合名字的寓意进行合理推测，体现名字赋予的性格气质`;
  }

  /**
   * 生成起名Prompt
   */
  private buildPrompt(params: NameGenerationParams, nameCount: number = 5): string {
    const { surname, gender, birthDate, birthTime, requirements } = params;

    // 性别映射
    const genderMap: Record<string, string> = {
      male: '男孩',
      female: '女孩',
      unknown: '未知',
    };

    // 使用模板替换变量
    let prompt = this.promptTemplate
      .replace(/{surname}/g, surname)
      .replace(/{gender}/g, genderMap[gender] || gender)
      .replace(/{nameCount}/g, nameCount.toString());

    // 处理可选字段
    if (birthDate) {
      prompt = prompt.replace(/{birthDate}/g, birthDate);
    } else {
      prompt = prompt.replace(/- 出生日期：{birthDate}\n?/g, '');
    }

    if (birthTime) {
      prompt = prompt.replace(/{birthTime}/g, birthTime);
    } else {
      prompt = prompt.replace(/- 出生时间：{birthTime}\n?/g, '');
    }

    if (requirements) {
      prompt = prompt.replace(/{requirements}/g, requirements);
    } else {
      prompt = prompt.replace(/- 特殊要求：{requirements}\n?/g, '');
    }

    return prompt;
  }

  /**
   * 调用智谱AI API生成名字（并行双请求模式）
   */
  async generateNames(params: NameGenerationParams): Promise<NameResult[]> {
    const startTime = Date.now();

    if (!this.hasApiKey) {
      logger.error('AI服务未配置AI_API_KEY，无法生成名字');
      throw new ApiError('AI_SERVICE_UNAVAILABLE', 'AI服务暂不可用，请稍后再试', 503);
    }

    try {
      logger.info('开始并行生成名字', { surname: params.surname, gender: params.gender });

      // 并行发起2个请求，每个生成3个名字
      const batchSize = 3;
      const promises = [
        this.generateBatch(params, batchSize, 1),
        this.generateBatch(params, batchSize, 2),
      ];

      const results = await Promise.allSettled(promises);

      // 处理并行请求结果
      const successfulResults: NameResult[][] = [];
      const errors: Error[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
          logger.info(`并行请求 ${index + 1} 成功`, { count: result.value.length });
        } else {
          errors.push(result.reason);
          logger.error(`并行请求 ${index + 1} 失败`, { error: result.reason });
        }
      });

      let allNames: NameResult[] = [];

      if (successfulResults.length === 2) {
        // 两个请求都成功：合并6个名字，去重后返回前5个
        allNames = this.mergeAndDeduplicateNames(successfulResults[0], successfulResults[1]);
        logger.info('两个并行请求都成功，合并结果', {
          totalBeforeDedup: successfulResults[0].length + successfulResults[1].length,
          totalAfterDedup: allNames.length,
        });
      } else if (successfulResults.length === 1) {
        // 只有一个成功：用成功的3个，再串行生成2个补充
        const existingNames = successfulResults[0];
        logger.info('只有一个并行请求成功，补充生成剩余名字', {
          existingCount: existingNames.length,
          needMore: 2,
        });

        try {
          const additionalNames = await this.generateBatch(params, 2, 3);
          allNames = [...existingNames, ...additionalNames];
          logger.info('补充生成成功', { additionalCount: additionalNames.length });
        } catch (error) {
          // 补充生成失败，返回已有的3个名字
          logger.warn('补充生成失败，返回已有结果', { error });
          allNames = existingNames;
        }
      } else {
        // 两个都失败：抛出错误
        const firstError = errors[0];
        logger.error('两个并行请求都失败', { errors: errors.map(e => e.message) });
        throw firstError;
      }

      // 确保返回5个名字（如果不足5个，保持现有）
      const finalNames = allNames.slice(0, 5);

      const elapsedTime = Date.now() - startTime;
      logger.info('并行生成名字完成', {
        elapsedTime: `${elapsedTime}ms`,
        finalCount: finalNames.length,
      });

      return finalNames;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      logger.error('并行生成名字失败', { error, elapsedTime: `${elapsedTime}ms` });
      throw error;
    }
  }

  /**
   * 生成一批名字
   */
  private async generateBatch(
    params: NameGenerationParams,
    count: number,
    batchId: number
  ): Promise<NameResult[]> {
    const batchStartTime = Date.now();

    logger.info(`开始生成第 ${batchId} 批名字`, { count });

    // 构建请求
    const request: ZhipuRequest = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(params, count),
        },
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    if (typeof this.topP === 'number') {
      request.top_p = this.topP;
    }

    // 调用智谱AI API
    const response = await axios.post<ZhipuResponse>(this.apiUrl, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: this.timeout,
      signal: AbortSignal.timeout(this.timeout),
      validateStatus: () => true,
      proxy: false,
    });

    if (response.status >= 400) {
      logger.error(`第 ${batchId} 批AI API响应错误`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
      switch (response.status) {
        case 401:
          throw new ApiError('AI_AUTH_FAILED', 'AI服务认证失败，请检查API密钥配置', 503);
        case 429:
          throw new ApiError('AI_RATE_LIMIT', 'AI服务请求过于频繁，请稍后再试', 503);
        case 500:
        case 502:
        case 503:
          throw new ApiError('AI_SERVICE_ERROR', 'AI服务暂时不可用，请稍后再试', 503);
        default:
          throw new ApiError('AI_ERROR', `AI服务错误: ${response.statusText}`, 503);
      }
    }

    // 解析响应
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      logger.error(`第 ${batchId} 批AI返回内容为空`, {
        responseData: response.data,
        choices: response.data.choices,
      });
      throw new ApiError('AI_EMPTY_RESPONSE', 'AI返回内容为空，请重试', 503);
    }

    // 解析JSON结果
    const names = this.parseAIResponse(content, count);

    const elapsedTime = Date.now() - batchStartTime;
    logger.info(`第 ${batchId} 批名字生成成功`, { elapsedTime: `${elapsedTime}ms`, count: names.length });

    return names;
  }

  /**
   * 合并并去重名字列表
   */
  private mergeAndDeduplicateNames(batch1: NameResult[], batch2: NameResult[]): NameResult[] {
    const merged = [...batch1, ...batch2];

    // 按 full_name 去重
    const seen = new Set<string>();
    const unique: NameResult[] = [];

    for (const name of merged) {
      const key = name.full_name;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(name);
      }
    }

    return unique;
  }

  /**
   * 解析AI返回的JSON响应
   */
  private parseAIResponse(content: string, expectedCount?: number): NameResult[] {
    try {
      // 尝试提取JSON（去除可能的markdown代码块标记）
      let jsonContent = content.trim();

      // 移除可能的markdown代码块标记
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.slice(3);
      }

      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.slice(0, -3);
      }

      jsonContent = jsonContent.trim();

      // 解析JSON
      const result = JSON.parse(jsonContent);

      // 验证数据结构
      if (!result.names || !Array.isArray(result.names)) {
        throw new Error('AI返回数据格式错误：缺少names字段');
      }

      if (expectedCount && result.names.length !== expectedCount) {
        logger.warn('AI返回名字数量与预期不符', { expected: expectedCount, actual: result.names.length });
      }

      // 验证每个名字的字段
      const names: NameResult[] = result.names.map((item: any, index: number) => {
        if (!item.name || !item.full_name || !item.pinyin) {
          throw new Error(`第${index + 1}个名字缺少必需字段`);
        }

        // 强制覆盖AI生成的ID，使用真正的UUID
        // AI经常生成伪随机ID（如 a1b2c3d4...），会导致不同批次名字ID碰撞
        item.id = uuidv4();

        // 确保有score
        if (typeof item.score !== 'number') {
          item.score = 90;
        }

        return item as NameResult;
      });

      logger.info('AI结果解析成功', { nameCount: names.length });

      return names;
    } catch (error) {
      logger.error('解析AI响应失败', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        content: content.substring(0, 500)
      });
      throw new ApiError('AI_PARSE_ERROR', '解析AI结果失败，请重试', 503);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.hasApiKey) {
      logger.warn('AI服务未配置AI_API_KEY，健康检查跳过');
      return false;
    }
    try {
      const response = await axios.get(this.apiUrl.replace('/chat/completions', '/'), {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: this.healthTimeout,
        signal: AbortSignal.timeout(this.healthTimeout),
        validateStatus: () => true,
        proxy: false,
      });

      return response.status >= 200 && response.status < 500;
    } catch (error) {
      logger.error('智谱AI健康检查失败', { error });
      return false;
    }
  }
}

export default new ZhipuService();
