const express = require('express');
const request = require('request-promise-native');
const app = express();
const port = process.env.PORT || 3000;

// 全局跨域处理
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 核心接口：直接从TikTok的API获取视频作者信息
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ error: '请提供TikTok视频链接，格式：?videoUrl=https://www.tiktok.com/@xxx/video/123' });

  try {
    // 1. 先获取视频的重定向URL，拿到真实ID
    const redirectRes = await request({
      url: videoUrl,
      followRedirect: true,
      resolveWithFullResponse: true,
      simple: false
    });
    const finalUrl = redirectRes.request.uri.href;
    const videoId = finalUrl.split('/').pop().split('?')[0];

    // 2. 调用TikTok的公开API获取视频数据
    const apiUrl = `https://www.tiktok.com/api/item/detail/?itemId=${videoId}`;
    const apiRes = await request({
      url: apiUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/'
      },
      json: true,
      timeout: 20000
    });

    // 3. 从API响应中提取头像地址
    if (!apiRes.itemInfo || !apiRes.itemInfo.itemStruct) {
      return res.status(404).json({ error: '未找到视频信息' });
    }

    const author = apiRes.itemInfo.itemStruct.author;
    const avatarUrl = author.avatarThumb || author.avatarMedium || author.avatarLarger;

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      authorName: author.uniqueId
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: '获取失败', message: error.message });
  }
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('✅ TikTok 头像服务已就绪！使用 /get-avatar?videoUrl=链接 接口获取头像');
});

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
