import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: 'ronan.lol',
    description:
      "Carnet de Ronan Lamour. Notes techniques, lectures et expériences.",
    site: context.site,
    items: posts.map((post) => {
      const slug = post.id.replace(/\/index$/, '');
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.excerpt,
        link: `/${slug}`,
        categories: post.data.tags,
        author: post.data.author,
      };
    }),
    customData: '<language>fr-fr</language>',
  });
}
