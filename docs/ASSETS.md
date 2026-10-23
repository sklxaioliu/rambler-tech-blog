# 素材来源

## 工作经历配图（2026-10-23）

用户随后明确要求“全部放进去并进行说明”。已逐图检查旧文共 50 个图片引用：聚水潭 31 个、优层智能 19 个。49 个文件可用，迁移后的网页版本在 `source/img/work/gallery/`，保持画面内容与比例，按 EXIF 方向显示，最长边不超过 1600，JPEG 质量 82，用于降低页面传输体积。原文件仍保留在用户的旧公开仓库。

说明、原始文件名、顺序与尺寸由 `source/_data/work-galleries.json` 维护；运行 `node tools/update-work-galleries.cjs` 更新两篇文章的相册。`images/时间4.jpg` 在旧仓库缺失，2026-10-23 核对其 raw 地址返回 404，GitHub 按该路径查询提交记录为空。按用户后续要求，缺失文件直接略去，不显示缺图卡片或提示，也不使用替代照片。

本次已包含用户要求的生活、培训、办公室与项目现场照片。以下“两张外景”描述为第一次整理时的范围，已由这次完整相册扩充。

用户要求将其公开旧博客的聚水潭、优层智能模块整理并发布。选用原文公开的两张外景照片，原样复制，保留来源：

- `source/img/work/jushuitan-day.jpg` ← `sklxaioliu/sklxaioliu.github.io` 的 `images/jushuitanday.jpg`。
- `source/img/work/youceng-site.jpg` ← 同仓库 `images/yc4.jpg`。

只迁移上述外景，不迁移培训资料、客户系统界面或生产记录。`source/img/work-experience.svg` 为本项目新增原创栏目图。

## 当前个人头像

用户于 2026-10-21 提供黑白人物照片，原文件名 `codex-clipboard-4b296d72-5e77-44fe-9769-cabd8e81d72b.jpg`，已复制至 `source/img/avatar.jpg`。首页和主题侧栏统一读取 `_config.butterfly.yml` 的 `avatar.img`；圆形显示通过 CSS 实现，未修改图片文件内容。该照片不属于本项目原创素材。

## 当前首页背景

用户于 2026-10-21 指定使用 `E:\ZhuoMian\img_2001618399.jpg`，已复制到 `source/img/portal-background.jpg`，保留原图。该漫画拼贴背景为用户提供素材，不纳入本站原创图形或文章 CC BY-NC-SA 许可。首页 CSS 以 center/cover 显示，通过独立遮罩提高文字可读性，没有修改图片内容。

## 先前候选背景（当前未使用）

首页背景 `source/img/portal-background.webp` 摄影作者为 Grace Semillano（Unsplash：grasyano_）。

- 原始页面：https://unsplash.com/photos/a-lake-with-a-mountain-in-the-background-and-stars-in-the-sky-EQOvAwM6JQ4
- 下载地址：https://images.unsplash.com/photo-1739970907786-d9fa4d2d40ef?auto=format&fit=crop&w=2400&q=82&fm=webp
- 使用许可：https://unsplash.com/license
- 获取并核对日期：2026-10-21

页面标注为免费 Unsplash License 图片，作为网站背景使用，页脚保留摄影署名。照片不纳入本站文章 CC BY-NC-SA 许可。

头像、原山峦 SVG 与三系列封面均为项目原创；首页学习地图为原创内联 SVG。不使用参考站的专有图片、头像、代码或文章。
