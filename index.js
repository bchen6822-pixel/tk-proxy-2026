const express = require('express');
const request = require('request');
const app = express();
const port = process.env.PORT || 3000;

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 代理接口
app.get('/api/*', (req, res) => {
  const targetUrl = `https://www.tiktok.com${req.originalUrl}`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  request({
    url: targetUrl,
    headers: headers,
    followAllRedirects: true,
    timeout: 15000
  }, (error, response, body) => {
    if (error) {
      return res.status(500).json({ error: 'Proxy failed', message: error.message });
    }
    res.status(response.statusCode).send(body);
  });
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('TikTok Proxy Ready!');
});

app.listen(port, () => {
  console.log(`Proxy running on port ${port}`);
});
