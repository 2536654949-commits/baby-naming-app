const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryAvailableCodes() {
  try {
    console.log('查询可用授权码...\n');

    const codes = await prisma.authorization_code.findMany({
      where: {
        status: 'unused'
      },
      select: {
        code: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`找到 ${codes.length} 个未使用的授权码:\n`);

    codes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code} (状态: ${code.status})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('查询失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

queryAvailableCodes();
