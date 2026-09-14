# 新增项目文档

每个项目由三部分组成：一份标准化 Markdown、一个独立配置文件，以及可选的图片目录。页面、路由、目录、标签和 RSS 会从配置自动生成。

如果源文件已经是多个 Markdown，可以先运行只读整合命令：

```bash
npm run prepare:project -- --input "F:\documents\document-assistant" --output "src/content/project-docs/document-assistant/all-markdown.md" --name "Document Assistant" --tags "AI,TypeScript"
```

脚本不会修改输入目录。输出文件已存在时会停止；确认需要更新后再增加 `--force`。

## 目录约定

```text
src/content/project-docs/<project-slug>/all-markdown.md
src/data/project-docs/projects/<project-slug>.ts
public/images/projects/<project-slug>/
```

`project-slug` 只使用小写英文字母、数字和连字符，例如 `document-assistant`。

## 标准化 Markdown

整合文件中的每篇章节使用稳定的 `sourceId` 标记。配置中的 `sourceId` 必须和标记一致。

```markdown
<a id="doc-01-overview-md"></a>
# 项目概述

> 来源：`source/01-overview.md`
> 类型：项目文档
> description：项目概述
> pubDate：2026-09-14
> tags：TypeScript、Astro
> draft：否
> featured：否

## 背景

正文内容。
```

文档可以包含普通 Markdown 图片、表格、代码块和 Mermaid 代码块。图片放在 `public/images/projects/<project-slug>/`，引用时使用：

```markdown
![图片说明](/images/projects/<project-slug>/architecture.png)
```

## 项目配置模板

在 `projects` 目录新建 `<project-slug>.ts`。注册表会自动发现默认导出的配置，不需要修改页面组件。

```ts
import type { ProjectDocumentConfig } from '../types';

const project: ProjectDocumentConfig = {
  slug: 'document-assistant',
  name: 'Document Assistant',
  description: '项目开发文档。',
  cardDescription: '显示在首页和项目列表中的简介。',
  kind: 'AI Application',
  status: 'active',
  statusLabel: '持续更新',
  tags: ['AI', 'TypeScript'],
  order: 20,
  recent: true,
  contentFile: 'src/content/project-docs/document-assistant/all-markdown.md',
  groups: [
    {
      slug: 'foundation',
      title: '第一阶段：项目基础',
      eyebrow: 'Phase 01',
      chapters: [
        {
          sourceId: '01-overview',
          navLabel: '01',
          title: '项目概述',
          intro: '说明项目目标、系统边界和技术架构。',
        },
      ],
    },
  ],
};

export default project;
```

## 验证

```bash
npm run check
npm run build
npm run dev
```

重点检查项目卡片、左右目录、上下章导航、图片大小、放大查看、宽表格、代码块，以及浅色和深色主题。
