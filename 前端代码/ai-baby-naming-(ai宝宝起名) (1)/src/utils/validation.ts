export function validateCodeFormat(code: string): boolean {
  const regex = /^BABY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(code);
}

export function formatCode(input: string): string {
  // 移除所有非字母数字字符，并转大写
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // 如果用户已经输入了BABY前缀，移除它（避免重复）
  if (cleaned.startsWith('BABY')) {
    cleaned = cleaned.slice(4);
  }
  
  // 分割成4位一组
  const parts = [
    cleaned.slice(0, 4),
    cleaned.slice(4, 8),
    cleaned.slice(8, 12),
    cleaned.slice(12, 16)
  ].filter(p => p);
  
  if (parts.length === 0) {
    return '';
  }
  
  // 返回 BABY-XXXX-XXXX-XXXX 格式
  return ['BABY', ...parts].join('-');
}
