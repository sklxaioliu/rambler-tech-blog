'use strict';
// 按 GitHub Pages 的子目录提供只读预览，便于在发布前发现路径问题。
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../public');
const base = yaml.load(fs.readFileSync(path.join(__dirname, '../_config.pages.yml'), 'utf8')).root;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.woff2':'font/woff2','.ttf':'font/ttf'};
http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/') {res.writeHead(302, {Location:base});res.end();return;}
    if (!url.pathname.startsWith(base)) {res.writeHead(404);res.end('Not found');return;}
    let file = path.resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
    if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file, 'index.html');
    if (!fs.existsSync(file)) {res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(400);res.end('Bad request');}
}).listen(4001, '127.0.0.1', () => console.log(`Pages 预览：http://127.0.0.1:4001${base}`));
