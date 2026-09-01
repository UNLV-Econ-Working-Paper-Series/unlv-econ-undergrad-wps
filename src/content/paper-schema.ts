import { z } from "astro/zod";
import { RESEARCH_FIELDS } from "../config/publication";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO calendar date in YYYY-MM-DD form")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
    );
  }, "Use a valid calendar date");

const publicAuthor = z
  .object({
    name: z.string().trim().min(1),
    affiliation: z.string().trim().min(1).optional(),
    orcid: z.string().url().optional(),
    institutional_profile: z.string().url().optional(),
    public_profile: z.string().url().optional(),
  })
  .strict();

const publicVersion = z
  .object({
    label: z.string().trim().min(1).optional(),
    published_at: isoDate,
    note: z.string().trim().min(1).optional(),
    oasis_url: z.string().url(),
    pdf_url: z.string().url(),
  })
  .strict();

const previousVersion = z
  .object({
    label: z.string().trim().min(1),
    published_at: isoDate,
    note: z.string().trim().min(1),
    public_url: z.string().url().optional(),
    oasis_url: z.string().url().optional(),
    status: z.enum(["superseded", "corrected", "withdrawn"]),
  })
  .strict();

const facultySponsor = z
  .object({
    name: z.string().trim().min(1),
    profile_url: z.string().url().optional(),
  })
  .strict();

const historicalProvenance = z
  .object({
    source_name: z.string().trim().min(1),
    original_url: z.string().url().optional(),
    original_term: z.string().trim().min(1),
    original_publication_date: isoDate.optional(),
    migrated_at: isoDate.optional(),
    note: z.string().trim().min(1),
  })
  .strict();

export const paperSchema = z
  .object({
    title: z.string().trim().min(1),
    authors: z.array(publicAuthor).min(1),
    abstract: z.string().trim().min(1),
    keywords: z.array(z.string().trim().min(1)).min(1),
    field: z.enum(RESEARCH_FIELDS),
    issue_term: z.string().trim().min(1),
    issue_slug: z.string().trim().min(1),
    volume: z.number().int().positive(),
    issue_number: z.number().int().positive(),
    series_number: z.string().regex(/^UNLV-Econ-WPS-\d{4}-\d{3}$/),
    issue_published_at: isoDate.optional(),
    citable_published_at: isoDate,
    repository_published_at: isoDate,
    current_version: publicVersion,
    previous_versions: z.array(previousVersion).default([]),
    faculty_sponsor: facultySponsor.optional(),
    doi: z.string().trim().regex(/^10\.\d{4,9}\/\S+$/i).optional(),
    oasis_url: z.string().url(),
    pdf_url: z.string().url(),
    pages: z.string().trim().min(1).optional(),
    rights_statement: z.string().trim().min(1).optional(),
    license_url: z.string().url().optional(),
    copyright_holder: z.string().trim().min(1).optional(),
    conflict_statement: z.string().trim().min(1).optional(),
    ai_disclosure: z.string().trim().min(1).optional(),
    ethics_statement: z.string().trim().min(1).optional(),
    data_availability: z.string().trim().min(1).optional(),
    code_availability: z.string().trim().min(1).optional(),
    historical_provenance: historicalProvenance.optional(),
  })
  .strict()
  .superRefine((paper, context) => {
    const identifierYear = paper.series_number.match(/^UNLV-Econ-WPS-(\d{4})-/)?.[1];
    const citableYear = paper.citable_published_at.slice(0, 4);

    if (identifierYear !== citableYear) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["series_number"],
        message: "Series identifier year must match the verified citable publication year",
      });
    }

    if (paper.current_version.oasis_url !== paper.oasis_url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["current_version", "oasis_url"],
        message: "Current-version OAsis URL must match the canonical paper OAsis URL",
      });
    }

    if (paper.current_version.pdf_url !== paper.pdf_url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["current_version", "pdf_url"],
        message: "Current-version PDF URL must match the canonical paper PDF URL",
      });
    }

    paper.previous_versions.forEach((version, index) => {
      if (version.published_at > paper.current_version.published_at) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["previous_versions", index, "published_at"],
          message: "A previous version cannot postdate the current version",
        });
      }
    });
  });
