import { getCollection, type CollectionEntry } from "astro:content";
import { OASIS_MIRROR_ACTIVE } from "../config/repositoryStatus";
import { CATEGORY_DEFINITIONS, categoryNameForSlug, categorySlugForName } from "../data/categories";
import { ISSUE_DEFINITIONS, definedIssueLabel } from "../data/issues";
import { withBase } from "../lib/urls";

export type PaperEntry = CollectionEntry<"papers">;

export interface IssueGroup {
  slug: string;
  label: string;
  year: number | null;
  term: string;
  papers: PaperEntry[];
  sortKey: number;
}

export interface CategoryGroup {
  name: string;
  slug: string;
  count: number;
  papers: PaperEntry[];
}

export interface SemesterGroup {
  semester: string;
  papers: PaperEntry[];
  sortKey: number;
}

const TERM_ORDER: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

function parseSemester(raw: string): { term: string; year: number | null; sortKey: number } {
  const normalized = raw.trim();
  const match = normalized.match(/^(spring|summer|fall|winter)[\s-]+(\d{4})$/i);
  if (!match) {
    return { term: "unknown", year: null, sortKey: 0 };
  }

  const term = match[1].toLowerCase();
  const year = Number.parseInt(match[2], 10);
  const sortKey = Number.isFinite(year) ? year * 10 + (TERM_ORDER[term] ?? 0) : 0;
  return { term, year, sortKey };
}

function formatTerm(term: string): string {
  if (!term) {
    return "Issue";
  }
  return term[0].toUpperCase() + term.slice(1);
}

function issueSortKeyFromSlug(slug: string): number {
  const match = slug.match(/^(\d{4})-(spring|summer|fall|winter)$/i);
  if (!match) {
    return 0;
  }
  const year = Number.parseInt(match[1], 10);
  const term = match[2].toLowerCase();
  return year * 10 + (TERM_ORDER[term] ?? 0);
}

export function cleanPaperTitle(title: string): string {
  const cleaned = title.trim();
  const match = cleaned.match(/^paper\s*\d+\s*:\s*(.+)$/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  return cleaned;
}

export function issueSlugFromSemester(semester: string): string {
  const parsed = parseSemester(semester);
  if (!parsed.year || parsed.term === "unknown") {
    return semester
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  return `${parsed.year}-${parsed.term}`;
}

export function issueLabelFromSlug(slug: string): string {
  const defined = definedIssueLabel(slug);
  if (defined) {
    return defined;
  }

  const match = slug.match(/^(\d{4})-(spring|summer|fall|winter)$/i);
  if (!match) {
    return slug;
  }
  const year = match[1];
  const term = match[2].toLowerCase();
  return `${formatTerm(term)} ${year}`;
}

function publishedAtTime(paper: PaperEntry): number {
  const raw = paper.data.published_at?.trim();
  if (!raw) {
    return 0;
  }
  const value = Date.parse(raw);
  return Number.isNaN(value) ? 0 : value;
}

export function paperSlug(paper: PaperEntry): string {
  // Astro content entries often include extension in `id`.
  return paper.id.replace(/\.(md|mdx)$/i, "");
}

function comparePapersDesc(a: PaperEntry, b: PaperEntry): number {
  const dateA = publishedAtTime(a);
  const dateB = publishedAtTime(b);

  if (dateA !== dateB) {
    return dateB - dateA;
  }

  const issueA = issueSortKeyFromSlug(getIssueSlugForPaper(a));
  const issueB = issueSortKeyFromSlug(getIssueSlugForPaper(b));
  if (issueA !== issueB) {
    return issueB - issueA;
  }

  return cleanPaperTitle(a.data.title).localeCompare(cleanPaperTitle(b.data.title));
}

export function getIssueSlugForPaper(paper: PaperEntry): string {
  return paper.data.issue_slug || issueSlugFromSemester(paper.data.semester);
}

export function getIssueLabelForPaper(paper: PaperEntry): string {
  return issueLabelFromSlug(getIssueSlugForPaper(paper));
}

export function paperHref(paper: PaperEntry): string {
  return withBase(`/papers/${paperSlug(paper)}/`);
}

export async function getAllPapers(): Promise<PaperEntry[]> {
  const papers = await getCollection("papers");
  return [...papers].sort(comparePapersDesc);
}

export async function getIssueGroups(): Promise<IssueGroup[]> {
  const papers = await getAllPapers();
  const byIssue = new Map<string, IssueGroup>();

  for (const paper of papers) {
    const slug = getIssueSlugForPaper(paper);
    const existing = byIssue.get(slug);
    if (existing) {
      existing.papers.push(paper);
      continue;
    }

    const semester = parseSemester(paper.data.semester);
    byIssue.set(slug, {
      slug,
      label: issueLabelFromSlug(slug),
      year: semester.year,
      term: semester.term,
      papers: [paper],
      sortKey: issueSortKeyFromSlug(slug) || semester.sortKey,
    });
  }

  for (const issue of ISSUE_DEFINITIONS) {
    if (byIssue.has(issue.slug)) {
      continue;
    }
    const sortKey = issueSortKeyFromSlug(issue.slug);
    const yearMatch = issue.slug.match(/^(\d{4})-/);
    byIssue.set(issue.slug, {
      slug: issue.slug,
      label: issue.label,
      year: yearMatch ? Number.parseInt(yearMatch[1], 10) : null,
      term: issue.slug.split("-")[1] ?? "unknown",
      papers: [],
      sortKey,
    });
  }

  return [...byIssue.values()]
    .map((group) => ({ ...group, papers: [...group.papers].sort(comparePapersDesc) }))
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return b.sortKey - a.sortKey;
      }
      return a.label.localeCompare(b.label);
    });
}

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const papers = await getAllPapers();
  const bySlug = new Map<string, CategoryGroup>();

  for (const category of CATEGORY_DEFINITIONS) {
    bySlug.set(category.slug, {
      name: category.name,
      slug: category.slug,
      count: 0,
      papers: [],
    });
  }

  for (const paper of papers) {
    const categoryName = paper.data.category.trim();
    const slug = categorySlugForName(categoryName);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.papers.push(paper);
      existing.count += 1;
      continue;
    }

    bySlug.set(slug, {
      name: categoryName,
      slug,
      count: 1,
      papers: [paper],
    });
  }

  return [...bySlug.values()]
    .map((group) => ({ ...group, papers: [...group.papers].sort(comparePapersDesc) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function categoryNameFromSlug(slug: string): string {
  return categoryNameForSlug(slug) ?? slug.replace(/-/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

export function formatCitation(paper: PaperEntry): string {
  const authors = paper.data.authors.join(", ");
  const issue = getIssueLabelForPaper(paper);
  const title = cleanPaperTitle(paper.data.title);
  const yearMatch = issue.match(/(\d{4})/);
  const year = yearMatch?.[1] ?? "n.d.";
  const oasisUrl = paper.data.oasis_url?.trim();
  const url = OASIS_MIRROR_ACTIVE && oasisUrl ? oasisUrl : paperHref(paper);
  return `${authors} (${year}). ${title}. ${issue}. UNLV Undergraduate Economics Working Paper Series. ${url}`;
}

export function groupPapersBySemester(papers: PaperEntry[]): SemesterGroup[] {
  const bySemester = new Map<string, SemesterGroup>();

  for (const paper of papers) {
    const semester = paper.data.semester;
    const existing = bySemester.get(semester);
    if (existing) {
      existing.papers.push(paper);
      continue;
    }

    const parsed = parseSemester(semester);
    bySemester.set(semester, {
      semester,
      papers: [paper],
      sortKey: parsed.sortKey,
    });
  }

  return [...bySemester.values()]
    .map((group) => ({ ...group, papers: [...group.papers].sort(comparePapersDesc) }))
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return b.sortKey - a.sortKey;
      }
      return b.semester.localeCompare(a.semester);
    });
}
