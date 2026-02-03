import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { NameGenerationParams, NameResult } from '../types';
import { ZhipuRequest, ZhipuResponse, ZhipuErrorResponse } from '../types';
import { ApiError } from '../utils/error';

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

  constructor() {
    this.apiKey = (process.env.ZHIPU_API_KEY || '').replace(/^"|"$/g, '');
    this.apiUrl = (process.env.ZHIPU_API_URL || 'https://api.deepseek.com/v1/chat/completions').replace(/^"|"$/g, '');
    this.model = (process.env.ZHIPU_MODEL || 'deepseek-chat').replace(/^"|"$/g, '');
    this.hasApiKey = Boolean(this.apiKey);

    const isDeepSeek = this.apiUrl.includes('deepseek') || this.model.includes('deepseek');
    const timeoutEnv = process.env.ZHIPU_API_TIMEOUT ? Number(process.env.ZHIPU_API_TIMEOUT) : undefined;
    const maxTokensEnv = process.env.ZHIPU_MAX_TOKENS ? Number(process.env.ZHIPU_MAX_TOKENS) : undefined;
    const temperatureEnv = process.env.ZHIPU_TEMPERATURE ? Number(process.env.ZHIPU_TEMPERATURE) : undefined;
    const topPEnv = process.env.ZHIPU_TOP_P ? Number(process.env.ZHIPU_TOP_P) : undefined;

    this.timeout = (timeoutEnv !== undefined && Number.isFinite(timeoutEnv) && timeoutEnv > 0)
      ? timeoutEnv
      : (isDeepSeek ? 60000 : 30000);
    this.healthTimeout = Math.min(this.timeout, 10000);
    this.temperature = (temperatureEnv !== undefined && Number.isFinite(temperatureEnv)) ? temperatureEnv : 0.8;
    this.maxTokens = (maxTokensEnv !== undefined && Number.isFinite(maxTokensEnv)) ? maxTokensEnv : (isDeepSeek ? 1200 : 2000);
    this.topP = (topPEnv !== undefined && Number.isFinite(topPEnv)) ? topPEnv : (isDeepSeek ? undefined : 0.9);

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
   * 生成起名Prompt
   */
  private buildPrompt(params: NameGenerationParams): string {
    const { surname, gender, birthDate, birthTime, requirements } = params;

    // 性别映射
    const genderMap: Record<string, string> = {
      male: '男孩',
      female: '女孩',
      unknown: '未知',
    };

    let prompt = `角色设定：你是一位拥有20年经验的起名大师，精通周易五行、古诗词、现代美学。
任务：根据用户提供的宝宝信息，生成5个精选名字。
输入信息：- 姓氏：${surname}
- 性别：${genderMap[gender] || gender}`;

    if (birthDate) {
      prompt += `\n- 出生日期：${birthDate}`;
    }

    if (birthTime) {
      prompt += `\n- 出生时间：${birthTime}`;
    }

    if (requirements) {
      prompt += `\n- 特殊要求：${requirements}`;
    }

    prompt += `

起名标准：1. 寓意美好：名字要有积极的寓意和内涵
2. 音律和谐：声调搭配，朗朗上口，无不良谐音
3. 字形美观：结构匀称，书写流畅
4. 文化底蕴：优先从诗词典故中取材
5. 时代感：既要有传统底蕴，又要符合现代审美
6. 避免生僻：使用GB2312常用字，方便生活

输出要求：严格按以下JSON格式输出，不要任何额外文字：

{
  "names": [
    {
      "id": "唯一标识符(uuid格式)",
      "name": "名字（不含姓氏）",
      "full_name": "完整姓名",
      "pinyin": "拼音标注",
      "meaning": "详细寓意解释(100字以内)",
      "cultural_source": "诗词典故出处(如有，没有则写'无')",
      "wuxing_analysis": "五行分析(如提供出生时间)",
      "score": 95,
      "highlight": "最突出的亮点(一句话)"
    }
  ]
}

注意事项：- 不要输出JSON以外的任何内容
- 确保5个名字风格各异，给用户更多选择
- 评分要客观，90分以上为优质
- 如果用户提供了特殊要求，必须优先满足`;

    return prompt;
  }

  /**
   * 调用智谱AI API生成名字
   */
  async generateNames(params: NameGenerationParams): Promise<NameResult[]> {
    const startTime = Date.now();

    if (!this.hasApiKey) {
      logger.error('AI服务未配置ZHIPU_API_KEY，无法生成名字');
      throw new ApiError('AI_SERVICE_UNAVAILABLE', 'AI服务暂不可用，请稍后再试', 503);
    }

    try {
      logger.info('调用智谱AI生成名字', { surname: params.surname, gender: params.gender });

      // 构建请求
      const request: ZhipuRequest = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(params),
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
      });

      // 详细记录响应信息用于调试
      logger.info('AI API响应详情', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        hasChoices: !!response.data?.choices,
        choicesLength: response.data?.choices?.length,
      });

      if (response.status >= 400) {
        logger.error('AI API响应错误', {
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

      const elapsedTime = Date.now() - startTime;
      logger.info('智谱AI调用成功', { elapsedTime: `${elapsedTime}ms` });

      // 解析响应
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        logger.error('AI返回内容为空', {
          responseData: response.data,
          choices: response.data.choices,
        });
        throw new ApiError('AI_EMPTY_RESPONSE', 'AI返回内容为空，请重试', 503);
      }

      logger.info('AI返回内容预览', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      });

      // 解析JSON结果
      const names = this.parseAIResponse(content);

      return names;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;

      // 输出完整错误对象以便诊断
      logger.error('智谱AI调用失败 - 完整错误信息', {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        elapsedTime: `${elapsedTime}ms`,
      });

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ZhipuErrorResponse>;

        // 输出详细的Axios错误信息
        logger.error('Axios错误详情', {
          message: axiosError.message,
          code: axiosError.code,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: axiosError.response?.data,
          requestUrl: axiosError.config?.url,
          requestMethod: axiosError.config?.method,
          timeout: axiosError.config?.timeout,
        });

        // 处理API错误
        if (axiosError.response) {
          const { status, data } = axiosError.response;
          logger.error('API响应错误', { status, data });

          switch (status) {
            case 401:
              throw new ApiError('AI_AUTH_FAILED', 'AI服务认证失败，请检查API密钥配置', 503);
            case 429:
              throw new ApiError('AI_RATE_LIMIT', 'AI服务请求过于频繁，请稍后再试', 503);
            case 500:
            case 502:
            case 503:
              throw new ApiError('AI_SERVICE_ERROR', 'AI服务暂时不可用，请稍后再试', 503);
            default:
              throw new ApiError('AI_ERROR', data?.error?.message || 'AI服务错误', 503);
          }
        }

        // 处理超时
        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_CANCELED') {
          logger.error('请求超时详情', {
            timeout: this.timeout,
            elapsedTime: `${elapsedTime}ms`,
            message: '请求在指定时间内未完成',
          });
          throw new ApiError('AI_TIMEOUT', 'AI服务响应超时，请重试', 503);
        }

        // 处理网络错误
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          logger.error('网络连接错误详情', {
            code: axiosError.code,
            url: this.apiUrl,
            message: '无法连接到API服务器',
          });
          throw new ApiError('AI_NETWORK_ERROR', 'AI服务网络连接失败，请检查网络', 503);
        }
      }

      throw new ApiError('AI_UNKNOWN_ERROR', error instanceof Error ? error.message : 'AI服务异常', 503);
    }
  }

  /**
   * 解析AI返回的JSON响应
   */
  private parseAIResponse(content: string): NameResult[] {
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

      if (result.names.length !== 5) {
        logger.warn('AI返回名字数量不是5个', { count: result.names.length });
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
      logger.warn('AI服务未配置ZHIPU_API_KEY，健康检查跳过');
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
      });

      return response.status >= 200 && response.status < 500;
    } catch (error) {
      logger.error('智谱AI健康检查失败', { error });
      return false;
    }
  }
}

export default new ZhipuService();
