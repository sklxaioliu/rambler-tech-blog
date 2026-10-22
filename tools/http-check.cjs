const fs = require('node:fs');
const base = (process.argv[2] || 'http://127.0.0.1:4000').replace(/\/$/, '');
const routes = fs.readdirSync('source/_posts').filter(x=>x.endsWith('.md')).map(x=>'/posts/'+x.slice(0,-3)+'/');
const postCount = routes.length;
const yaml = require('js-yaml');
const modules = yaml.load(fs.readFileSync('source/_data/learning.yml', 'utf8'));
routes.push('/', ...modules.map(m => '/categories/' + m.slug + '/'), '/categories/', '/tags/', '/archives/', '/guide/', '/about/', '/404.html', '/search.xml', '/sitemap.xml', '/atom.xml');
(async()=>{
  for (const route of routes) {
    const response = await fetch(base+route, {signal:AbortSignal.timeout(20000)});
    if(response.status!==200) throw new Error(`${route}: ${response.status}`);
    if (!response.url.startsWith(base + '/')) throw new Error(`${route}: 被重定向到 ${response.url}`);
    if(!(await response.text()).length) throw new Error(`${route}: 空响应`);
  }
  console.log(`HTTP 验证通过：${base}，${routes.length} 个页面/索引均返回 200 与非空内容（含全部 ${postCount} 篇文章）。`);
})().catch(e=>{console.error(e);process.exitCode=1});
