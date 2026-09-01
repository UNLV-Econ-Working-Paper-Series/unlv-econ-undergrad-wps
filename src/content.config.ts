import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { paperSchema } from "./content/paper-schema";

const papers = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/papers" }),
  schema: paperSchema,
});

const graduateAssistants = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/graduateAssistants" }),
  schema: z.object({
    name: z.string().min(1),
    term: z.string().min(1),
    termOrder: z.number().int(),
    role: z.string().default("Junior Editor"),
    headshot: z.string().optional(),
    summary: z.string().optional(),
    current: z.boolean().default(false),
  }),
});

export const collections = {
  papers,
  graduateAssistants,
};
