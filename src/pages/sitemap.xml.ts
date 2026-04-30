import { getCollection } from "astro:content";
import { PUBLIC_PROFILES } from "../data/public-profiles";
import { getArchiveIssueGroups } from "../lib/archive";
import { getCategoryGroups, getIssueGroups, paperSlug } from "../lib/papers";

const SITE_URL = "https://econ-undergrad-wps.sites.unlv.edu";

const POLICY_SLUGS = [
  "focus-scope",
  "open-access",
  "editorial-process",
  "permissions",
  "privacy",
  "corrections-versioning",
  "ethics",
  "takedown",
  "archiving",
  "accessibility",
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
  return [...new Set(paths.map(normalizePath))];
}

export async function GET(): Promise<Response> {
  const issues = await getIssueGroups();
  const papers = await getCollection("papers");
  const categories = await getCategoryGroups();
  const archiveIssues = getArchiveIssueGroups();

  const visibleIssues = issues.filter((issue, index) => issue.papers.length > 0 || index === 0);
  const visibleCategories = categories.filter((category) => category.count > 0);

  const paths = uniquePaths([
    "/",
    "/about/",
    "/contact/",
    "/our/",
    "/issues/",
    "/issues/archive/",
    "/papers/",
    "/categories/",
    "/policies/",
    "/graduate-assistants/",
    ...visibleIssues.map((issue) => `/issues/${issue.slug}/`),
    ...archiveIssues.map((issue) => `/issues/archive/${issue.slug}/`),
    ...visibleCategories.map((category) => `/categories/${category.slug}/`),
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
