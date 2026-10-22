'use strict';
// npm run guide：从栏目配置和文章 Front-matter 重建学习路线，不维护两套标题。
const fs=require('node:fs');
const path=require('node:path');
const yaml=require('js-yaml');
const root=path.resolve(__dirname,'..');
const modules=yaml.load(fs.readFileSync(path.join(root,'source/_data/learning.yml'),'utf8'));
let count=0;
const parts=modules.map((module,index)=>{
  const rows=module.posts.map((slug,i)=>{
    const raw=fs.readFileSync(path.join(root,'source/_posts',slug+'.md'),'utf8');
    const meta=yaml.load(raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    if(!meta.categories.includes(module.name))throw Error(slug+' 分类与路线不一致');
    count++;
    return `${i+1}. [${meta.title}](/posts/${slug}/)`;
  });
  return `## ${String(index+1).padStart(2,'0')} / ${module.name}\n\n${module.description}\n\n${rows.join('\n')}`;
});
const intro=`---\ntitle: 学习路线\ndate: 2026-10-01 08:00:00\nupdated: 2026-10-22 10:00:00\ndescription: ${modules.length} 大学习模块、${count} 篇教程，涵盖技术、办公与信用体系建设，按顺序阅读并实践。\n---\n\n## 先选一个小目标\n\n当前共有 ${count} 篇教程。每篇都包含学习目标、基础知识、步骤、案例、常见问题与总结。先阅读目标和环境要求，再在自己的实验文件或练习库操作，保留原始数据。\n\nSQL 以 MySQL 8.4 为基准，进阶系列先从表结构教程下载统一样例脚本。Office 以 Windows 桌面版 Microsoft 365／Office 2024 为基准；XLOOKUP 等功能会注明版本差异，不把 WPS、Mac 或网页版视为完全相同的界面。\n\n`;
const ending='\n\n## 学习政策文章时怎样核对依据\n\n信用体系建设栏目包含国家依据、原件图片和来源链接。先确认文件版本、生效时间、适用主体与行业；创城的具体测评要求应核对本地当前正式文件。生活案例和自拟表格用于学习，不是官方认定结论或法定表单。\n\n## 每次实验后的三个问题\n\n我改了什么？看到了什么证据？怎样恢复到实验前？记录这三个答案，比只收藏文章更有用。\n\n教程中的现象是样例预期；除非明确说明，本站没有在你的电脑上执行数据库和 Office 操作。\n';
fs.writeFileSync(path.join(root,'source/guide/index.md'),intro+parts.join('\n\n')+ending);
console.log(`已更新 ${modules.length} 个模块、${count} 篇教程的学习路线。`);
