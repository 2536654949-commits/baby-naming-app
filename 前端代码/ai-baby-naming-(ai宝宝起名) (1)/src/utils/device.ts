// 生成设备指纹
export async function generateDeviceId(): Promise<string> {
  const userAgent = navigator.userAgent;
  const language = navigator.language || '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const platform = navigator.platform || '';
  const baseFingerprint = [userAgent, language, timezone, platform].join('|');
  // 使用简单的hash算法
  const hash = await simpleHash(baseFingerprint);
  return hash.substring(0, 32);
}

// 获取或生成设备ID
export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = localStorage.getItem('AI_BABY_DEVICE_ID');
  if (!deviceId) {
    deviceId = await generateDeviceId();
    localStorage.setItem('AI_BABY_DEVICE_ID', deviceId);
  }
  return deviceId;
}

// 简单hash函数
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
