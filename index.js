const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// 跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 健康检查
app.get('/', (req, res) => {
  res.send('✅ 服务运行正常');
});

// 头像接口（和前端完全对应）
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: '请提供 videoUrl 参数' });
  }

  try {
    // 使用 oEmbed 接口，对用户主页和视频链接都有效
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    if (data && data.thumbnail_url) {
      res.json({
        success: true,
        avatarUrl: data.thumbnail_url,
        authorName: data.author_name
      });
    } else {
      res.status(404).json({ error: '未找到头像地址' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: '获取失败',
      message: err.message
    });
  }
});

// 自保活（防止 Render 休眠）
const SELF_URL = "https://tk-proxy-2026.onrender.com";
function keepAlive() {
  axios.get(SELF_URL, { timeout: 5000 }).catch(() => {});
}
setInterval(keepAlive, 4 * 60 * 1000);
keepAlive();

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
