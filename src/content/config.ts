import { defineCollection, z } from "astro:content";

const papers = defineCollection({
  schema: z.object({
    title: z.string().min(1),
    authors: z.array(z.string().min(1)).min(1),
    semester: z.string().min(1),
    category: z.string().min(1),
    advisor: z.string().min(1),
    keywords: z.array(z.string().min(1)).min(1),
    abstract: z.string().min(1),
    pdf: z.string().min(1),
    issue_slug: z.string().min(1),
    published_at: z.string().optional(),
  }),
});

export const collections = {
  papers,
};
