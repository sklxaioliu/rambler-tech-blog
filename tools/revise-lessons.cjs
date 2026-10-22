'use strict';
// 一次性编辑迁移：把逐篇撰写的例子、步骤解释和带答案练习写入 Markdown。
// 带标记的文章不会重复追加；日常维护仍直接编辑 source/_posts。
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'lesson-notes');
let count=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.cjs'))){
  for(const [slug,note] of Object.entries(require(path.join(dir,file)))){
    const target=path.join(__dirname,'../source/_posts',slug+'.md');
    let body=fs.readFileSync(target,'utf8');
    if(body.includes('<!-- beginner-revision-2026-10-22 -->'))continue;
    body=body.replace(/\r\n/g,'\n');
    if(/^updated:/m.test(body))body=body.replace(/^updated:.*$/m,'updated: 2026-10-22 11:00:00');
    else body=body.replace(/(date:[^\n]+\n)/,'$1updated: 2026-10-22 11:00:00\n');
    body=body.replace(/\n## 基础知识/, '\n<!-- beginner-revision-2026-10-22 -->\n\n## 先用一个例子理解\n\n'+note.example+'\n\n## 基础知识');
    const application=body.indexOf('\n## 实际应用');
    if(application<0)throw Error(slug+' 没有实际应用章节');
    body=body.slice(0,application)+'\n### 分步拆解：为什么这样操作\n\n'+note.walk+'\n'+body.slice(application);
    body=body.replace('\n## 知识总结','\n## 练习与参考答案\n\n'+note.practice+'\n\n## 知识总结');
    fs.writeFileSync(target,body);count++;
  }
}
console.log('已细化 '+count+' 篇教程。');
