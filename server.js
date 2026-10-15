/**
 * Super Poopoo Radar - Local Server & Live API Proxy
 * Forwards real requests directly to coordinates-api.pokemongopro.com
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const API_HOST = 'coordinates-api.pokemongopro.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function proxyPost(targetPath, postBody) {
  return new Promise((resolve, reject) => {
    const postData = typeof postBody === 'string' ? postBody : JSON.stringify(postBody);
    const req = https.request({
      hostname: API_HOST,
      path: targetPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://pogocoordinates.com',
        'Referer': 'https://pogocoordinates.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function proxyGet(targetPath) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: API_HOST,
      path: targetPath,
      headers: {
        'Origin': 'https://pogocoordinates.com',
        'Referer': 'https://pogocoordinates.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  const reqPath = urlParts[0];

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Live Search API Proxy Route
  if (reqPath === '/api/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apiRes = await proxyPost('/search', payload);
        res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
        res.end(apiRes.data);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2. Live Reveal API Proxy Route
  if (reqPath.startsWith('/api/reveal/') && req.method === 'GET') {
    const code = reqPath.replace('/api/reveal/', '');
    try {
      const apiRes = await proxyGet('/reveal/' + encodeURIComponent(code));
      res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
      res.end(apiRes.data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Static File Server
  let staticFile = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(PUBLIC_DIR, staticFile);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('================================================================');
  console.log('  ⚡ Super Poopoo Radar - 即時真實數據代理伺服器已啟動！');
  console.log('================================================================');
  console.log(`💻 筆電端訪問： http://localhost:${PORT}`);
  console.log(`📱 手機端訪問： http://${localIp}:${PORT}`);
  console.log('----------------------------------------------------------------');
  console.log('✅ 所有查詢均即時穿透至 Pogocoordinates 官方伺服器，數據 100% 同步！');
  console.log('================================================================');
});
