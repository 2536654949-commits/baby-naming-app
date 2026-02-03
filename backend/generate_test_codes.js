const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 生成随机授权码
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = ['BABY'];

  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return segments.join('-');
}

(async () => {
  try {
    const count = 5;
    const batchId = 'TEST-BATCH-' + Date.now();
    const codes = [];

    console.log(`生成 ${count} 个授权码...`);

    for (let i = 0; i < count; i++) {
      const code = generateCode();
      codes.push({
        code,
        status: 'AVAILABLE',
        batchId,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1年后过期
      });
      console.log(`  ${i + 1}. ${code}`);
    }

    // 批量插入数据库
    const result = await prisma.authorizationCode.createMany({
      data: codes,
      skipDuplicates: true
    });

    console.log(`\n✅ 成功生成 ${result.count} 个授权码`);
    console.log(`批次ID: ${batchId}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
