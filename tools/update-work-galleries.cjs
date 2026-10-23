'use strict';
// 生成分组相册。说明与顺序集中维护在 source/_data/work-galleries.json。
const fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('source/_data/work-galleries.json','utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for(const entry of data){
 const available=entry.photos.filter(p=>!p.missing).length;
 let text=`<!-- work-gallery:start -->\n\n## 那些日子里的照片\n\n把这段时间的 ${available} 张照片放在一起，记录工作现场，也记录生活。每张照片下方附有说明，点击图片可以放大查看。\n\n`;
 for(const group of [...new Set(entry.photos.map(p=>p.group))]){
  text+=`### ${group}\n\n<div class="work-photo-grid">\n`;
  for(const p of entry.photos.filter(p=>p.group===group)){
   const n=String(p.index).padStart(2,'0');
   if(p.missing) text+=`<figure class="work-photo work-photo-missing"><div class="work-photo-placeholder">图片暂缺 · ${n}</div><figcaption><strong>${n} / ${esc(p.title)}</strong><span>${esc(p.caption)}</span></figcaption></figure>\n`;
   else text+=`<figure class="work-photo"><img src="${p.src}" alt="${esc(p.title)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async"><figcaption><strong>${n} / ${esc(p.title)}</strong><span>${esc(p.caption)}</span></figcaption></figure>\n`;
  }
  text+='</div>\n\n';
 }
 text+='<!-- work-gallery:end -->\n\n';
 const file=`source/_posts/${entry.post}.md`;
 let md=fs.readFileSync(file,'utf8');
 md=md.replace(/<!-- work-gallery:start -->[\s\S]*?<!-- work-gallery:end -->\s*/,'<!-- work-gallery:slot -->\n\n');
 md=md.replace(/!\[[^\]]*\]\(\/img\/work\/(?:jushuitan-day|youceng-site)\.jpg\)\s*/,'');
 md=md.includes('<!-- work-gallery:slot -->')?md.replace('<!-- work-gallery:slot -->',text):md+'\n\n'+text;
 md=md.replace('这里不搬运培训画面或内部工作细节，把重点放在当时的生活体验上。','完整相册中保留这些画面，并分别说明照片所记录的内容。');
 md=md.replace('也没有搬运客户界面、配置、条码记录等现场细节。','完整相册按原文顺序补入现场照片；画面中的参数和记录只用于说明当时的调试环境，不作为配置教程或验收结论。');
 fs.writeFileSync(file,md);
 console.log(`${entry.post}: ${available} photos, ${entry.expected-available} missing`);
}
