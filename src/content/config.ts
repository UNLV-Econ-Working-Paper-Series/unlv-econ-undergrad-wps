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

const graduateAssistants = defineCollection({
  type: "content",
  schema: z.object({
    name: z.string().min(1),
    term: z.string().min(1),
    termOrder: z.number().int(),
    role: z.string().default("Graduate Assistant"),
    headshot: z.string().optional(),
    summary: z.string().optional(),
    current: z.boolean().default(false),
  }),
});

export const collections = {
  papers,
  graduateAssistants,
};
