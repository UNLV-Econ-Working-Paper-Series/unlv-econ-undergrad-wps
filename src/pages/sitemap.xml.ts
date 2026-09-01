import { getCollection } from "astro:content";
import { SERIES } from "../config/publication";
import { PUBLIC_PROFILES } from "../data/public-profiles";
import { getArchiveIssueGroups } from "../lib/archive";
import { getFieldGroups, getIssueGroups, paperSlug } from "../lib/papers";

const SITE_URL = SERIES.siteUrl;

const POLICY_SLUGS = [
  "focus-scope",
  "open-access",
  "editorial-governance",
  "editorial-process",
  "conflicts-recusal",
  "authorship-ai",
  "ethics",
  "data-code",
  "permissions",
  "accessibility",
  "corrections-versioning",
  "takedown",
  "appeals",
  "privacy",
  "archiving",
  "author-agreement",
];

function normalizePath(path: string): string {
  if (path === "/") {
    return path;
  }
  return path.endsWith("/") ? path : `${path}/`;
}

function absoluteUrl(path: string): string {
  return new URL(normalizePath(path), SITE_URL).toString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map(normalizePath))].sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b, "en-US");
  });
}

export async function GET(): Promise<Response> {
  const issues = await getIssueGroups();
  const fields = await getFieldGroups();
  const papers = await getCollection("papers");
  const archiveIssues = getArchiveIssueGroups();

  const visibleIssues = issues.filter((issue) => issue.papers.length > 0);

  const paths = uniquePaths([
    "/",
    "/about/",
    "/editorial-board/",
    "/history/",
    "/contact/",
    "/for-authors/",
    "/issues/",
    "/issues/archive/",
    "/papers/",
    "/fields/",
    "/policies/",
    ...visibleIssues.map((issue) => `/issues/${issue.slug}/`),
    ...archiveIssues.filter((issue) => issue.papers.length > 0).map((issue) => `/issues/archive/${issue.slug}/`),
    ...fields.map((field) => `/fields/${field.slug}/`),
    ...papers.map((paper) => `/papers/${paperSlug(paper)}/`),
    ...PUBLIC_PROFILES.map((profile) => profile.profileHref).filter((href): href is string => Boolean(href)),
    ...POLICY_SLUGS.map((slug) => `/policies/${slug}/`),
  ]);

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <url><loc>${escapeXml(absoluteUrl(path))}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
