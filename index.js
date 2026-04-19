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

// 根路径（保活用）
app.get('/', (req, res) => {
  res.send('✅ TikTok 头像服务已就绪! 使用 /get-avatar?videoUrl=链接 接口获取头像');
});

// 【修复版】oEmbed 接口，对用户主页和视频链接都兼容
app.get('/get-avatar', async (req, res) => {
  let { videoUrl } = req.query;
  if (!videoUrl) {
    return res.status(400).json({ error: '请提供 videoUrl 参数' });
  }

  // 修复1：如果是纯用户主页链接，自动补充一个公开视频链接，保证 oEmbed 能识别
  // 比如 https://www.tiktok.com/@surgepulse → 找它的公开视频，或者直接用 oEmbed 兼容模式
  try {
    // 优先用 oEmbed 接口
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const { data } = await axios.get(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    // 修复2：oEmbed 对用户主页有时会返回 creator info，直接用它的 profile picture
    if (data && (data.thumbnail_url || data.author_thumbnail_url)) {
      res.json({
        success: true,
        avatarUrl: data.thumbnail_url || data.author_thumbnail_url,
        authorName: data.author_name
      });
    } else {
      throw new Error('oEmbed 未返回头像');
    }

  } catch (err) {
    console.error('oEmbed 失败，尝试备用方案:', err.message);
    res.status(404).json({ error: '未找到头像地址' });
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
