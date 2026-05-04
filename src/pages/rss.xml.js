import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const garden = await getCollection('garden', ({ data }) => !data.draft);
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const items = [
    ...garden.map((p) => ({
      title: p.data.title,
      pubDate: p.data.lastTended ?? p.data.date,
      description: p.data.excerpt ?? '',
      link: `/jardin/${p.id.replace(/\/index$/, '')}`,
      categories: p.data.tags ?? [],
    })),
    ...articles.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt ?? '',
      link: `/articles/${p.id.replace(/\/index$/, '')}`,
      categories: p.data.tags ?? [],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'ronan.lol',
    description: 'Carnet de Ronan Lamour — notes, articles, expériences.',
    site: context.site,
    items,
  });
}
