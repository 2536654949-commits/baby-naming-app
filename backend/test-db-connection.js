const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const configs = [
    // 配置1: pooler (事务模式)
    {
      name: 'Pooler (port 6543)',
      databaseUrl: 'postgresql://postgres.puzbruleuezupsfxpusm:zw15827455010@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
      directUrl: 'postgresql://postgres.puzbruleuezupsfxpusm:zw15827455010@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
    },
    // 配置2: 使用 postgres 用户名（不带项目ID）
    {
      name: 'Without project ID in username',
      databaseUrl: 'postgresql://postgres:zw15827455010@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
      directUrl: 'postgresql://postgres:zw15827455010@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
    }
  ];

  for (const config of configs) {
    console.log(`\n尝试连接: ${config.name}`);
    console.log(`DATABASE_URL: ${config.databaseUrl}`);
    console.log(`DIRECT_URL: ${config.directUrl}`);

    // 设置环境变量
    process.env.DATABASE_URL = config.databaseUrl;
    process.env.DIRECT_URL = config.directUrl;

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl
        }
      }
    });

    try {
      console.log('正在连接数据库...');
      await prisma.$connect();
      console.log('连接成功!');

      // 尝试简单查询
      const result = await prisma.$queryRaw`SELECT current_database(), current_user`;
      console.log('数据库信息:', result);

      await prisma.$disconnect();
      console.log('连接已关闭.');
      return config; // 返回成功的配置
    } catch (error) {
      console.error('连接失败:', error.message);
      try {
        await prisma.$disconnect();
      } catch (e) {
        // 忽略关闭错误
      }
    }
  }

  console.log('\n所有配置均失败.');
  return null;
}

testConnection().then(successConfig => {
  if (successConfig) {
    console.log(`\n✅ 推荐配置: ${successConfig.name}`);
    console.log('请在 .env 文件中使用以下配置:');
    console.log(`DATABASE_URL="${successConfig.databaseUrl}"`);
    console.log(`DIRECT_URL="${successConfig.directUrl}"`);
  } else {
    console.log('\n❌ 无法连接到数据库，请检查:');
    console.log('1. Supabase 项目是否处于 Active 状态');
    console.log('2. 密码是否正确: zw15827455010');
    console.log('3. 项目 ID 是否正确: puzbruleuezupsfxpusm');
    console.log('4. 网络是否可以访问 Supabase');
    console.log('5. 是否需要在 Supabase 控制台中重置数据库密码');
  }
  process.exit(successConfig ? 0 : 1);
}).catch(err => {
  console.error('测试脚本错误:', err);
  process.exit(1);
});
