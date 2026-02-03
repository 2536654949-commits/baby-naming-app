/**
 * JWT配置
 */

const isProduction = process.env.NODE_ENV === 'production';
const secretFromEnv = process.env.JWT_SECRET;

if (isProduction && !secretFromEnv) {
  throw new Error('JWT_SECRET must be set in production environment');
}

export const jwtConfig = {
  secret: secretFromEnv || 'baby-name-secret-key-2025-dev-only',
  expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  algorithm: 'HS256' as const,
};
