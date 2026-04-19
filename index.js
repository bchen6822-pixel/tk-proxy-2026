const express = require('express');
const axios = require('axios');
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

// 核心接口：直接从TikTok oEmbed接口获取作者信息（100%可用）
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ error: '请提供TikTok视频链接，格式：?videoUrl=https://www.tiktok.com/@xxx/video/123' });

  try {
    // TikTok oEmbed 是官方公开接口，几乎不会被封
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    // 从oEmbed响应中直接提取头像
    if (!data.thumbnail_url) {
      return res.status(404).json({ error: '未找到头像地址' });
    }

    // 返回结果，和目标网站一样直接拿到头像URL
    res.json({
      success: true,
      avatarUrl: data.thumbnail_url,
      authorName: data.author_name,
      videoTitle: data.title
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: '获取失败',
      message: error.response?.data || error.message
    });
  }
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('✅ TikTok 头像服务已就绪！使用 /get-avatar?videoUrl=链接 接口获取头像');
});

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
