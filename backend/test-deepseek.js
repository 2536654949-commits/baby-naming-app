const axios = require('axios');

async function testDeepSeek() {
  try {
    console.log('测试DeepSeek API连接...');

    const apiKey = 'sk-779486e1fbfb4679bcba3ae779cd9138';
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    const response = await axios.post(apiUrl, {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: '你好,请用一句话介绍自己'
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    console.log('✅ API调用成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ API调用失败!');

    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testDeepSeek();
