const express = require('express');
const axios = require('axios');
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
  res.send('✅ TikTok 头像服务已就绪!');
});

// 核心接口：获取头像
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: '请提供 videoUrl 参数' });
  }

  try {
    // 调用 TikTok oEmbed 接口
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    // 确保返回头像地址
    if (data.thumbnail_url || data.author_thumbnail_url) {
      res.json({
        success: true,
        avatarUrl: data.thumbnail_url || data.author_thumbnail_url,
        authorName: data.author_name
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
