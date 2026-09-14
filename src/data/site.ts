export const site = {
  name: 'Project Notes',
  shortName: 'PN',
  description: '记录项目实践、工程思考与持续学习的个人技术博客。',
  author: 'sasha',
  role: '独立开发者 · 技术探索者',
  url: import.meta.env.PUBLIC_SITE_URL || 'https://project-blog.pages.dev',
  email: '13679201189@163.com',
  social: {
    github: 'https://github.com/sasha',
    x: '',
    linkedin: '',
  },
};

export type SiteConfig = typeof site;
