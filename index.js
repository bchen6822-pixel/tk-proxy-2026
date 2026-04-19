const express = require('express');
const puppeteer = require('puppeteer');
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

// 全局单例浏览器实例，避免重复启动
let browserInstance;
const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new'
    });
  }
  return browserInstance;
};

// 核心头像获取接口（真实浏览器模拟）
app.get('/get-avatar', async (req, res) => {
  const { videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ error: '请提供TikTok视频链接，格式：?videoUrl=https://www.tiktok.com/@xxx/video/123' });

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // 1. 模拟真实浏览器请求头
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    
    // 2. 访问视频页面，等待完全加载
    await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // 3. 等待头像元素加载（关键：直接在浏览器环境里取）
    const avatarUrl = await page.evaluate(() => {
      // 优先取作者头像
      const avatar = document.querySelector('img[data-e2e="avatar"]');
      if (avatar) return avatar.src;
      // 备用：取og:image
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) return ogImage.content;
      return null;
    });

    if (!avatarUrl) {
      return res.status(404).json({ error: '未找到头像地址' });
    }

    // 4. 返回头像URL
    res.json({
      success: true,
      avatarUrl: avatarUrl
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '获取失败', message: error.message });
  } finally {
    if (page) await page.close();
  }
});

// 根路径健康检查
app.get('/', (req, res) => {
  res.send('✅ TikTok 头像服务已就绪！使用 /get-avatar?videoUrl=链接 接口获取头像');
});

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
});
