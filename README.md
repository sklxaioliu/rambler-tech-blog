# 个人技术知识库

面向计算机初学者的中文 Hexo 博客。副标题：**记录学习过程，分享技术知识**。

## 1. 项目位置与环境

所有博客文件都在 `D:\Codex项目\Rambler的博客系统\my-tech-blog`。不需要数据库、注册后台或付费服务。

开发时检查到：Node.js 24.22.0、npm 11.19.1、Git 2.56.0.windows.2。Hexo 8.1.2 要求 Node.js >=20.19.0；本项目建议使用 Node.js 24 LTS。Hexo CLI 4.3.2 安装在项目内，不需要全局安装。Butterfly 5.7.0 通过 npm 管理。

## 2. 启动博客

打开 PowerShell，执行：

```powershell
cd 'D:\Codex项目\Rambler的博客系统\my-tech-blog'
npm start
```

浏览器打开 <http://127.0.0.1:4000/>。终端保持运行，按 `Ctrl+C` 停止。`npm run server` 也可以启动。若提示端口占用，先检查是否已经有本项目预览在运行，不要随意结束未知进程。

换电脑或首次从 Git 拉取后，先执行 `npm ci` 安装锁定依赖。若 PowerShell 的执行策略阻止 `npm.ps1`，使用 `npm.cmd start`、`npm.cmd ci`，不必修改全局执行策略。

```powershell
npm run build
npm run verify
```

构建结果在 `public/`。不要直接编辑该目录，下次构建会覆盖它。遇到陈旧产物时，先停止服务，然后执行 `npm run clean`、`npm run build`，再启动。


## 本地网站打不开时

`127.0.0.1` 指的是这台电脑，不是已经发布的互联网网站。没有启动预览、关闭进程、电脑重启后，网址都会暂时打不开。现在可双击本目录的 `启动博客.cmd`，等待出现 running 提示后访问。该窗口需保持打开；不要重复启动多个服务。

也可以按上面的 npm start 启动。如果端口被其他程序占用，先核对错误提示和进程用途，不随意关闭陌生程序。博客依赖无需每次重新安装。需要不依赖本机进程的公开网址时，按部署章节发布静态站点。当前恢复服务的日志为 preview.log、preview-error.log，已被 Git 忽略。

## 3. 项目结构

```text
my-tech-blog/
  _config.yml               网站名称、域名、分类映射、插件配置
  _config.butterfly.yml     Butterfly 个性化配置
  source/
    _posts/                 40 篇 Markdown 教程（技术与办公）
    about/ guide/           关于与学习路线
    categories/ tags/       分类和标签入口
    css/custom.css          独立视觉样式
    js/custom.js            首页分类卡片
    img/                    原创 SVG 背景、头像、系列封面
  scripts/local-assets.js   发布使用中的本地前端库
  tools/verify.cjs          构建产物、文章与站内链接校验
  docs/                    设计说明、测试记录、部署示例
  scaffolds/               新文章模板
  package.json             命令与固定依赖版本
  package-lock.json        可复现的依赖锁文件
```

## 4. 新增文章

在项目目录执行，建议用英文文件名作为永久链接：

```powershell
npx hexo new post "my-first-note"
```

编辑 `source/_posts/my-first-note.md`，保留开头的 YAML 区域：

```yaml
---
title: 我的第一篇学习笔记
date: 2026-10-21 20:00:00
categories:
  - SQL 数据库
tags:
  - SQL
  - 学习笔记
description: 用一两句话说明读者能学到什么。
cover: /img/sql.svg
---
```

在第二条 `---` 后写 Markdown 正文。用 `##` 写二级标题即可生成目录；代码围栏后填写 `sql`、`powershell`、`bash`、`python` 等语言名即可高亮。图片可以放在 `source/img/`，正文写 `![图片说明](/img/文件名.png)`。

日期不能晚于当前时间，否则本项目的 `future: false` 会暂不发布。模板日期由 Hexo 自动填写，不必照抄上方日期。

预览服务通常会监听文章变化；改配置后建议停止再启动。校验脚本按 source/_data/learning.yml 核对文章与分类分页。新增文章后，将英文文件名加入对应模块的 posts 列表，运行 npm run guide 更新学习路线，再构建验证。首页文章数自动统计，不用改模板数字。

## 5. 修改名称、副标题和作者

编辑 `_config.yml` 中的 `title`、`subtitle`、`author` 与 `description`。首页的动态副标题来自 `_config.butterfly.yml` 的 `subtitle.sub` 列表。减少动态效果时的静态文案在 `source/css/custom.css` 最后一条媒体查询中。页脚 RSS 的 title、关于页等文字也可按需要一起更改。

## 6. 更换背景和头像

当前首页已改为个人门户：背景由 `source/css/portal.css` 的 `.portal-backdrop` 控制，默认使用本地 `source/img/portal-background.jpg`。要更换首页照片，可直接替换这个文件，或修改该 CSS 的图片路径。头像、个人标签、栏目卡片在 `layouts/portal.pug`；首页样式在 `source/css/portal.css`，由 `scripts/portal-layout.js` 注册，不修改 Butterfly 源文件。摄影许可与署名记录见 `docs/ASSETS.md`。

下面的主题配置控制其他页面的横幅和头像：

把自己的合法图片放入 `source/img/`，例如 `background.webp`，然后修改 `_config.butterfly.yml`：

```yaml
index_img: /img/background.webp
default_top_img: /img/background.webp
avatar:
  img: /img/your-avatar.png
```

首页推荐使用压缩后的横向图片；不要直接上传数十 MB 的原图。归档、分类、标签的背景还可分别改 `archive_img`、`category_img`、`tag_img`。文章封面在每篇 Front-matter 的 `cover` 中设置。

## 7. 修改分类与标签

文章开头的 `categories` 和 `tags` 决定归属。使用现有六个名称时请保持一致，避免“SQL数据库”和“SQL 数据库”变成两个分类。

`_config.yml` 的 `category_map` 固定了英文路径：SQL 数据库 → sql，虚拟机技术 → virtualization，网络协议 → networking，Excel 办公 → excel，Word 办公 → word，PPT 演示 → ppt。新增类别可添加映射。列表形式的多个 categories 可能形成层级；本文每篇只使用一个主分类。

首页栏目数据在 `source/_data/learning.yml`，`layouts/portal.pug` 自动渲染六个模块并统计篇数；最新文章按发布日期自动生成。`source/js/custom.js` 连接主题搜索、深浅模式和北京时间显示；`source/guide/index.md` 维护系列阅读顺序。

## 8. 功能说明

- 搜索：`hexo-generator-searchdb` 生成本地 `search.xml`，Butterfly 原生搜索界面，无第三方搜索账号。
- 目录、阅读进度、代码复制、深浅模式、上下篇、相关推荐：使用 Butterfly 原生实现。
- 图片放大：medium-zoom。可在 Ubuntu 教程中点击示意图体验。
- SEO：中文语言、独立 description、canonical、Open Graph、结构化数据、Sitemap。
- RSS：`/atom.xml`；站点地图：`/sitemap.xml`；404：`/404.html`。
- 前端库与图标从本站加载，未启用访问统计、评论或分享 SDK。构建配置里出现的未启用 CDN 地址不等于浏览器会请求它们。

## 9. 部署到互联网：推荐 GitHub Pages 根站点

以下步骤需要你自己的 GitHub 账号。本次只完成本地项目，没有创建仓库、上传源码或公开发布。

1. 在 GitHub 创建名为 `你的用户名.github.io` 的空仓库。
2. 把 `_config.yml` 的 `url` 改成 `https://你的用户名.github.io`，`root` 保持 `/`。这样 canonical、RSS 和 Sitemap 才会使用正式网址。
3. 将 `docs/pages-workflow.yml.example` 复制为 `.github/workflows/pages.yml`。示例只在你准备部署后启用，项目默认没有自动发布工作流。
4. 在本地运行 `npm run clean`、`npm run build`、`npm run verify`。
5. 本地已初始化 Git。先按自己的身份设置 Git 用户名/邮箱（如果尚未设置），再提交并推送。不要照抄示例姓名，不要把密码或 Token 写进文件。

```powershell
git add .
git commit -m "Build personal technical knowledge blog"
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

6. 仓库 Settings → Pages → Source 选择 GitHub Actions。授权与登录按 GitHub 官方界面完成。
7. 等待 Actions 中构建和部署成功，访问正式域名，检查文章、搜索、RSS、图片与 HTTPS。平台部署失败时查看对应日志，不把本地构建成功当成线上成功。

此项目自定义入口与资源目前使用根路径，**推荐使用 `用户名.github.io` 根站点或独立域名**。若要部署到 `/blog/` 这样的子路径，除了设置 Hexo 的 `url/root`，还需要把自定义 CSS/JS 引用、首页卡片及文章内根路径链接改为兼容该前缀的路径，并重新检查全站链接；不能只改一行 root 就认为适配完成。

官方指南：[Hexo GitHub Pages](https://hexo.io/docs/github-pages)。

## 10. 其他部署方式

Cloudflare Pages 可以连接源码仓库，构建命令设为 `npm run build`，输出目录设为 `public`，Node 主版本使用 24。如果仓库根就是本项目，项目根目录留空；若把整个工作区推送成仓库，根目录应设置为 `my-tech-blog`。上线前同样修改 url 为实际访问域名，并重新构建。

也可以把 `public/` 的内容上传到自己的静态服务器站点目录，并配置 HTTPS、404 与缓存。不要上传 `.git/`、`node_modules/` 或其他本地配置。正式部署不使用 `hexo server` 作为公网服务。

官方指南：[Cloudflare Pages / Hexo](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hexo-site/)。

## 11. 持续维护

提交源码和锁文件，忽略 node_modules、public 与日志。已初始化 main 分支并暂存首发文件；由于本机没有配置 Git 作者姓名与邮箱，未冒用身份创建首个提交。请按自己的身份设置后运行上文的 commit 命令。定期先备份再更新：查看版本发布说明，在分支中升级，构建并核验后合并。不要直接改 `node_modules/hexo-theme-butterfly`，否则重新安装会丢失改动。

`npm audit` 在本次联网检查中报告 11 项传递依赖问题（9 high、2 moderate），涉及 Hexo 构建链中的 braces、sprintf-js 及其依赖者；当前报告没有合理的同代修复，force 建议会降级核心到不适合本项目的旧版，未采用。静态发布产物不包含 Node 构建服务；仍应只对可信文章和配置运行构建，关注上游修复。离线安装输出的“0 vulnerabilities”不能替代联网审计。详细范围见 `docs/TEST-REPORT.md`。

所有安装与网络实验教程均为原创教学内容与预期现象说明；没有声称在本机执行其中的 MySQL、VMware、Windows/Ubuntu 安装或网络实验。

本次教程细化与透明内页维护说明见 [更新说明](docs/READING-REDESIGN-2026-10-22.md)。新增文章建议沿用：学习目标 → 生活例子 → 基础概念 → 操作步骤与原因 → 实例 → 排错 → 练习与答案 → 总结与下一篇。内页样式位于 source/css/interior.css，分类模板位于 layouts/collection.pug。

信用体系建设栏目已加入，详见 [政策来源与维护说明](docs/CREDIT-CONTENT-2026-10-22.md)。国家依据图来自官方 PDF 原页，新增政策文章时应核对版本、生效时间、适用范围和原文链接。
