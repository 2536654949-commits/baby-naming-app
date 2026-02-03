/**
 * 授权码生成脚本
 * 用于批量生成授权码并存储到数据库
 *
 * 使用方法:
 *   npx ts-node scripts/generate-codes.ts --count 100 --batch BATCH-001
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

// 配置
const CODE_PREFIX = 'BABY';
const CODE_FORMAT = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

interface GenerateOptions {
  count: number;
  batchId?: string;
  metadata?: string;
}

/**
 * 生成随机授权码
 * 格式: BABY-XXXX-XXXX-XXXX
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符: I, O, 0, 1
  const segments = [CODE_PREFIX];

  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return segments.join('-');
}

/**
 * 验证授权码格式
 */
function validateCode(code: string): boolean {
  return CODE_FORMAT.test(code.substring(5)); // 去掉前缀 "BABY-" 后验证
}

/**
 * 生成授权码批次
 */
async function generateCodes(options: GenerateOptions): Promise<string[]> {
  const prisma = new PrismaClient();
  const codes: string[] = [];

  try {
    console.log(`开始生成 ${options.count} 个授权码...`);

    // 生成唯一授权码
    const uniqueCodes = new Set<string>();
    let attempts = 0;
    const maxAttempts = options.count * 10; // 防止无限循环

    while (uniqueCodes.size < options.count && attempts < maxAttempts) {
      const code = generateCode();
      if (validateCode(code) && !uniqueCodes.has(code)) {
        uniqueCodes.add(code);
      }
      attempts++;
    }

    if (uniqueCodes.size < options.count) {
      throw new Error(`生成失败：尝试 ${attempts} 次后仅生成 ${uniqueCodes.size} 个唯一授权码`);
    }

    codes.push(...Array.from(uniqueCodes));

    // 存储到数据库
    console.log('正在存储到数据库...');
    const batchSize = 100; // 分批插入
    for (let i = 0; i < codes.length; i += batchSize) {
      const batch = codes.slice(i, i + batchSize);
      await prisma.authorizationCode.createMany({
        data: batch.map((code) => ({
          code,
          status: 'UNUSED',
          batchId: options.batchId,
          metadata: options.metadata,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后过期
        })),
      });
      console.log(`已存储 ${Math.min(i + batchSize, codes.length)}/${codes.length} 个授权码`);
    }

    console.log('\n授权码生成完成！');
    console.log(`批次ID: ${options.batchId || 'N/A'}`);
    console.log(`数量: ${codes.length}`);
    console.log(`过期时间: 90天\n`);

  } catch (error) {
    console.error('生成授权码时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return codes;
}

/**
 * 输出授权码到文件和控制台
 */
function outputCodes(codes: string[], batchId?: string): void {
  // 输出到控制台（前10个）
  console.log('授权码列表（前10个）:');
  codes.slice(0, 10).forEach((code, index) => {
    console.log(`  ${index + 1}. ${code}`);
  });

  if (codes.length > 10) {
    console.log(`  ... 还有 ${codes.length - 10} 个授权码`);
  }

  // 输出到文件
  const filename = batchId ? `codes-${batchId}.txt` : `codes-${Date.now()}.txt`;
  const fs = require('fs');
  fs.writeFileSync(filename, codes.join('\n'));
  console.log(`\n完整授权码列表已保存到: ${filename}`);
}

/**
 * 从命令行参数解析选项
 */
function parseOptions(args: string[]): GenerateOptions {
  const options: GenerateOptions = {
    count: 10,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--count' && nextArg) {
      const count = parseInt(nextArg, 10);
      if (isNaN(count) || count <= 0) {
        throw new Error('--count 必须是一个正整数');
      }
      options.count = count;
    } else if (arg === '--batch' && nextArg) {
      options.batchId = nextArg;
    } else if (arg === '--metadata' && nextArg) {
      options.metadata = nextArg;
    }
  }

  return options;
}

/**
 * 确认操作
 */
function confirmOperation(options: GenerateOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      `即将生成 ${options.count} 个授权码${options.batchId ? ` (批次: ${options.batchId})` : ''}，确认继续？(yes/no): `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      }
    );
  });
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options = parseOptions(args);

    console.log('=== 授权码生成工具 ===\n');
    console.log(`配置:`);
    console.log(`  数量: ${options.count}`);
    console.log(`  批次ID: ${options.batchId || 'N/A'}`);
    console.log(`  元数据: ${options.metadata || 'N/A'}`);
    console.log();

    const confirmed = await confirmOperation(options);
    if (!confirmed) {
      console.log('操作已取消');
      return;
    }

    const codes = await generateCodes(options);
    outputCodes(codes, options.batchId);

  } catch (error) {
    console.error('错误:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { generateCodes, generateCode, validateCode };
