/**
 * 完整测试流程:创建授权码 -> 激活 -> 生成名字
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

// 生成授权码格式: BABY-XXXX-XXXX-XXXX
function generateAuthCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除容易混淆的字符
  const segments = [];

  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  return `BABY-${segments.join('-')}`;
}

// 生成设备指纹
function generateDeviceId() {
  return crypto.createHash('sha256')
    .update('TestDevice_' + Date.now())
    .digest('hex');
}

async function testCompleteFlow() {
  console.log('========== 开始完整流程测试 ==========\n');

  try {
    // 步骤1: 创建授权码
    console.log('步骤1: 创建测试授权码...');
    const authCode = generateAuthCode();
    console.log('生成的授权码:', authCode);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90天后过期

    await prisma.authorizationCode.create({
      data: {
        code: authCode,
        status: 'UNUSED',
        expiresAt: expiresAt,
        batchId: 'TEST_BATCH_' + Date.now(),
      },
    });

    console.log('✅ 授权码创建成功\n');

    // 步骤2: 激活授权码
    console.log('步骤2: 激活授权码...');
    const deviceId = generateDeviceId();
    console.log('设备ID:', deviceId);

    const activateResponse = await axios.post(
      `${BASE_URL}/auth/validate`,
      { code: authCode, deviceId: deviceId },
      { validateStatus: () => true }
    );

    if (activateResponse.status !== 200) {
      console.log('❌ 激活失败:', activateResponse.data);
      return;
    }

    console.log('激活响应:', JSON.stringify(activateResponse.data, null, 2));

    const token = activateResponse.data.data?.token || activateResponse.data.token;
    if (!token) {
      console.log('❌ 未获取到Token');
      console.log('完整响应:', activateResponse.data);
      return;
    }

    console.log('✅ 激活成功, 获得JWT Token');
    console.log('Token前缀:', token.substring(0, 20) + '...\n');

    // 步骤3: 生成名字
    console.log('步骤3: 调用起名API...');
    const nameData = {
      surname: '张',
      gender: 'male',
      birthDate: '2024-01-15',
      birthTime: '10:30',
      requirements: '希望名字有文化底蕴',
    };

    console.log('起名参数:', JSON.stringify(nameData, null, 2));
    console.log('\n正在调用DeepSeek API生成名字...(这可能需要30-60秒)\n');

    const startTime = Date.now();

    const generateResponse = await axios.post(
      `${BASE_URL}/name/generate`,
      nameData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
        validateStatus: () => true,
      }
    );

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`API调用完成 (耗时: ${elapsedTime}秒)`);
    console.log(`状态码: ${generateResponse.status}\n`);

    if (generateResponse.status === 200 || generateResponse.status === 201) {
      console.log('✅ 起名成功!\n');

      // 响应可能在 data.data 或 data 中
      const responseData = generateResponse.data.data || generateResponse.data;
      const names = responseData.names || [];

      console.log(`生成了 ${names.length} 个名字:`);
      console.log('='.repeat(60));

      names.forEach((name, index) => {
        console.log(`\n名字 ${index + 1}:`);
        console.log(`  完整姓名: ${name.full_name}`);
        console.log(`  拼音: ${name.pinyin}`);
        const meaning = name.meaning || '';
        const meaningPreview = meaning.length > 60 ? meaning.substring(0, 60) + '...' : meaning;
        console.log(`  寓意: ${meaningPreview}`);
        console.log(`  评分: ${name.score}分`);
        if (name.cultural_source && name.cultural_source !== '无') {
          console.log(`  典故: ${name.cultural_source}`);
        }
      });

      console.log('\n' + '='.repeat(60));
      console.log('\n✅ 所有测试通过!');

      if (responseData.requestId) {
        console.log(`请求ID: ${responseData.requestId}`);
      }
    } else {
      console.log('❌ 起名失败');
      console.log('响应数据:', JSON.stringify(generateResponse.data, null, 2));
    }

  } catch (error) {
    console.log('\n❌ 测试失败\n');

    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.log('错误类型: 请求超时');
      console.log('说明: DeepSeek API响应超过90秒');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('错误类型: 连接被拒绝');
      console.log('提示: 请确认后端服务是否在运行');
    } else {
      console.log('错误:', error.message);
      if (error.stack) {
        console.log('\n堆栈:', error.stack);
      }
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n========== 测试完成 ==========');
  }
}

// 运行测试
testCompleteFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
