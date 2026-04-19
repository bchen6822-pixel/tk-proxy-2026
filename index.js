const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// 跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('✅ TikTok Avatar API Ready');
});

// 直接用用户名拿头像（不需要视频）
app.get('/get-avatar', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'need username' });
  }

  try {
    // 直接请求用户主页
    const url = `https://www.tiktok.com/@${username}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    // 从页面里抓头像（不管有没有视频都存在）
    const avatarMatch = data.match(/"avatarThumb":"(.*?)"/);
    const nicknameMatch = data.match(/"nickname":"(.*?)"/);
    const uniqueIdMatch = data.match(/"uniqueId":"(.*?)"/);

    if (avatarMatch && avatarMatch[1]) {
      let avatar = avatarMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
      return res.json({
        success: true,
        avatarUrl: avatar,
        nickname: nicknameMatch ? nicknameMatch[1] : username,
        uniqueId: uniqueIdMatch ? uniqueIdMatch[1] : username
      });
    }

    throw new Error('no avatar');
  } catch (e) {
    res.status(404).json({ error: 'failed' });
  }
});

// 保活
setInterval(() => {
  axios.get('https://tk-proxy-2026.onrender.com').catch(() => {});
}, 4 * 60 * 1000);

app.listen(port, () => {
  console.log(`Running on ${port}`);
});
