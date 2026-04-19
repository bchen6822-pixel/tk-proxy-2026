const express = require('express');
const request = require('request');
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

// 核心代理接口
app.get('/api/*', (req, res) => {
  // 拼接 TikTok 目标地址
  const targetUrl = `https://www.tiktok.com${req.originalUrl}`;
  
  // 模拟真实浏览器请求头，绕过反爬
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://www.tiktok.com/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'TE': 'Trailers'
  };

  // 发起请求并跟随重定向
  request({
    url: targetUrl,
    headers: headers,
    followAllRedirects: true,
    timeout: 20000, // 延长超时时间到20秒
    gzip: true // 开启gzip解压
  }, (error, response, body) => {
    if (error) {
      return res.status(500).json({ error: 'Proxy request failed', message: error.message });
    }
    // 直接返回 TikTok 的响应
    res.status(response.statusCode).send(body);
  });
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('✅ TikTok Proxy Ready! Service is running.');
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
