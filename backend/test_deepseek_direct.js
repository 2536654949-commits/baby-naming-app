/**
 * 直接测试 DeepSeek API 调用
 * 模拟后端的请求方式
 */

const axios = require('axios');

async function testDeepSeekAPI() {
  console.log('='.repeat(60));
  console.log('DeepSeek API 直接测试');
  console.log('='.repeat(60));

  const apiKey = 'sk-779486e1fbfb4679bcba3ae779cd9138';
  const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  const model = 'deepseek-chat';

  const prompt = `角色设定：你是一位拥有20年经验的起名大师，精通周易五行、古诗词、现代美学。
任务：根据用户提供的宝宝信息，生成5个精选名字。
输入信息：- 姓氏：张
- 性别：男孩
- 出生日期：2024-01-01
- 特殊要求：简单测试

起名标准：1. 寓意美好：名字要有积极的寓意和内涵
2. 音律和谐：声调搭配，朗朗上口，无不良谐音
3. 字形美观：结构匀称，书写流畅
4. 文化底蕴：优先从诗词典故中取材
5. 时代感：既要有传统底蕴，又要符合现代审美
6. 避免生僻：使用GB2312常用字，方便生活

输出要求：严格按以下JSON格式输出，不要任何额外文字：

{
  "names": [
    {
      "id": "唯一标识符(uuid格式)",
      "name": "名字（不含姓氏）",
      "full_name": "完整姓名",
      "pinyin": "拼音标注",
      "meaning": "详细寓意解释(100字以内)",
      "cultural_source": "诗词典故出处(如有，没有则写'无')",
      "wuxing_analysis": "五行分析(如提供出生时间)",
      "score": 95,
      "highlight": "最突出的亮点(一句话)"
    }
  ]
}

注意事项：- 不要输出JSON以外的任何内容
- 确保5个名字风格各异，给用户更多选择
- 评分要客观，90分以上为优质
- 如果用户提供了特殊要求，必须优先满足`;

  const request = {
    model: model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 1200,
  };

  console.log('\n配置信息:');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('API Key:', apiKey.substring(0, 15) + '...');
  console.log('Temperature:', request.temperature);
  console.log('Max Tokens:', request.max_tokens);

  console.log('\n开始调用 DeepSeek API...');
  const startTime = Date.now();

  try {
    const response = await axios.post(apiUrl, request, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 60000, // 60秒超时
      validateStatus: () => true, // 接收所有状态码
    });

    const elapsedTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('响应结果:');
    console.log('='.repeat(60));
    console.log('耗时:', `${elapsedTime}ms`);
    console.log('HTTP状态码:', response.status);
    console.log('状态文本:', response.statusText);

    if (response.status >= 400) {
      console.log('\n❌ API返回错误:');
      console.log('错误数据:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('\n✅ API调用成功!');
    console.log('Response ID:', response.data.id);
    console.log('Model:', response.data.model);

    const content = response.data.choices[0]?.message?.content;
    if (content) {
      console.log('\n生成内容长度:', content.length, '字符');
      console.log('内容预览 (前500字符):');
      console.log(content.substring(0, 500));

      // 尝试解析JSON
      try {
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.slice(7);
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.slice(3);
        }
        if (jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(0, -3);
        }
        jsonContent = jsonContent.trim();

        const result = JSON.parse(jsonContent);
        console.log('\n✅ JSON解析成功!');
        console.log('名字数量:', result.names?.length || 0);

        if (result.names && result.names.length > 0) {
          console.log('\n第一个名字示例:');
          console.log('  - 完整姓名:', result.names[0].full_name);
          console.log('  - 拼音:', result.names[0].pinyin);
          console.log('  - 寓意:', result.names[0].meaning?.substring(0, 50) + '...');
          console.log('  - 评分:', result.names[0].score);
        }
      } catch (parseError) {
        console.log('\n❌ JSON解析失败:', parseError.message);
        console.log('原始内容:', content.substring(0, 200));
      }
    } else {
      console.log('\n⚠️  响应内容为空');
    }

    console.log('\nToken使用情况:');
    console.log('  - Prompt tokens:', response.data.usage?.prompt_tokens);
    console.log('  - Completion tokens:', response.data.usage?.completion_tokens);
    console.log('  - Total tokens:', response.data.usage?.total_tokens);

  } catch (error) {
    const elapsedTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('❌ 调用失败');
    console.log('='.repeat(60));
    console.log('耗时:', `${elapsedTime}ms`);
    console.log('错误类型:', error.constructor.name);

    if (axios.isAxiosError(error)) {
      console.log('\nAxios错误详情:');
      console.log('  - Message:', error.message);
      console.log('  - Code:', error.code);

      if (error.response) {
        console.log('\n  响应信息:');
        console.log('    - Status:', error.response.status);
        console.log('    - StatusText:', error.response.statusText);
        console.log('    - Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('\n  请求已发送但没有响应');
        console.log('    - Request headers:', error.config?.headers);
      } else {
        console.log('\n  请求配置错误');
      }
    } else {
      console.log('错误信息:', error.message);
      console.log('错误堆栈:', error.stack);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// 运行测试
testDeepSeekAPI()
  .then(() => {
    console.log('\n测试完成');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n测试异常:', err);
    process.exit(1);
  });
