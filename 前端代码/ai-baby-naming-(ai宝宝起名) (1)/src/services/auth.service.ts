import api from './api';
import { getOrCreateDeviceId } from '../utils/device';

// 授权码激活
export async function validateCode(code: string) {
  const deviceId = await getOrCreateDeviceId();
  const response = await api.post('/auth/validate', {
    code: code.trim(),
    deviceId
  });
  return response;
}

// Token恢复
export async function recoverToken(code: string) {
  const deviceId = await getOrCreateDeviceId();
  const response = await api.post('/auth/recover', {
    code: code.trim(),
    deviceId
  });
  return response;
}

// 获取授权状态
export async function getAuthStatus() {
  const response = await api.get('/auth/status');
  return response;
}

// 保存Token到localStorage
export function saveToken(token: string): void {
  localStorage.setItem('AI_BABY_NAMING_TOKEN', token);
  localStorage.setItem('AI_BABY_NAMING_ACTIVATED', 'true');
}

// 获取Token
export function getToken(): string | null {
  return localStorage.getItem('AI_BABY_NAMING_TOKEN');
}

// 清除Token
export function clearToken(): void {
  localStorage.removeItem('AI_BABY_NAMING_TOKEN');
  localStorage.removeItem('AI_BABY_NAMING_ACTIVATED');
}

// 检查是否已激活
export function isAuthenticated(): boolean {
  return !!getToken();
}
