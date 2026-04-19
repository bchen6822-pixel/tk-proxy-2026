const express = require('express');
const request = require('request');
const cheerio = require('cheerio'); // 用于解析HTML
const app = express();
const port = process.env.PORT || 3000;

// 全局跨域处理
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 1. 基础代理接口（兼容之前的API请求）
app.get('/api/*', (req, res) => {
  const targetUrl = `https://www.tiktok.com${req.originalUrl}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/'
  };
  request({ url: targetUrl, headers, followAllRedirects: true, timeout: 20000, gzip: true }, (error, response, body) => {
    if (error) return res.status(500).json({ error: 'Proxy failed', msg: error.message });
    res.status(response.statusCode).send(body);
  });
});

// 2. 新增：获取视频作者头像的专用接口
app.get('/get-avatar', (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ error: '请提供TikTok视频链接，格式：?videoUrl=https://www.tiktok.com/@xxx/video/12345' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/'
  };

  // 请求TikTok视频页面
  request({ url: videoUrl, headers, followAllRedirects: true, timeout: 20000, gzip: true }, (error, response, body) => {
    if (error) return res.status(500).json({ error: '请求失败', msg: error.message });
    if (response.statusCode !== 200) return res.status(500).json({ error: 'TikTok返回错误', status: response.statusCode });

    // 用cheerio解析HTML，提取头像
    const $ = cheerio.load(body);
    // TikTok页面里，头像通常在og:image或者作者信息的img标签里
    const avatarUrl = $('meta[property="og:image"]').attr('content') || 
                      $('img[data-e2e="avatar"]').attr('src') ||
                      $('div[data-e2e="user-avatar"] img').attr('src');

    if (!avatarUrl) return res.status(404).json({ error: '未找到头像地址' });

    // 返回头像URL
    res.json({
      success: true,
      avatarUrl: avatarUrl,
      proxyUrl: `${req.protocol}://${req.get('host')}/api?url=${encodeURIComponent(avatarUrl)}`
    });
  });
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('✅ TikTok Proxy Ready! 支持视频页面代理 + 头像解析');
});

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
