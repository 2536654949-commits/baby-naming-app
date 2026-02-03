const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const codes = await prisma.authorizationCode.findMany({
      where: { status: 'AVAILABLE' },
      take: 10
    });

    console.log(`找到 ${codes.length} 个可用授权码:`);
    codes.forEach((c, i) => {
      console.log(`${i+1}. ${c.code}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
