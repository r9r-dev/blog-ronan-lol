// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ronan.lol',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'rose-pine-moon',
      wrap: true,
    },
  },
  build: {
    format: 'directory',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
