import rss from '@astrojs/rss';
import { site } from '@/data/site';
import { allProjectLessons } from '@/data/project-docs';

export async function GET(context: { site?: URL }) {
  return rss({
    title: site.name,
    description: site.description,
    site: context.site || site.url,
    items: allProjectLessons.map((lesson) => ({
      title: `${lesson.projectName}：${lesson.title}`,
      description: lesson.description,
      pubDate: lesson.pubDate,
      link: `${lesson.route}/`,
    })),
  });
}
