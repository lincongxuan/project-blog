import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import MarkdownIt, { type RendererRule } from 'markdown-it';
import markdownItCjkFriendly from 'markdown-it-cjk-friendly';
import type {
  LegacyProjectRedirect,
  ProjectChapterRule,
  ProjectDocumentConfig,
  ProjectDocumentation,
  ProjectGroup,
  ProjectHeading,
  ProjectLesson,
} from './types';

interface RawDocument {
  sourceId: string;
  sourcePath: string;
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  body: string;
}

interface RawSection {
  title: string;
  body: string;
  slug?: string;
}

const projectConfigModules = import.meta.glob<{ default: ProjectDocumentConfig }>(
  './projects/*.ts',
  {
    eager: true,
  },
);

export const projectDocumentConfigs = Object.entries(projectConfigModules)
  .map(([, module]) => module.default)
  .sort(
    (left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER),
  );

function slugify(value: string, fallback: string) {
  const slug = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function stripMarkdown(value: string) {
  return value
    .replace(/[`*_~]/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function splitIntoSections(body: string, fallbackTitle: string): RawSection[] {
  const sections: RawSection[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];
  let fence = '';

  const saveCurrent = () => {
    if (currentTitle)
      sections.push({ title: stripMarkdown(currentTitle), body: currentLines.join('\n').trim() });
  };

  for (const line of body.split('\n')) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = '';
    }
    const heading = !fence ? line.match(/^##\s+(.+?)\s*#*\s*$/) : null;
    if (heading) {
      saveCurrent();
      currentTitle = heading[1];
      currentLines = [];
    } else if (currentTitle) {
      currentLines.push(line);
    }
  }
  saveCurrent();
  return sections.length ? sections : [{ title: fallbackTitle, body: body.trim() }];
}

function assignSectionSlugs(sections: RawSection[]) {
  const usedSlugs = new Set<string>();
  sections.forEach((section, sectionIndex) => {
    const base = slugify(section.title, `section-${sectionIndex + 1}`);
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    usedSlugs.add(slug);
    section.slug = slug;
  });
}

function isInstructionalHeading(title: string) {
  const normalized = stripMarkdown(title).replace(/\s+/g, ' ').trim();
  return /^(?:本[章节讲](?:目标|导入|导读|定位|学习目标|完成什么)|学习目标|章节导入)(?:[：:].*)?$/.test(
    normalized,
  );
}

function removeInstructionalContent(body: string) {
  const output: string[] = [];
  let skippedDepth: number | undefined;
  let skippedQuote = false;
  let fence = '';

  for (const line of body.split('\n')) {
    if (skippedQuote) {
      if (/^\s*(?:>|$)/.test(line)) continue;
      skippedQuote = false;
    }

    const quotedHeading = line.match(/^\s*>\s*#{1,6}\s+(.+?)\s*#*\s*$/);
    if (quotedHeading && isInstructionalHeading(quotedHeading[1])) {
      skippedQuote = true;
      continue;
    }

    if (/^\s*>.*推荐.*(?:阅读|观看)/.test(line)) continue;

    const fenceMatch = line.match(/^\s*([~]{3,}|[\x60]{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = '';
    }

    const heading = !fence ? line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/) : null;
    if (skippedDepth !== undefined) {
      if (!heading || heading[1].length > skippedDepth) continue;
      skippedDepth = undefined;
    }

    if (heading && isInstructionalHeading(heading[2])) {
      skippedDepth = heading[1].length;
      continue;
    }

    if (/^\*\*(?:上一讲|下一讲)\*\*/.test(line.trim())) continue;
    output.push(line);
  }

  return output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(?:---\s*)+/, '')
    .trim();
}

function removeLeadingPrologue(body: string) {
  const firstHeading = body.search(/^##\s+/m);
  return firstHeading >= 0 ? body.slice(firstHeading).trim() : body.trim();
}

function removeFirstSection(body: string, title: string) {
  const lines = body.split('\n');
  const firstHeadingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  if (
    firstHeadingIndex < 0 ||
    stripMarkdown(lines[firstHeadingIndex].replace(/^##\s+/, '')) !== title
  )
    return body;
  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > firstHeadingIndex && /^##\s+/.test(line),
  );
  return (nextHeadingIndex >= 0 ? lines.slice(nextHeadingIndex) : []).join('\n').trim();
}

function condenseFirstSection(
  body: string,
  title: string,
  replacementTitle: string,
  contentType: 'code' | 'table',
) {
  const lines = body.split('\n');
  const headingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  if (headingIndex < 0 || stripMarkdown(lines[headingIndex].replace(/^##\s+/, '')) !== title)
    return body;

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && /^##\s+/.test(line),
  );
  const sectionEnd = nextHeadingIndex >= 0 ? nextHeadingIndex : lines.length;
  const contentStart = lines.findIndex((line, index) => {
    if (index <= headingIndex || index >= sectionEnd) return false;
    if (contentType === 'code') return /^\s*([~]{3,}|[\x60]{3,})/.test(line);
    return line.includes('|') && /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1] || '');
  });
  if (contentStart < 0) return removeFirstSection(body, title);

  let contentEnd = sectionEnd;
  if (contentType === 'code') {
    const marker = lines[contentStart].trim().charAt(0);
    const closingIndex = lines.findIndex(
      (line, index) =>
        index > contentStart && index < sectionEnd && line.trim().startsWith(marker.repeat(3)),
    );
    contentEnd = closingIndex >= 0 ? closingIndex + 1 : sectionEnd;
  }

  return [
    ...lines.slice(0, headingIndex),
    `## ${replacementTitle}`,
    '',
    ...lines.slice(contentStart, contentEnd),
    '',
    ...lines.slice(sectionEnd),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function condenseLeadingStructuredContent(
  body: string,
  title: string,
  contentStartPattern: RegExp,
) {
  const lines = body.split('\n');
  const firstHeadingIndex = lines.findIndex((line) => /^##\s+/.test(line));
  if (firstHeadingIndex < 0) return body;
  const contentStart = lines.findIndex(
    (line, index) => index < firstHeadingIndex && contentStartPattern.test(line),
  );
  if (contentStart < 0) return body;
  return [`## ${title}`, '', ...lines.slice(contentStart)].join('\n').trim();
}

function applyChapterRule(body: string, rule: ProjectChapterRule) {
  if (rule.type === 'condense-leading-content') {
    return condenseLeadingStructuredContent(body, rule.title, rule.contentStartPattern);
  }
  if (rule.type === 'condense-first-section') {
    return condenseFirstSection(body, rule.title, rule.replacementTitle, rule.contentType);
  }
  return removeFirstSection(body, rule.title);
}

function rewriteProjectLanguage(body: string, config: ProjectDocumentConfig) {
  const textReplacements = config.contentRules?.textReplacements || [];
  const codeReplacements = config.contentRules?.codeReplacements || [];
  let fence = '';
  return body
    .split('\n')
    .map((line) => {
      const fenceMatch = line.match(/^\s*([~]{3,}|[\x60]{3,})/);
      if (fenceMatch) {
        const marker = fenceMatch[1][0];
        if (!fence) fence = marker;
        else if (fence === marker) fence = '';
        return line;
      }
      const displayLine = codeReplacements.reduce(
        (value, [pattern, replacement]) => value.replace(pattern, replacement),
        line,
      );
      if (fence) return displayLine;
      return textReplacements.reduce(
        (value, [pattern, replacement]) => value.replace(pattern, replacement),
        displayLine,
      );
    })
    .join('\n');
}

function prepareChapterBody(body: string, sourceId: string, config: ProjectDocumentConfig) {
  let prepared = body;
  for (const rule of config.contentRules?.chapterRules || []) {
    if (rule.sourceId === sourceId) prepared = applyChapterRule(prepared, rule);
  }
  if (config.contentRules?.removeInstructionalSections)
    prepared = removeInstructionalContent(prepared);
  if (config.contentRules?.removeLeadingPrologue) prepared = removeLeadingPrologue(prepared);
  return rewriteProjectLanguage(prepared, config);
}

function parseDocuments(config: ProjectDocumentConfig) {
  const contentPath = resolve(process.cwd(), config.contentFile);
  const mergedMarkdown = readFileSync(contentPath, 'utf8').replace(/\r\n/g, '\n');
  const anchorPattern = /<a id="doc-([^"]+)"><\/a>\n# (.+)\n/g;
  const documentMatches = [...mergedMarkdown.matchAll(anchorPattern)];
  if (!documentMatches.length) {
    throw new Error(
      `Project ${config.slug} has no normalized document anchors in ${config.contentFile}`,
    );
  }

  return documentMatches.map((match, index): RawDocument => {
    const sourceId = match[1].replace(/-md$/, '');
    const sourceStart = match.index ?? 0;
    const sourceEnd =
      index + 1 < documentMatches.length
        ? (documentMatches[index + 1].index ?? mergedMarkdown.length)
        : mergedMarkdown.length;
    const segment = mergedMarkdown.slice(sourceStart, sourceEnd);
    const featuredIndex = segment.indexOf('> featured：');
    const metadataEnd = featuredIndex >= 0 ? segment.indexOf('\n\n', featuredIndex) : -1;
    if (metadataEnd < 0) {
      throw new Error(
        `Project ${config.slug} document ${sourceId} is missing its normalized metadata block`,
      );
    }
    const metadata = segment.slice(0, metadataEnd);
    const body = segment.slice(metadataEnd + 2).trim();
    const declaredDescription = metadata.match(/^> description：(.+)$/m)?.[1]?.trim() || '';
    return {
      sourceId,
      sourcePath: metadata.match(/^> 来源：`([^`]+)`$/m)?.[1] || config.contentFile,
      title: match[2].trim(),
      description: !/上一讲|下一讲/.test(declaredDescription)
        ? stripMarkdown(declaredDescription)
        : '',
      pubDate: new Date(metadata.match(/^> pubDate：(.+)$/m)?.[1]?.trim() || '2026-09-13'),
      tags:
        metadata
          .match(/^> tags：(.+)$/m)?.[1]
          ?.split(/[、,，]/)
          .map((tag) => tag.trim())
          .filter(Boolean) || config.tags,
      body,
    };
  });
}

function renderLesson(body: string) {
  const headings: ProjectHeading[] = [];
  const usedSlugs = new Set<string>();
  const markdown = new MarkdownIt({ html: true, linkify: false, typographer: false }).use(
    markdownItCjkFriendly,
  );
  const headingOpen: RendererRule = (tokens, index, options, _environment, renderer) => {
    const token = tokens[index];
    const depth = Number(token.tag.slice(1));
    const text = stripMarkdown(tokens[index + 1]?.content || '');
    const base = slugify(text, `section-${headings.length + 1}`);
    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
    usedSlugs.add(slug);
    headings.push({ depth, slug, text });
    token.attrSet('id', slug);
    return renderer.renderToken(tokens, index, options);
  };
  markdown.renderer.rules.heading_open = headingOpen;
  return { html: markdown.render(body), headings };
}

function validateConfig(config: ProjectDocumentConfig) {
  if (!config.groups.length)
    throw new Error(`Project ${config.slug} must contain at least one group`);
  const sourceIds = config.groups.flatMap((group) =>
    group.chapters.map((chapter) => chapter.sourceId),
  );
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new Error(`Project ${config.slug} contains duplicate chapter sourceId values`);
  }
}

function buildProject(config: ProjectDocumentConfig): ProjectDocumentation {
  validateConfig(config);
  const rawDocuments = parseDocuments(config);
  const documentsById = new Map(rawDocuments.map((document) => [document.sourceId, document]));
  const projectRoute = `/projects/${config.slug}`;
  const chapterDefinitions = config.groups.flatMap((group) => group.chapters);
  const routeBySource = new Map(
    chapterDefinitions.map((chapter, index) => [
      chapter.sourceId,
      index === 0 ? projectRoute : `${projectRoute}/${chapter.sourceId}`,
    ]),
  );

  const rewriteInternalLinks = (body: string) =>
    body.replace(
      /(\]\()\/blog\/([^)#?\/]+)([^)]*)(\))/g,
      (_match, prefix: string, sourceId: string, suffix: string, closing: string) => {
        const cleanSourceId = sourceId.replace(/\.md$/, '');
        const targetSourceId = config.sourceAliases?.[cleanSourceId] || cleanSourceId;
        const route = routeBySource.get(targetSourceId);
        const targetSuffix = targetSourceId === cleanSourceId ? suffix : '';
        return route
          ? `${prefix}${route}${targetSuffix}${closing}`
          : `${prefix}/blog/${sourceId}${suffix}${closing}`;
      },
    );

  let lessonNumber = 0;
  const groups: ProjectGroup[] = config.groups.map((group) => {
    const lessons = group.chapters.map((chapter, chapterIndex): ProjectLesson => {
      const document = documentsById.get(chapter.sourceId);
      if (!document) {
        throw new Error(
          `Project ${config.slug} is missing configured document ${chapter.sourceId}`,
        );
      }
      lessonNumber += 1;
      const body = rewriteInternalLinks(
        prepareChapterBody(document.body, chapter.sourceId, config),
      );
      const rendered = renderLesson(body);
      return {
        id: chapter.sourceId,
        sourcePath: document.sourcePath,
        sourceId: document.sourceId,
        title: chapter.title,
        description: chapter.intro,
        pubDate: document.pubDate,
        tags: document.tags,
        body,
        html: rendered.html,
        headings: rendered.headings,
        route: routeBySource.get(chapter.sourceId)!,
        projectSlug: config.slug,
        projectName: config.name,
        projectRoute,
        groupSlug: group.slug,
        groupTitle: group.title,
        lessonNumber,
        numberInGroup: chapterIndex + 1,
        navLabel: chapter.navLabel,
      };
    });
    return { slug: group.slug, title: group.title, eyebrow: group.eyebrow, lessons };
  });

  return {
    slug: config.slug,
    name: config.name,
    description: config.description,
    cardDescription: config.cardDescription,
    kind: config.kind,
    status: config.status,
    statusLabel: config.statusLabel,
    tags: config.tags,
    recent: config.recent ?? false,
    route: projectRoute,
    groups,
    lessons: groups.flatMap((group) => group.lessons),
  };
}

const projectSlugs = projectDocumentConfigs.map((config) => config.slug);
if (new Set(projectSlugs).size !== projectSlugs.length) {
  throw new Error('Project document configuration contains duplicate project slugs');
}

export const projectDocuments = projectDocumentConfigs.map(buildProject);
export const allProjectLessons = projectDocuments.flatMap((project) => project.lessons);

export function getProjectBySlug(slug: string) {
  return projectDocuments.find((project) => project.slug === slug);
}

export function getLessonNavigation(project: ProjectDocumentation, lesson: ProjectLesson) {
  const index = project.lessons.indexOf(lesson);
  return {
    previous: index > 0 ? project.lessons[index - 1] : undefined,
    next: index >= 0 && index < project.lessons.length - 1 ? project.lessons[index + 1] : undefined,
  };
}

const legacyRedirectList: LegacyProjectRedirect[] = [];
const usedLegacyPaths = new Set<string>();
for (const config of projectDocumentConfigs.filter((project) => project.legacyBlogRoutes)) {
  const project = getProjectBySlug(config.slug)!;
  const routeBySource = new Map(project.lessons.map((lesson) => [lesson.sourceId, lesson.route]));
  for (const document of parseDocuments(config)) {
    const targetSourceId = config.sourceAliases?.[document.sourceId] || document.sourceId;
    const target = routeBySource.get(targetSourceId);
    if (!target) continue;

    if (!usedLegacyPaths.has(document.sourceId)) {
      usedLegacyPaths.add(document.sourceId);
      legacyRedirectList.push({ path: document.sourceId, target });
    }

    const sections = splitIntoSections(document.body, document.title);
    assignSectionSlugs(sections);
    for (const section of sections) {
      const path = `${document.sourceId}/${section.slug}`;
      if (usedLegacyPaths.has(path)) continue;
      usedLegacyPaths.add(path);
      legacyRedirectList.push({ path, target });
    }
  }
}

export const legacyBlogRedirects = legacyRedirectList;
