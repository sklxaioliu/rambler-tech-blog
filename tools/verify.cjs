'use strict';
// 对真实构建产物做完整性与本地链接检查；不代替浏览器交互测试。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
const pub = path.join(root, 'public');
const config = yaml.load(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
if (process.argv.includes('--pages')) Object.assign(config, yaml.load(fs.readFileSync(path.join(root, '_config.pages.yml'), 'utf8')));
const siteUrl = config.url;
const siteRoot = config.root || '/';
const siteOrigin = new URL(siteUrl).origin;
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(pub);
const modules = yaml.load(fs.readFileSync(path.join(root, 'source/_data/learning.yml'), 'utf8'));
const expectedPosts = modules.reduce((sum, module) => sum + module.posts.length, 0);
const home = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
assert.ok(home.includes('id="portal-home"'), '首页门户视图未注册');
for (const route of [...modules.map(m => 'categories/' + m.slug + '/'), 'guide/', 'archives/', 'tags/']) {
  assert.ok(home.includes(`href="${siteRoot}${route}"`), `首页缺少入口 ${route}`);
}
assert.ok(fs.existsSync(path.join(pub, 'img/portal-background.jpg')), '用户背景图片未发布');
const posts = fs.readdirSync(path.join(root, 'source/_posts')).filter(f => f.endsWith('.md'));
assert.equal(posts.length, expectedPosts, '文章数与学习路线不一致');
for (const m of modules) for (const slug of m.posts) assert.ok(posts.includes(slug + '.md'), '缺少路线文章 ' + slug);
for (const file of posts) {
  const md = fs.readFileSync(path.join(root, 'source/_posts', file), 'utf8');
  for (const section of ['先用一个例子理解', '练习与参考答案', '学习目标', '基础知识', '操作步骤', '实际应用', '常见问题', '知识总结', '下一篇教程']) {
    assert.ok(md.includes('## ' + section), `${file} 缺少 ${section}`);
  }
  const policyArticle = /categories: \[信用体系建设\]/.test(md);
  if (!policyArticle) assert.ok(md.includes('```'), `${file} 缺少代码示例`);
  else assert.ok(md.includes('## 官方依据') && md.includes('/img/policy/'), `${file} 缺少依据或配图`);
  assert.ok(md.length > 1300, `${file} 内容过短`);
  const htmlPath = path.join(pub, 'posts', file.replace(/\.md$/, ''), 'index.html');
  assert.ok(fs.existsSync(htmlPath), `${file} 没有生成网页`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="card-toc"'), `${file} 缺少目录`);
  if (!policyArticle) assert.ok(html.includes('figure class="highlight'), `${file} 缺少高亮代码`);
  assert.ok(html.includes('rel="canonical"'), `${file} 缺少 canonical`);
}
for (const module of modules) {
  const pages = walk(path.join(pub, 'categories', module.slug)).filter(f => f.endsWith('.html'));
  let count = 0;
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    count += (html.match(/class="[^"]*\barticle-sort-item-title\b[^"]*"/g) || []).length;
  }
  assert.equal(count, module.posts.length, module.name + ' 分页文章数不符');
}
const search = fs.readFileSync(path.join(pub, 'search.xml'), 'utf8');
assert.equal((search.match(/<entry>/g) || []).length, posts.length, '搜索索引数量错误');
for (const file of ['atom.xml', 'sitemap.xml', '404.html', 'guide/index.html', 'about/index.html']) assert.ok(fs.existsSync(path.join(pub, file)));
let checked = 0;
const broken = [];
const ids = new Map();
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
    if (/^(https?:)?\/\//.test(raw) && !raw.startsWith('http://localhost:4000/') && !(siteUrl && raw.startsWith(siteUrl + '/'))) continue;
    if (/^(data:|mailto:|tel:|javascript:)/.test(raw)) continue;
    const url = new URL(raw, siteOrigin + siteRoot + path.relative(pub, file).replaceAll('\\', '/'));
    if (url.origin !== 'http://localhost:4000' && url.origin !== siteOrigin) continue;
    assert.ok(url.pathname.startsWith(siteRoot), `${file} 链接遗漏部署子目录：${raw}`);
    let dest = path.join(pub, decodeURIComponent(url.pathname.slice(siteRoot.length)));
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) dest = path.join(dest, 'index.html');
    checked++;
    if (!fs.existsSync(dest)) {broken.push(`${path.relative(pub, file)} -> ${raw}`); continue;}
    if (url.hash && dest.endsWith('.html')) {
      if (!ids.has(dest)) ids.set(dest, new Set([...fs.readFileSync(dest, 'utf8').matchAll(/id="([^"]+)"/g)].map(m => m[1])));
      if (!ids.get(dest).has(decodeURIComponent(url.hash.slice(1)))) broken.push(`${path.relative(pub, file)} -> ${raw} (锚点不存在)`);
    }
  }
}
assert.deepEqual(broken, [], '发现失效的本地链接');
console.log(`通过：${posts.length} 篇教程、${modules.length} 个分类、搜索索引、SEO 元数据、RSS、Sitemap；检查 ${checked} 个本地链接/资源引用，无失效项。`);
