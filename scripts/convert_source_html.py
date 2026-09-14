from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path
from urllib.parse import unquote, urlparse

from bs4 import BeautifulSoup, NavigableString
from markdownify import markdownify


SKIP_NAMES = {'index.html', '404.html'}
SKIP_DIRS = {'animation', 'standalone', 'search', 'assets'}

# These substitutions only change teaching/course framing. Technical statements,
# examples, code, names, and explanations are kept as-is.
REPLACEMENTS = [
    ('系统课程', '项目开发文档'),
    ('系统讲义', '项目开发文档'),
    ('讲义状态', '文档状态'),
    ('讲义', '项目文档'),
    ('课程大纲', '开发路线'),
    ('课程结构', '开发结构'),
    ('课程总览', '开发总览'),
    ('课程主线', '项目主线'),
    ('本课程', '本项目'),
    ('课程', '项目'),
    ('第\u200b一阶段', '第一阶段'),
    ('本讲导入', '本节导入'),
    ('本讲目标', '本节目标'),
    ('本讲定位', '本节定位'),
    ('本讲边界', '本节边界'),
    ('本讲', '本节'),
    ('课后练习', '开发练习'),
    ('实训', '实践'),
    ('学习路线图', '开发路线图'),
    ('学习目标', '开发目标'),
    ('学习要求', '实现要求'),
    ('深入学习', '深入阅读'),
    ('推荐学习', '推荐阅读'),
    ('第一次学习', '首次阅读'),
    ('学习重点', '实现重点'),
    ('学习提示', '阅读提示'),
    ('学完本讲后', '完成本节后'),
    ('学完本节后', '完成本节后'),
    ('课程结束', '项目阶段结束'),
    ('课后', '后续'),
    ('这讲', '本节'),
    ('第 1 讲', '项目阶段 01'),
    ('第 2 讲', '项目阶段 02'),
    ('第 3 讲', '项目阶段 03'),
    ('第 4 讲', '项目阶段 04'),
    ('第 5 讲', '项目阶段 05'),
    ('第 6 讲', '项目阶段 06'),
    ('第 7 讲', '项目阶段 07'),
    ('第 8 讲', '项目阶段 08'),
    ('第 9 讲', '项目阶段 09'),
    ('第 10 讲', '项目阶段 10'),
    ('第 11 讲', '项目阶段 11'),
    ('第 12 讲', '项目阶段 12'),
    ('第 13 讲', '项目阶段 13'),
    ('第 14 讲', '项目阶段 14'),
    ('第 15 讲', '项目阶段 15'),
    ('第 16 讲', '项目阶段 16'),
    ('第 17 讲', '项目阶段 17'),
    ('第 18 讲', '项目阶段 18'),
    ('第 19 讲', '项目阶段 19'),
    ('第 20 讲', '项目阶段 20'),
    ('第1讲', '项目阶段 01'),
    ('第2讲', '项目阶段 02'),
    ('第3讲', '项目阶段 03'),
    ('第4讲', '项目阶段 04'),
    ('第5讲', '项目阶段 05'),
    ('第6讲', '项目阶段 06'),
    ('第7讲', '项目阶段 07'),
    ('第8讲', '项目阶段 08'),
    ('第9讲', '项目阶段 09'),
    ('第10讲', '项目阶段 10'),
    ('第11讲', '项目阶段 11'),
    ('第12讲', '项目阶段 12'),
    ('第13讲', '项目阶段 13'),
    ('第14讲', '项目阶段 14'),
    ('第15讲', '项目阶段 15'),
    ('第16讲', '项目阶段 16'),
    ('第17讲', '项目阶段 17'),
    ('第18讲', '项目阶段 18'),
    ('第19讲', '项目阶段 19'),
    ('第20讲', '项目阶段 20'),
    ('讲一', '阶段一'),
    ('讲二', '阶段二'),
    ('讲三', '阶段三'),
    ('在学习本节之前', '在阅读本节之前'),
    ('在学习本节之后', '在阅读本节之后'),
    ('学习这些组件时', '理解这些组件时'),
    ('学习这些能力时', '理解这些能力时'),
    ('学习时', '阅读时'),
    ('学习本项目', '阅读本项目'),
    ('练习 1', '验证实践 1'),
    ('练习 2', '验证实践 2'),
    ('练习 3', '验证实践 3'),
    ('练习', '验证实践'),
    ('教学', '开发'),
    ('课堂', '开发演示'),
]


def clean_text(value: str) -> str:
    for old, new in REPLACEMENTS:
        value = value.replace(old, new)
    value = re.sub(r'\s+¶', '', value)
    return value.strip()


def mark_mermaid_blocks(body: str) -> str:
    diagram_starts = (
        'flowchart ', 'graph ', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline',
        'quadrantChart', 'xychart-beta', 'gitGraph',
    )
    pattern = r'```\n(?=(' + '|'.join(re.escape(item) for item in diagram_starts) + r'))'
    return re.sub(pattern, '```mermaid\n', body)


def source_files(source: Path) -> list[Path]:
    files: list[Path] = []
    for path in source.rglob('*.html'):
        relative = path.relative_to(source)
        if path.name in SKIP_NAMES or any(part in SKIP_DIRS for part in relative.parts):
            continue
        soup = BeautifulSoup(path.read_text(encoding='utf-8', errors='replace'), 'html.parser')
        if soup.select_one('article.md-content__inner, main article'):
            files.append(path)
    return sorted(files)


def slug_for(path: Path, source: Path) -> str:
    relative = path.relative_to(source)
    stem = relative.with_suffix('').as_posix()
    if stem.startswith('appendix/'):
        stem = stem[len('appendix/'):]
    return re.sub(r'[^a-zA-Z0-9_-]+', '-', stem).strip('-').lower()


def article_node(soup: BeautifulSoup):
    article = soup.select_one('article.md-content__inner')
    if article is not None:
        return article
    return soup.select_one('main article')


def copy_images(node, source_file: Path, source: Path, public_images: Path) -> None:
    for image in node.select('img[src]'):
        raw = image.get('src', '').strip()
        parsed = urlparse(raw)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        image_source = (source_file.parent / unquote(parsed.path)).resolve()
        try:
            image_source.relative_to(source.resolve())
        except ValueError:
            continue
        if not image_source.is_file():
            continue
        target_name = re.sub(r'[^a-zA-Z0-9._-]+', '-', image_source.name).lower()
        target = public_images / target_name
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(image_source, target)
        image['src'] = f'/images/edurag/{target_name}'
        image['alt'] = image.get('alt') or ''


def rewrite_links(node, link_map: dict[str, str], source: Path, source_file: Path) -> None:
    for link in node.select('a[href]'):
        href = link.get('href', '').strip()
        if not href or href.startswith(('#', 'http://', 'https://', 'mailto:', 'tel:')):
            continue
        parsed = urlparse(href)
        target = (source_file.parent / unquote(parsed.path)).resolve()
        try:
            target.relative_to(source.resolve())
        except ValueError:
            link.unwrap()
            continue
        key = target.relative_to(source).as_posix()
        if key in link_map:
            suffix = f'#{parsed.fragment}' if parsed.fragment else ''
            link['href'] = f'/blog/{link_map[key]}{suffix}'
        else:
            # Keep the visible reference, but do not leave a broken source-site URL.
            link.unwrap()


def remove_scaffolding(node) -> None:
    for selector in [
        'script', 'style', 'nav', 'form', 'button', 'input', 'select', 'textarea',
        '.headerlink', '.md-source-file', '.md-feedback', '.md-meta__source',
        '.md-typeset .tabbed-labels', '.md-typeset .admonition-title + input',
    ]:
        for element in node.select(selector):
            element.decompose()
    # MkDocs sometimes repeats a table of contents inside the article.
    for element in node.select('.md-sidebar, .toc, .md-nav, .md-content__button'):
        element.decompose()


def normalize_code_blocks(node) -> None:
    """Turn MkDocs' line-number tables back into semantic code blocks."""
    factory = BeautifulSoup('', 'html.parser')
    for highlight in node.select('div.highlight'):
        table = highlight.select_one('table.highlighttable')
        code = table.select_one('td.code code') if table else None
        if code is None:
            continue
        source = code.get_text(separator='', strip=False).replace('\r\n', '\n').replace('\r', '\n')
        if source.endswith('\n'):
            source = source[:-1]
        pre = factory.new_tag('pre')
        code_tag = factory.new_tag('code')
        code_tag.string = source
        pre.append(code_tag)
        highlight.replace_with(pre)


def convert(source: Path, output: Path) -> tuple[int, int]:
    files = source_files(source)
    link_map: dict[str, str] = {}
    used_slugs: dict[str, int] = {}
    for path in files:
        base = slug_for(path, source)
        occurrence = used_slugs.get(base, 0) + 1
        used_slugs[base] = occurrence
        link_map[path.relative_to(source).as_posix()] = base if occurrence == 1 else f'{base}-v{occurrence}'
    public_images = output.parent.parent.parent / 'public' / 'images' / 'edurag'
    output.mkdir(parents=True, exist_ok=True)
    converted = 0
    total_chars = 0

    for path in files:
        soup = BeautifulSoup(path.read_text(encoding='utf-8', errors='replace'), 'html.parser')
        article = article_node(soup)
        if article is None:
            continue
        remove_scaffolding(article)
        normalize_code_blocks(article)
        copy_images(article, path, source, public_images)
        rewrite_links(article, link_map, source, path)

        h1 = article.find('h1')
        title = clean_text(h1.get_text(' ', strip=True) if h1 else path.stem)
        description = ''
        for paragraph in article.find_all('p'):
            text = clean_text(paragraph.get_text(' ', strip=True))
            if text:
                description = text[:180]
                break
        if not description:
            description = title

        # Apply only to visible article text, including code comments that are part
        # of the supplied documentation; do not touch href/src attributes.
        for text_node in article.find_all(string=True):
            if isinstance(text_node, NavigableString):
                text_node.replace_with(clean_text(str(text_node)))

        body = markdownify(str(article), heading_style='ATX', bullets='-')
        body = re.sub(r'\n{3,}', '\n\n', body).strip()
        body = clean_text(body)
        body = mark_mermaid_blocks(body)
        # The Astro article layout renders the title from frontmatter; avoid a
        # duplicated H1 while retaining every section below it.
        body = re.sub(rf'^#\s+{re.escape(title)}\s*\n+', '', body, count=1)
        date = '2026-09-13'
        frontmatter = '\n'.join([
            '---',
            f'title: {title!r}',
            f'description: {description!r}',
            f'pubDate: {date}',
            'tags:',
            '  - KnowForge',
            '  - RAG',
            '  - 工程实践',
            'draft: false',
            'featured: false',
            '---',
            '',
        ])
        destination = output / f'{link_map[path.relative_to(source).as_posix()]}.md'
        destination.write_text(frontmatter + body + '\n', encoding='utf-8')
        converted += 1
        total_chars += len(body)
    return converted, total_chars


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    count, chars = convert(args.source, args.output)
    print(f'Converted {count} HTML documents ({chars} Markdown characters).')


if __name__ == '__main__':
    main()
