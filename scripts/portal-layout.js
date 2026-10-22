'use strict';
const fs = require('node:fs');
const path = require('node:path');
// 运行时替换首页视图，不修改 npm 中的主题文件。
hexo.extend.filter.register('before_generate', function () {
  hexo.theme.setView('index.pug', fs.readFileSync(path.join(hexo.base_dir, 'layouts/portal.pug'), 'utf8'));
  hexo.theme.setView('category.pug', fs.readFileSync(path.join(hexo.base_dir, 'layouts/collection.pug'), 'utf8'));
});
