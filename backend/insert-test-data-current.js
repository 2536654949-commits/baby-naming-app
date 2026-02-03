const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertTestData() {
  try {
    console.log('开始插入历史记录测试数据...');

    // 测试用的AI结果数据 - 5个名字
    const testNames = [
      {
        id: 'test-name-001',
        name: '瑞轩',
        full_name: '王瑞轩',
        pinyin: 'wáng ruì xuān',
        meaning: '瑞表示祥瑞吉祥，轩表示气宇轩昂，寓意孩子前程似锦，品格高尚',
        cultural_source: '无',
        wuxing_analysis: '五行平衡，适合甲木命格',
        score: 95,
        highlight: '寓意吉祥，音律和谐'
      },
      {
        id: 'test-name-002',
        name: '浩然',
        full_name: '王浩然',
        pinyin: 'wáng hào rán',
        meaning: '浩然正气，取自孟子，寓意孩子胸怀坦荡，正直勇敢',
        cultural_source: '《孟子·公孙丑上》',
        wuxing_analysis: '水火相济，五行调和',
        score: 96,
        highlight: '儒家典故，文化底蕴深厚'
      },
      {
        id: 'test-name-003',
        name: '梓涵',
        full_name: '王梓涵',
        pinyin: 'wáng zǐ hán',
        meaning: '梓指故乡，涵指包容，寓意不忘根本，胸怀宽广',
        cultural_source: '无',
        wuxing_analysis: '木水相生，命理相合',
        score: 93,
        highlight: '现代流行，音韵优美'
      },
      {
        id: 'test-name-004',
        name: '逸飞',
        full_name: '王逸飞',
        pinyin: 'wáng yì fēi',
        meaning: '逸表示超逸，飞表示高远，寓意志向高远，才华横溢',
        cultural_source: '无',
        wuxing_analysis: '土金相生，五行顺畅',
        score: 94,
        highlight: '寓意深远，充满朝气'
      },
      {
        id: 'test-name-005',
        name: '宇轩',
        full_name: '李宇轩',
        pinyin: 'wáng yǔ xuān',
        meaning: '宇表示天地宇宙，轩表示气度不凡，寓意胸襟开阔，志向远大',
        cultural_source: '无',
        wuxing_analysis: '土木相合，命格吉祥',
        score: 94,
        highlight: '气势恢宏，寓意深刻'
      }
    ];

    const babyInfo = {
      surname: '王',
      gender: 'male',
      birthDate: '2024-01-15',
      birthTime: '10:30',
      specialRequirements: '希望名字寓意吉祥、有文化底蕴'
    };

    const aiResult = { names: testNames };

    // 查找当前激活的授权码 BABY-86GB-99VS-YA45
    const authCode = await prisma.authorizationCode.findFirst({
      where: {
        code: 'BABY-86GB-99VS-YA45',
        status: 'USED'
      }
    });

    if (!authCode) {
      console.error('未找到已使用的授权码');
      return;
    }

    console.log('找到授权码:', authCode.code);

    // 先删除旧的测试记录（避免重复）
    const deleted = await prisma.usageRecord.deleteMany({
      where: {
        code: authCode.code,
        userId: authCode.code
      }
    });
    console.log(`删除了 ${deleted.count} 条旧记录`);

    // 插入3条测试记录（用于历史记录分页测试）
    for (let i = 0; i < 3; i++) {
      const record = await prisma.usageRecord.create({
        data: {
          codeId: authCode.id,
          code: authCode.code,
          userId: authCode.code, // JWT中的userId就是授权码
          deviceId: authCode.deviceId || 'test-device-id',
          babyInfo: babyInfo,
          aiResult: aiResult,
          generationTime: 2000 + i * 100,
          createdAt: new Date(Date.now() - (2 - i) * 3600000) // 间隔1小时
        }
      });
      console.log(`✅ 插入第${i + 1}条历史记录，ID: ${record.id}`);
    }

    console.log('测试数据插入完成！');
  } catch (error) {
    console.error('插入测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertTestData();
