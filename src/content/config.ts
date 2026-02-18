import { defineCollection, z } from 'astro:content';

const products = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['Cutting Boards', 'Chairs', 'Tables', 'Decor', 'Other']).default('Other'),
    description: z.string(),
    price: z.string().optional(),
    image: z.string(),
    gallery: z.array(z.object({ image: z.string() })).optional(),
    dimensions: z.string().optional(),
    wood: z.string().optional(),
    featured: z.boolean().default(false),
    available: z.boolean().default(true),
    date: z.date(),
  }),
});

export const collections = {
  products,
};
