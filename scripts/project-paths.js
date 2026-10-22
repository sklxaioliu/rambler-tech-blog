'use strict';
// Markdown 与自定义注入中的站内绝对地址，适配 Pages 项目子目录。
// 主题已经补过 root 的地址保持原样；外部链接和 // CDN 地址不处理。
hexo.extend.filter.register('after_render:html', function (html) {
  const root = hexo.config.root || '/';
  if (root === '/') return html;
  return html.replace(/\b(href|src|poster|data-src)=(['"])(\/(?!\/)[^'"\s]*)\2/g,
    (match, attr, quote, url) => url.startsWith(root)
      ? match : `${attr}=${quote}${root}${url.slice(1)}${quote}`);
});
