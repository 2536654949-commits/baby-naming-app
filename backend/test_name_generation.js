/**
 * 测试起名功能 - 完整流程
 * 包含注册/登录和生成名字
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 生成随机用户名
function generateRandomUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return {
    username: `testuser_${timestamp}_${random}`,
    email: `test_${timestamp}_${random}@example.com`,
    password: 'Test123456'
  };
}

async function testNameGeneration() {
  console.log('开始测试起名功能完整流程...\n');

  let token = null;

  try {
    // 步骤1: 注册用户
    console.log('步骤1: 注册测试用户...');
    const userData = generateRandomUser();
    console.log('用户信息:', { username: userData.username, email: userData.email });

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData, {
      validateStatus: () => true,
    });

    if (registerResponse.status !== 201) {
      console.log('❌ 注册失败:', registerResponse.data);
      return;
    }

    token = registerResponse.data.token;
    console.log('✅ 注册成功, 获得JWT Token\n');

    // 步骤2: 生成名字
    console.log('步骤2: 调用起名API...');
    const nameData = {
      surname: '张',
      gender: 'male',
      birthDate: '2024-01-15',
      birthTime: '10:30',
      requirements: '希望名字有文化底蕴'
    };

    console.log('起名参数:', JSON.stringify(nameData, null, 2));
    console.log('\n正在调用DeepSeek API生成名字...(这可能需要30-60秒)');

    const startTime = Date.now();

    const response = await axios.post(`${BASE_URL}/name/generate`, nameData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 90000, // 90秒超时
      validateStatus: () => true, // 不抛出HTTP错误
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ API调用完成 (耗时: ${elapsedTime}秒)`);
    console.log(`状态码: ${response.status}`);

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ 起名成功!');
      console.log(`生成了 ${response.data.names?.length || 0} 个名字\n`);

      if (response.data.names && response.data.names.length > 0) {
        console.log('第一个名字示例:');
        const firstName = response.data.names[0];
        console.log('  完整姓名:', firstName.full_name);
        console.log('  拼音:', firstName.pinyin);
        console.log('  寓意:', firstName.meaning.substring(0, 50) + '...');
        console.log('  评分:', firstName.score);
      }

      if (response.data.requestId) {
        console.log('\n请求ID:', response.data.requestId);
      }
    } else {
      console.log('\n❌ API返回错误状态码');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log('\n❌ 测试失败');

    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.log('错误类型: 请求超时');
      console.log('错误信息:', error.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('错误类型: 连接被拒绝');
      console.log('提示: 请确认后端服务是否在运行 (http://localhost:3000)');
    } else {
      console.log('错误类型:', error.code || 'Unknown');
      console.log('错误信息:', error.message);
      if (error.stack) {
        console.log('\n堆栈跟踪:', error.stack);
      }
    }
  }
}

// 运行测试
testNameGeneration()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n未捕获的错误:', error);
    process.exit(1);
  });
