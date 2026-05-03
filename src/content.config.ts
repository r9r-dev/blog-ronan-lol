import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tagSchema = z.union([
  z.array(z.string()),
  z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
]);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './posts' }),
  schema: z.object({
    title: z.string(),
    author: z.string().default('Ronan'),
    date: z.coerce.date(),
    tags: tagSchema.optional().default([]),
    excerpt: z.string().optional(),
    type: z.string().optional().default('Note'),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { posts };
