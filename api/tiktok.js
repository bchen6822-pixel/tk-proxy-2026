const request = require('request');

module.exports = (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 取出 path 和 query
    const { path, query } = req;
    let targetPath = path.replace('/api/tiktok', '') || '/';
    
    // 处理 aweme_id 参数
    if (query.aweme_id) {
      targetPath = `/api/item/detail?aweme_id=${query.aweme_id}`;
    }

    const targetUrl = `https://www.tiktok.com${targetPath}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tiktok.com/',
      'Accept': '*/*'
    };

    // 代理请求
    request({ url: targetUrl, headers, followAllRedirects: true, timeout: 15000 }, (error, response, body) => {
      if (error) return res.status(500).json({ error: 'Proxy Error', msg: error.message });
      res.status(response.statusCode).send(body);
    });
  } catch (e) {
    res.status(500).json({ error: 'Server Error', msg: e.message });
  }
};
