// 测试 DeepSeek API 调用
require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

async function testAPICall() {
  const apiKey = process.env.ZHIPU_API_KEY?.replace(/^"|"$/g, '');
  const apiUrl = process.env.ZHIPU_API_URL?.replace(/^"|"$/g, '') || 'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.ZHIPU_MODEL?.replace(/^"|"$/g, '') || 'deepseek-chat';

  console.log('配置信息:');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
  console.log('');

  const request = {
    model: model,
    messages: [
      {
        role: 'user',
        content: '测试：请为姓李的男孩推荐一个名字',
      },
    ],
    temperature: 0.8,
    max_tokens: 1200,
  };

  try {
    console.log('发送请求...');
    const response = await axios.post(apiUrl, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 60000,
      validateStatus: () => true,
    });

    console.log('');
    console.log('=== 响应信息 ===');
    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('');
    console.log('=== 响应数据 ===');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.choices && response.data.choices[0]) {
      console.log('');
      console.log('=== AI 返回内容 ===');
      console.log(response.data.choices[0].message.content);
    }
  } catch (error) {
    console.error('');
    console.error('=== 错误信息 ===');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testAPICall();
