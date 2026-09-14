import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';

function readArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) continue;
    const separator = argument.indexOf('=');
    if (separator >= 0) {
      values.set(argument.slice(2, separator), argument.slice(separator + 1));
    } else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
      values.set(argument.slice(2), argv[index + 1]);
      index += 1;
    } else {
      values.set(argument.slice(2), true);
    }
  }
  return values;
}

const argumentsMap = readArguments(process.argv.slice(2));
const inputArgument = argumentsMap.get('input');
const outputArgument = argumentsMap.get('output');
const projectName = argumentsMap.get('name');
const force = argumentsMap.get('force') === true;

if (
  typeof inputArgument !== 'string' ||
  typeof outputArgument !== 'string' ||
  typeof projectName !== 'string'
) {
  console.error(
    '用法：npm run prepare:project -- --input <Markdown目录> --output <整合文件> --name <项目名> [--tags 标签1,标签2] [--force]',
  );
  process.exit(1);
}

const projectRoot = resolve(
  new URL('..', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1)),
);
const inputRoot = resolve(inputArgument);
const outputPath = resolve(
  isAbsolute(outputArgument) ? outputArgument : join(projectRoot, outputArgument),
);

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if ((await exists(outputPath)) && !force) {
  console.error(`输出文件已经存在：${outputPath}\n确认内容后使用 --force 才会覆盖。`);
  process.exit(1);
}

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdown(entryPath)));
    else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.md') &&
      resolve(entryPath) !== outputPath
    ) {
      files.push(entryPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function parseDocument(source, filePath) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, body: source.trim() };
  try {
    return { metadata: parse(match[1]) ?? {}, body: match[2].trim() };
  } catch (error) {
    throw new Error(`无法解析 ${filePath} 的 frontmatter：${error.message}`);
  }
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (value === null || value === undefined || value === '') return '未设置';
  return String(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\u3400-\u9fff]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function removeMatchingTitle(body, title) {
  const lines = body.split(/\r?\n/);
  const heading = lines[0]?.match(/^#\s+(.+?)\s*#*\s*$/);
  if (heading?.[1].trim() === title.trim()) return lines.slice(1).join('\n').trim();
  return body;
}

const files = await collectMarkdown(inputRoot);
if (!files.length) {
  console.error(`输入目录中没有 Markdown 文件：${inputRoot}`);
  process.exit(1);
}

const defaultTags = String(argumentsMap.get('tags') || '')
  .split(/[,，]/)
  .map((tag) => tag.trim())
  .filter(Boolean);
const today = new Date().toISOString().slice(0, 10);
const documents = await Promise.all(
  files.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    const relativePath = relative(inputRoot, filePath).split(sep).join('/');
    const { metadata, body } = parseDocument(source, relativePath);
    const bodyTitle = body.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1]?.trim();
    const title = String(metadata.title || bodyTitle || relativePath.replace(/\.md$/i, ''));
    return {
      sourcePath: relativePath,
      sourceId: slugify(relativePath.replace(/\.md$/i, '')),
      title,
      description: String(metadata.description || title),
      pubDate: formatValue(metadata.pubDate || metadata.date || today),
      tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : defaultTags,
      draft: Boolean(metadata.draft),
      featured: Boolean(metadata.featured),
      body: removeMatchingTitle(body, title),
    };
  }),
);

const lines = [
  '---',
  `title: "${projectName.replaceAll('"', '\\"')} 全部 Markdown 内容"`,
  `description: "${projectName.replaceAll('"', '\\"')} 项目开发文档。"`,
  `pubDate: ${today}`,
  `tags: [${defaultTags.map((tag) => `"${tag.replaceAll('"', '\\"')}"`).join(', ')}]`,
  'draft: false',
  'featured: true',
  '---',
  '',
  `# ${projectName} 全部 Markdown 内容`,
  '',
  '## 文档目录',
  '',
  ...documents.map(
    (document, index) => `${index + 1}. [${document.title}](#doc-${document.sourceId}-md)`,
  ),
  '',
];

for (const document of documents) {
  lines.push(`<a id="doc-${document.sourceId}-md"></a>`, `# ${document.title}`, '');
  lines.push(`> 来源：\`${document.sourcePath}\``);
  lines.push('> 类型：项目文档');
  lines.push(`> description：${document.description}`);
  lines.push(`> pubDate：${document.pubDate}`);
  lines.push(`> tags：${document.tags.join('、')}`);
  lines.push(`> draft：${formatValue(document.draft)}`);
  lines.push(`> featured：${formatValue(document.featured)}`);
  lines.push('', document.body, '', '---', '');
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${lines.join('\n').trimEnd()}\n`, 'utf8');
console.log(`已生成 ${outputPath}，整合 ${documents.length} 个 Markdown 文件；输入目录未修改。`);
