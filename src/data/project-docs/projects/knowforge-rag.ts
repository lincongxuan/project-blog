import type { ProjectDocumentConfig } from '../types';

export const knowForgeRagProject: ProjectDocumentConfig = {
  slug: 'knowforge-rag',
  name: 'KnowForge RAG',
  description: 'KnowForge RAG 完整项目实践。',
  cardDescription:
    '围绕企业级 RAG 系统，从检索、生成、知识库治理到测试、观测和容器交付形成的完整项目实践。',
  kind: 'Enterprise RAG Project',
  status: 'active',
  statusLabel: '持续更新',
  tags: ['KnowForge', 'RAG', '工程实践'],
  order: 10,
  recent: true,
  contentFile: 'src/content/project-docs/knowforge-rag/all-markdown.md',
  legacyBlogRoutes: true,
  groups: [
    {
      slug: 'foundations',
      title: '第一阶段：基础概念',
      eyebrow: 'Phase 01',
      chapters: [
        {
          sourceId: '01-project-overview',
          navLabel: '01',
          title: '项目概述与 Docker 环境搭建',
          intro:
            '从可运行的工程全貌切入，说明 RAG 的核心链路、KnowForge RAG 的系统边界与技术栈，并完成 Docker Compose 本地环境的启动验证。',
        },
        {
          sourceId: '02-rag-fundamentals',
          navLabel: '02',
          title: 'RAG 核心概念深入',
          intro:
            '聚焦 Embedding、向量相似度、Dense 与 Sparse 检索以及 Reranker，建立混合检索所依赖的数学直觉和工程判断依据。',
        },
      ],
    },
    {
      slug: 'core-rag',
      title: '第二阶段：核心 RAG 链路',
      eyebrow: 'Phase 02',
      chapters: [
        {
          sourceId: '03-langchain-ecosystem',
          navLabel: '03',
          title: 'LangChain 生态系统',
          intro:
            '梳理 LangChain 组件在 KnowForge RAG 中的实际职责，明确 Runnable、Prompt、消息、解析器及历史记录与业务编排之间的边界。',
        },
        {
          sourceId: '04-milvus-index-and-operations',
          navLabel: '04',
          title: 'Milvus 索引机制与基本操作',
          intro:
            '从服务化向量数据库的选型出发，展开 Milvus 的数据模型、索引机制、检索参数与基础操作，为后续混合检索链路建立可靠的数据底座。',
        },
        {
          sourceId: '04-5-vibe-coding-rag-practice',
          navLabel: '',
          title: '第二阶段实践：Vibe Coding 实践（简易混合检索 RAG）',
          intro:
            '以可运行的简易混合检索 RAG 为目标，使用 Codex 推进需求约束、代码实现、验证与修正，串联 Dense、Sparse、HNSW 和 Milvus 等核心能力。',
        },
        {
          sourceId: '05-intent-classification',
          navLabel: '05',
          title: '意图分类',
          intro:
            '构建查询入口的分层决策机制，通过规则候选、BERT 模型增强、决策网关仲裁和知识查询兜底，将用户请求稳定地路由到正确链路。',
        },
        {
          sourceId: '06-retrieval-strategy',
          navLabel: '06',
          title: '检索策略与动态计划',
          intro:
            '将入口阶段产生的 IntentResult 转换为可执行的 RetrievalPlan，集中定义召回通道、过滤边界、候选规模和重排策略。',
        },
        {
          sourceId: '07-query-rewrite-variants',
          navLabel: '07',
          title: '查询改写与变体生成',
          intro:
            '处理多轮对话中的省略与指代，并通过受控的查询变体扩大召回覆盖范围，同时避免改写偏离用户原始意图。',
        },
        {
          sourceId: '08-milvus-hybrid-search',
          navLabel: '08',
          title: 'Milvus 混合检索',
          intro:
            '落地 Milvus Dense 与 Sparse Hybrid Search，覆盖数据前置检查、过滤表达式、结果融合、候选去重以及 Reranker 精排。',
        },
        {
          sourceId: '09-qaservice-orchestration',
          navLabel: '09',
          title: 'QAService 核心编排',
          intro:
            '以 QAService 作为应用服务门面，组织查询准备、检索和流式生成的调用顺序，让业务编排与底层能力保持清晰分工。',
        },
        {
          sourceId: '10-rag-pipeline',
          navLabel: '10',
          title: 'RAG Pipeline 主流程与 Prompt 生成',
          intro:
            '贯通 RAG Pipeline 的八个执行阶段，明确 FAQ 快速路径、上下文筛选与截断、Prompt Profile 选择、变量注入及答案引用增强。',
        },
      ],
    },
    {
      slug: 'web-services',
      title: '第三阶段：Web 服务基础设施',
      eyebrow: 'Phase 03',
      chapters: [
        {
          sourceId: '11-fastapi-async',
          navLabel: '11',
          title: 'FastAPI 与异步 Web 框架',
          intro:
            '围绕 KnowForge RAG 的 API 层说明异步请求模型、路由、中间件、依赖注入与 WebSocket 流式输出，呈现接口到核心服务的完整衔接。',
        },
        {
          sourceId: '12-app-entry-preflight',
          navLabel: '12',
          title: '应用入口与环境前置校验',
          intro:
            '拆解 FastAPI 应用启动过程，将关键依赖的前置校验与运行态容错分开，确保服务只在配置和基础设施满足条件时接收请求。',
        },
      ],
    },
    {
      slug: 'production',
      title: '第四阶段：治理与生产化',
      eyebrow: 'Phase 04',
      chapters: [
        {
          sourceId: '13-knowledge-governance',
          navLabel: '13',
          title: '知识库治理与离线入库发布',
          intro:
            '以一次完整的知识库发布为主线，串联数据边界、候选版本、增量入库、质量门禁和 active 切换，形成可追踪且可回滚的治理流程。',
        },
        {
          sourceId: '14-rag-quality',
          navLabel: '14',
          title: 'RAG 质量评测与 Bad Case 闭环',
          intro:
            '建立覆盖检索与答案的本地评测体系，通过固定样本、JSON 报告、质量门禁和 Bad Case 回流，让系统改动具备可比较的质量依据。',
        },
        {
          sourceId: '15-testing-system',
          navLabel: '15',
          title: '自动化测试与接口验收',
          intro:
            '按纯逻辑、核心服务、API 保护和交付验收划分测试层级，用稳定且可重复的检查覆盖 RAG 系统的关键工程边界。',
        },
        {
          sourceId: '16-observability-capacity',
          navLabel: '16',
          title: '线上可观测性、Trace 与容量治理',
          intro:
            '围绕日志、指标与 Trace 建立线上诊断链路，并将 LangSmith 适配、问题回流、容量评估、压测和监控告警纳入生产治理。',
        },
        {
          sourceId: '17-docker-delivery',
          navLabel: '17',
          title: 'Docker 交付与排障',
          intro:
            '从交付视角整合镜像、容器、Compose、网络、卷挂载、健康检查与环境变量，给出跨 Windows 和 Linux 的部署、验收及排障路径。',
        },
      ],
    },
    {
      slug: 'appendices',
      title: '技术附录',
      eyebrow: 'Appendices',
      chapters: [
        {
          sourceId: 'appendix-a-pydantic',
          navLabel: 'A',
          title: 'Pydantic 数据校验与 Settings 管理',
          intro:
            '集中说明 Pydantic 在请求模型、配置管理和结构化输出中的作用，用类型声明与运行时校验收紧跨模块数据边界。',
        },
        {
          sourceId: 'appendix-b-sha256-fingerprint',
          navLabel: 'B',
          title: 'SHA256 内容指纹与增量检测',
          intro:
            '解析 SHA256 内容摘要如何生成稳定指纹，并说明 IndexManifest 如何据此识别文件变化、跳过未变内容和组织增量入库。',
        },
        {
          sourceId: 'appendix-c-hnsw-index',
          navLabel: 'C',
          title: 'HNSW 图索引原理与参数调优',
          intro:
            '从高维向量暴力搜索的成本出发，拆解 HNSW 的分层小世界图、近似搜索过程，以及 M、efConstruction、ef 等参数的性能权衡。',
        },
        {
          sourceId: 'appendix-d-crossencoder-reranker',
          navLabel: 'D',
          title: 'CrossEncoder 重排器',
          intro:
            '说明 CrossEncoder 如何对召回候选进行联合语义评分，并结合 BGE Reranker 展开精度收益、推理成本、策略开关与失效场景。',
        },
        {
          sourceId: 'appendix-e-recursive-splitter',
          navLabel: 'E',
          title: 'RecursiveCharacterTextSplitter 递归切分算法',
          intro:
            '解析 RecursiveCharacterTextSplitter 的分隔符递归过程，并量化 chunk_size、chunk_overlap 与文档结构对切分完整性和检索质量的影响。',
        },
        {
          sourceId: 'appendix-f-embedding-models',
          navLabel: 'F',
          title: 'Embedding 模型选型与原理深入',
          intro:
            '从文本向量化的完整过程出发，对比维度、池化、归一化和 MTEB 指标，说明 BGE-M3 等模型在中文 RAG 中的选型与调优依据。',
        },
        {
          sourceId: 'appendix-g-chunking-strategy',
          navLabel: 'G',
          title: '文档切分策略：Parent-Child Chunking',
          intro:
            '围绕 Parent-Child Chunking 的召回粒度与上下文完整性，展开父子块生成、检索后展开、参数选择和不同文档类型的切分策略。',
        },
        {
          sourceId: 'appendix-h-tool-foundations',
          navLabel: 'H',
          title: '项目工具类开发详解',
          intro:
            '汇总跨模块复用的基础设施代码，覆盖时间与 JSON 读写、稳定哈希、元数据存储、Pydantic 模型、配置、日志和 MySQL 惰性连接。',
        },
      ],
    },
  ],
  sourceAliases: {
    '04-5-vibe-coding-rag-practice-greenfield': '04-5-vibe-coding-rag-practice',
    '11-prompt-engineering': '10-rag-pipeline',
    '12-fastapi-async': '11-fastapi-async',
    '13-app-entry-preflight': '12-app-entry-preflight',
    '13-kb-versioning': '13-knowledge-governance',
    '14-data-isolation': '13-knowledge-governance',
    '14-kb-versioning': '13-knowledge-governance',
    '15-data-isolation': '13-knowledge-governance',
    '15-ingestion-pipeline': '13-knowledge-governance',
    '16-ingestion-pipeline': '13-knowledge-governance',
    '16-quality-evaluation': '14-rag-quality',
    '17-quality-evaluation': '14-rag-quality',
    '17-testing-system': '15-testing-system',
    '18-testing-system': '15-testing-system',
    '18-observability-tracing': '16-observability-capacity',
    '19-observability-tracing': '16-observability-capacity',
    '19-docker-containerization': '17-docker-delivery',
    '20-docker-containerization': '17-docker-delivery',
    'course-outline': '01-project-overview',
    'offline-ingestion-teaching-notes': '13-knowledge-governance',
  },
  contentRules: {
    removeInstructionalSections: true,
    removeLeadingPrologue: true,
    chapterRules: [
      {
        type: 'condense-leading-content',
        sourceId: '13-knowledge-governance',
        title: '发布主线',
        contentStartPattern: /^>\s*\*\*版本来源约定/,
      },
      {
        type: 'condense-first-section',
        sourceId: '04-5-vibe-coding-rag-practice',
        title: '用 Codex 完成一个简易混合检索 RAG',
        replacementTitle: '开发流程',
        contentType: 'code',
      },
      ...['appendix-a-pydantic', 'appendix-d-crossencoder-reranker'].map((sourceId) => ({
        type: 'condense-first-section' as const,
        sourceId,
        title: '为什么需要本节',
        replacementTitle: '项目中的应用位置',
        contentType: 'table' as const,
      })),
      {
        type: 'condense-first-section',
        sourceId: 'appendix-f-embedding-models',
        title: '为什么需要本节',
        replacementTitle: '内容范围',
        contentType: 'table',
      },
      ...['appendix-b-sha256-fingerprint', 'appendix-c-hnsw-index'].map((sourceId) => ({
        type: 'remove-first-section' as const,
        sourceId,
        title: '为什么需要本节',
      })),
    ],
    textReplacements: [
      [/按离线入库总流程阅读本节/g, '离线入库总流程'],
      [/本章主线/g, '从路由决策到检索计划'],
      [/本章小结/g, '实现小结'],
      [/本节对应内容/g, '对应内容'],
      [/本节边界/g, '实现边界'],
      [/本节主链路/g, '实践主链路'],
      [/本节会用到的组件/g, '涉及的核心组件'],
      [/本节完成什么/g, '实践交付目标'],
      [/本节/g, '这一部分'],
      [/本讲/g, '当前阶段'],
      [/本章/g, '当前模块'],
      [/第\s*([0-9０-９、，和/]+)\s*讲(?:开始)?学习/g, '项目阶段 $1 展开'],
      [/第\s*([0-9０-９、，和/]+)\s*讲/g, '项目阶段 $1'],
      [/学完/g, '完成'],
      [/首次学习/g, '首次接触'],
      [/前面已经学习了/g, '前文已经梳理了'],
      [/适合学习底层机制/g, '适合分析底层机制'],
      [/适合学习和排障/g, '适合理解和排障'],
      [/学习增量入库/g, '分析增量入库'],
      [/学习型\s*sparse/g, '模型驱动的 sparse'],
      [/权重来自模型学习/g, '权重由模型训练获得'],
      [/模型学习治理/g, '模型训练治理'],
      [/自动学习/g, '自动训练'],
      [/学习、演示/g, '技术验证、演示'],
      [/项目阶段\s*([0-9０-９、，和/]+)学习/g, '项目阶段 $1 展开'],
      [/前面学过的/g, '前文梳理的'],
      [/学习者/g, '读者'],
      [/初学者/g, '刚接触 RAG 的开发者'],
      [/同学/g, '读者'],
      [/课程/g, '项目文档'],
      [/讲义/g, '项目文档'],
      [/教学/g, '说明'],
      [/讲解/g, '分析'],
      [/前置知识/g, '技术背景'],
      [/讲\s*02/g, '项目阶段 02'],
    ],
    codeReplacements: [
      [/字段名与讲义一致/g, '字段名与项目实现一致'],
      [/章节代码、讲义和项目边界检查/g, '章节代码、项目文档和项目边界检查'],
    ],
  },
};

export default knowForgeRagProject;
