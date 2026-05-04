import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tagSchema = z.union([
  z.array(z.string()),
  z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
]);

const baseSchema = {
  title: z.string(),
  author: z.string().default('Ronan'),
  date: z.coerce.date(),
  tags: tagSchema.optional().default([]),
  excerpt: z.string().optional(),
  draft: z.boolean().optional().default(false),
  cover: z.string().optional(),
  notes: z.record(z.string(), z.string()).optional(),
};

const garden = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './posts/garden' }),
  schema: z.object({
    ...baseSchema,
    growthStage: z.enum(['seedling', 'budding', 'evergreen']).optional().default('seedling'),
    lastTended: z.coerce.date().optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './posts/articles' }),
  schema: z.object({
    ...baseSchema,
    type: z.string().optional().default('Article'),
    readTime: z.number().optional(),
  }),
});

export const collections = { garden, articles };
