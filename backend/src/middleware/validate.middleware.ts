import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';
import { z } from 'zod';

export const validateCodeSchema = z.object({
  code: z.string().regex(/^BABY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: '授权码格式不正确',
  }),
  deviceId: z.string().min(1, '设备ID不能为空'),
});

export const validateNameSchema = z.object({
  surname: z.string().regex(/^[\u4e00-\u9fa5]{1,2}$/, {
    message: '姓氏必须是1-2个汉字',
  }),
  gender: z.enum(['male', 'female', 'unknown'], {
    message: '性别必须是male、female或unknown',
  }),
  birthDate: z.string().optional(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: '出生时间格式不正确，应为HH:MM',
  }).optional(),
  requirements: z.string().max(200, {
    message: '特殊要求最多200字',
  }).optional(),
});

export const validateFavoriteSchema = z.object({
  nameData: z.object({
    id: z.string().min(1, '名字ID不能为空'),
    name: z.string().min(1, '名字不能为空'),
    full_name: z.string().min(1, '完整姓名不能为空'),
    pinyin: z.string().min(1, '拼音不能为空'),
    meaning: z.string().min(1, '寓意不能为空'),
    cultural_source: z.string(),
    wuxing_analysis: z.string(),
    score: z.number().min(0).max(100, '评分必须在0-100之间'),
    highlight: z.string(),
  }),
});

export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req[target] = schema.parse(req[target]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        logger.warn('数据验证失败', { errors: error.errors });

        const validationError = new Error(firstError.message || '数据验证失败');
        (validationError as any).name = 'ValidationError';
        (validationError as any).code = 'VALIDATION_ERROR';
        (validationError as any).statusCode = 400;
        throw validationError;
      }
      next(error);
    }
  };

export default {
  validate,
  validateCodeSchema,
  validateNameSchema,
  validateFavoriteSchema,
};
