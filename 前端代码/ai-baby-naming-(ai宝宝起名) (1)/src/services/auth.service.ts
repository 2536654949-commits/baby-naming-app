import api from './api';
import { getOrCreateDeviceId } from '../utils/device';

// 鎺堟潈鐮佹縺娲?
export async function validateCode(code: string) {
  const deviceId = await getOrCreateDeviceId();
  const response = await api.post('/auth/validate', {
    code,
    deviceId
  });
  return response;
}

// Token鎭㈠
export async function recoverToken(code: string) {
  const deviceId = await getOrCreateDeviceId();
  const response = await api.post('/auth/recover', {
    code,
    deviceId
  });
  return response;
}

// 鑾峰彇鎺堟潈鐘舵€?
export async function getAuthStatus() {
  const response = await api.get('/auth/status');
  return response;
}

// 淇濆瓨Token鍒發ocalStorage
export function saveToken(token: string): void {
  localStorage.setItem('AI_BABY_NAMING_TOKEN', token);
  localStorage.setItem('AI_BABY_NAMING_ACTIVATED', 'true');
}

// 鑾峰彇Token
export function getToken(): string | null {
  return localStorage.getItem('AI_BABY_NAMING_TOKEN');
}

// 娓呴櫎Token
export function clearToken(): void {
  localStorage.removeItem('AI_BABY_NAMING_TOKEN');
  localStorage.removeItem('AI_BABY_NAMING_ACTIVATED');
}

// 妫€鏌ユ槸鍚﹀凡婵€娲?
export function isAuthenticated(): boolean {
  return !!getToken();
}


