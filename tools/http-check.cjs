const fs = require('node:fs');
const routes = fs.readdirSync('source/_posts').filter(x=>x.endsWith('.md')).map(x=>'/posts/'+x.slice(0,-3)+'/');
routes.push('/', '/categories/sql/', '/categories/virtualization/', '/categories/networking/', '/categories/excel/', '/categories/word/', '/categories/ppt/', '/categories/credit/', '/categories/', '/tags/', '/archives/', '/guide/', '/about/', '/404.html', '/search.xml', '/sitemap.xml', '/atom.xml');
(async()=>{
  for (const route of routes) {
    const response = await fetch('http://127.0.0.1:4000'+route);
    if(response.status!==200) throw new Error(`${route}: ${response.status}`);
    if(!(await response.text()).length) throw new Error(`${route}: 空响应`);
  }
  console.log(`HTTP 验证通过：${routes.length} 个页面/索引均返回 200 与非空内容（含全部 ${routes.length - 17} 篇文章）。`);
})().catch(e=>{console.error(e);process.exitCode=1});
