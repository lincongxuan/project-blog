export interface ProjectChapterDefinition {
  sourceId: string;
  navLabel: string;
  title: string;
  intro: string;
}

export interface ProjectGroupDefinition {
  slug: string;
  title: string;
  eyebrow: string;
  chapters: ProjectChapterDefinition[];
}

export interface CondenseFirstSectionRule {
  type: 'condense-first-section';
  sourceId: string;
  title: string;
  replacementTitle: string;
  contentType: 'code' | 'table';
}

export interface RemoveFirstSectionRule {
  type: 'remove-first-section';
  sourceId: string;
  title: string;
}

export interface CondenseLeadingContentRule {
  type: 'condense-leading-content';
  sourceId: string;
  title: string;
  contentStartPattern: RegExp;
}

export type ProjectChapterRule =
  CondenseFirstSectionRule | RemoveFirstSectionRule | CondenseLeadingContentRule;

export interface ProjectContentRules {
  removeInstructionalSections?: boolean;
  removeLeadingPrologue?: boolean;
  chapterRules?: ProjectChapterRule[];
  textReplacements?: Array<[RegExp, string]>;
  codeReplacements?: Array<[RegExp, string]>;
}

export interface ProjectDocumentConfig {
  slug: string;
  name: string;
  description: string;
  cardDescription: string;
  kind: string;
  status: 'active' | 'completed' | 'paused';
  statusLabel: string;
  tags: string[];
  order?: number;
  recent?: boolean;
  contentFile: string;
  groups: ProjectGroupDefinition[];
  sourceAliases?: Record<string, string>;
  contentRules?: ProjectContentRules;
  legacyBlogRoutes?: boolean;
}

export interface ProjectHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface ProjectLesson {
  id: string;
  sourcePath: string;
  sourceId: string;
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  body: string;
  html: string;
  headings: ProjectHeading[];
  route: string;
  projectSlug: string;
  projectName: string;
  projectRoute: string;
  groupSlug: string;
  groupTitle: string;
  lessonNumber: number;
  numberInGroup: number;
  navLabel: string;
}

export interface ProjectGroup {
  slug: string;
  title: string;
  eyebrow: string;
  lessons: ProjectLesson[];
}

export interface ProjectDocumentation {
  slug: string;
  name: string;
  description: string;
  cardDescription: string;
  kind: string;
  status: ProjectDocumentConfig['status'];
  statusLabel: string;
  tags: string[];
  recent: boolean;
  route: string;
  groups: ProjectGroup[];
  lessons: ProjectLesson[];
}

export interface LegacyProjectRedirect {
  path: string;
  target: string;
}
