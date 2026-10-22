'use strict';
// Hexo 将必要的前端资源发布到本地，避免访问者依赖公共 CDN。
const fs = require('node:fs');
const path = require('node:path');
hexo.extend.generator.register('local-vendor-assets', function () {
  const root = hexo.base_dir;
  const assets = [
    ['@fortawesome/fontawesome-free/css/all.min.css', 'vendor/fontawesome/css/all.min.css'],
    ['typed.js/dist/typed.umd.js', 'vendor/typed/typed.umd.js'],
    ['medium-zoom/dist/medium-zoom.min.js', 'vendor/medium-zoom/medium-zoom.min.js']
  ];
  const fonts = path.join(root, 'node_modules/@fortawesome/fontawesome-free/webfonts');
  for (const file of fs.readdirSync(fonts)) {
    if (file.endsWith('.woff2')) assets.push([`@fortawesome/fontawesome-free/webfonts/${file}`, `vendor/fontawesome/webfonts/${file}`]);
  }
  return assets.map(([src, dest]) => ({path: dest, data: fs.readFileSync(path.join(root, 'node_modules', src))}));
});
