# GitHub Pages 发布说明

目标账号：sklxaioliu。独立公开仓库：rambler-tech-blog。

计划网站地址：https://sklxaioliu.github.io/rambler-tech-blog/ 。只有 GitHub Actions 部署成功后该地址才会生效；本文件不表示已经上线。

## 当前设计

- 保留原 blog-source 和 sklxaioliu.github.io 仓库及其自定义域名，不向它们推送。
- 本地开发：npm ci，npm start，访问 http://127.0.0.1:4000/ 。
- 生产构建：npm run build:pages；核验：npm run verify:pages。
- 本地模拟项目子目录：npm run preview:pages，访问 http://127.0.0.1:4001/rambler-tech-blog/ 。
- _config.pages.yml 单独保存线上地址，_config.yml 保留本地地址。
- scripts/project-paths.js 负责 Markdown 和自定义注入的子目录链接；背景 CSS 使用相对资源地址。
- .github/workflows/pages.yml 在 main 更新时安装锁定依赖、构建、验证并部署。只使用仓库自动生成的 GITHUB_TOKEN，不需要把个人 Token 写入源码。

## 首次发布

1. 完成图片等内容的公开授权确认。
2. 把本地 main 推送到该独立仓库，不使用强制推送。
3. 仓库 Settings → Pages → Build and deployment，将 Source 选为 GitHub Actions。
4. 查看 Actions 中 Publish blog to GitHub Pages。必要时在启用 Pages 后重新运行工作流。
5. 部署成功后，验证线上首页、七个分类、文章、搜索、背景、头像与官方 PDF。

源码不上传 node_modules、临时下载、预览日志、密码或凭据。图片与原件的来源和许可边界见 ASSETS.md、CREDIT-CONTENT-2026-10-22.md。
