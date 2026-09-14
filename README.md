# Project Notes

一个以项目展示和技术写作为核心的静态博客，使用 Astro + Markdown/MDX 构建，可免费部署到 Cloudflare Pages。

## 本地开发

需要 Node.js 22.12 或更高版本（推荐使用当前 LTS）。

```bash
npm install
npm run dev
```

打开终端提示的本地地址即可预览。

## 创建项目文档

项目采用“内容、配置、图片”分离的多项目结构：

```text
src/content/project-docs/<project-slug>/all-markdown.md
src/data/project-docs/projects/<project-slug>.ts
public/images/projects/<project-slug>/
```

项目配置会被自动发现。首页卡片、项目列表、章节路由、完整项目目录、文章目录、上下章导航、标签和 RSS 都从配置生成，不需要逐个修改页面。

完整格式和配置模板见 [`src/data/project-docs/README.md`](src/data/project-docs/README.md)。

## 常用命令

```bash
npm run dev       # 本地开发
npm run check     # Astro 类型和内容检查
npm run build     # 生产构建，同时生成 Pagefind 索引
npm run preview   # 预览生产构建
```

## Cloudflare Pages 部署

首次部署需要在 Cloudflare 控制台连接 GitHub 仓库。构建配置如下：

```text
Framework preset: Astro
Build command: npm run build
Output directory: dist
Node version: 22
```

部署成功后会得到 `https://项目名.pages.dev` 地址。之后提交到 GitHub 的更新会自动触发构建和发布。

## 可选服务

复制 `.env.example` 为 `.env`，按需配置：

- `PUBLIC_SITE_URL`：网站正式地址；没有自定义域名时可使用 pages.dev 地址。
- `PUBLIC_GISCUS_*`：启用基于 GitHub Discussions 的 Giscus 评论。
- `PUBLIC_CF_ANALYTICS_TOKEN`：启用 Cloudflare Web Analytics。

所有可选服务未配置时，网站仍可正常构建和阅读。

## 项目结构

```text
src/content/blog/                 独立博客文章（可选）
src/content/project-docs/         每个项目的标准化 Markdown
src/data/project-docs/projects/   每个项目一份独立配置
src/data/project-docs/registry.ts 多项目解析与自动注册
src/components/                   可复用 UI 组件
src/layouts/                      页面布局
src/pages/                        页面和路由
src/styles/                       全局样式
public/images/projects/           按项目隔离的图片
```

## 图表和图片

源 HTML 中的 Mermaid 流程图会转换成 Markdown 的 `mermaid` 代码块，文章页面通过 `public/vendor/mermaid.min.js` 在浏览器端渲染。普通 `<img>` 图片会转为 Markdown 图片，并放到 `public/images/edurag/`。

## 许可证

内容版权归作者所有。代码部分可根据需要替换为你的许可证。
