const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // 新增：用于解析网页获取头像
const app = express();
const port = process.env.PORT || 3000;

// 跨域配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 根路径
app.get('/', (req, res) => {
  res.send('✅ TikTok 头像服务已就绪! 使用 /get-avatar?videoUrl=链接 接口获取头像');
});

// 核心接口：双方案获取头像
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: '请提供 videoUrl 参数' });
  }

  try {
    // 方案1：尝试 oEmbed 接口（对视频链接有效）
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const oembedResp = await axios.get(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (oembedResp.data && oembedResp.data.thumbnail_url) {
      return res.json({
        success: true,
        avatarUrl: oembedResp.data.thumbnail_url,
        authorName: oembedResp.data.author_name
      });
    }
  } catch (err) {
    console.log('oEmbed 方案失败，尝试直接爬取:', err.message);
  }

  // 方案2：直接爬取用户主页，解析头像
  try {
    const pageResp = await axios.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(pageResp.data);
    // 从页面 meta 标签中获取头像
    const avatarUrl = $('meta[property="og:image"]').attr('content');
    const authorName = $('meta[property="og:title"]').attr('content')?.split(' ')[0] || '';

    if (avatarUrl) {
      return res.json({
        success: true,
        avatarUrl: avatarUrl,
        authorName: authorName
      });
    }
  } catch (err) {
    console.error('直接爬取方案也失败了:', err.message);
  }

  // 两种方案都失败
  return res.status(404).json({ error: '未找到头像地址' });
});

// 自保活
const SELF_URL = "https://tk-proxy-2026.onrender.com";
function keepAlive() {
  axios.get(SELF_URL, { timeout: 5000 }).catch(() => {});
}
setInterval(keepAlive, 4 * 60 * 1000);
keepAlive();

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
