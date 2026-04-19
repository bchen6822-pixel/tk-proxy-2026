const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio'); // 用于解析网页
const app = express();
const port = process.env.PORT || 10000; // 注意端口号！

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
  res.send('✅ TikTok 头像服务已就绪!');
});

// 核心接口：从用户主页直接抓取头像
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: '请提供 videoUrl 参数' });
  }

  try {
    // 1. 直接请求用户主页
    const { data: html } = await axios.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    // 2. 解析 HTML，从 meta 标签中提取头像和用户名
    const $ = cheerio.load(html);
    const avatarUrl = $('meta[property="og:image"]').attr('content');
    const authorName = $('meta[property="og:title"]').attr('content')?.split(' ')[0] || '';

    if (avatarUrl) {
      res.json({
        success: true,
        avatarUrl: avatarUrl,
        authorName: authorName
      });
    } else {
      throw new Error('未找到头像地址');
    }

  } catch (err) {
    console.error(err);
    res.status(404).json({ error: '未找到头像地址' });
  }
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
