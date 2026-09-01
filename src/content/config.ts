import { defineCollection, z } from "astro:content";
import { paperSchema } from "./paper-schema";

const papers = defineCollection({
  type: "content",
  schema: paperSchema,
});

const graduateAssistants = defineCollection({
  type: "content",
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
