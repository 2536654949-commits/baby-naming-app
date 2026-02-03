const axios = require('axios');

async function testNamingAPI() {
  try {
    console.log('测试起名API...');

    // 首先获取一个有效的token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImNvZGUiOiJCQUJZLVIzR0ctR1hDWS1EMlpLIiwiaWF0IjoxNzM4MzA4OTc2LCJleHAiOjE3NDU5MTY5NzZ9.F5bDxZnF9Pfw_T1m4CUjD9P46JUQMxlh9FZ6LF5nnA0';

    const response = await axios.post('http://localhost:3000/api/name/generate', {
      surname: '李',
      gender: 'male',
      birthDate: '2024-01-15',
      birthTime: '10:30',
      requirements: '希望名字寓意吉祥、有文化底蕴'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 60000  // 60秒超时
    });

    console.log('✅ 起名API调用成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 起名API调用失败!');

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

testNamingAPI();
