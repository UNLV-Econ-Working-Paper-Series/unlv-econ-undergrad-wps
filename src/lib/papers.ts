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

export type CitationStyle = "repository" | "apa" | "mla" | "chicago";

export interface CitationOption {
  id: CitationStyle;
  label: string;
  citation: string;
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

export function paperPdfHref(paper: PaperEntry): string {
  const href = paper.data.pdf.trim();
  return /^https?:\/\//i.test(href) ? href : withBase(href);
}

export function formatPaperDate(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) {
    return "Date not provided";
  }

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = isoDate
    ? new Date(Date.UTC(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3])))
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function repositoryIssueLabel(paper: PaperEntry): string | null {
  if (!paper.data.volume || !paper.data.issue) {
    return null;
  }
  return `Volume ${paper.data.volume}, Issue ${paper.data.issue}`;
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

function citationYear(paper: PaperEntry): string {
  const publishedYear = paper.data.published_at?.trim().match(/^(\d{4})/)?.[1];
  if (publishedYear) {
    return publishedYear;
  }

  return getIssueLabelForPaper(paper).match(/(\d{4})/)?.[1] ?? "n.d.";
}

function splitAuthor(author: string): { given: string; family: string } {
  const parts = author.trim().split(/\s+/);
  const family = parts.pop() ?? author.trim();
  return { given: parts.join(" "), family };
}

function initials(given: string): string {
  return given
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toLocaleUpperCase() ?? ""}.`)
    .join(" ");
}

function joinWithFinal(items: string[], conjunction: string): string {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]}, ${conjunction} ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items.at(-1)}`;
}

function apaAuthors(authors: string[]): string {
  const names = authors.map((author) => {
    const { given, family } = splitAuthor(author);
    return `${family}, ${initials(given)}`.trim();
  });
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  return `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}`;
}

function repositoryAuthors(authors: string[]): string {
  return authors
    .map((author) => {
      const { given, family } = splitAuthor(author);
      return `${family}, ${initials(given)}`.trim();
    })
    .join(", ");
}

function invertedFirstAuthor(authors: string[], shortenAfterTwo = false): string {
  const [first, ...rest] = authors;
  if (!first) {
    return "";
  }

  const { given, family } = splitAuthor(first);
  const inverted = `${family}, ${given}`.trim();
  if (shortenAfterTwo && authors.length >= 3) {
    return `${inverted}, et al.`;
  }
  return joinWithFinal([inverted, ...rest], "and");
}

function withTerminalPeriod(value: string): string {
  return value.endsWith(".") ? value : `${value}.`;
}

function apaSentenceCase(title: string): string {
  const sentenceCase = title
    .toLocaleLowerCase()
    .replace(/(^|[:?!]\s+)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase()}`);

  return sentenceCase
    .replace(/\bu\.s\./g, "U.S.")
    .replace(/\b(ai|nba|mlb|ncaa|ols)\b/gi, (value) => value.toLocaleUpperCase())
    .replace(/\blas vegas\b/gi, "Las Vegas")
    .replace(/\bmarch madness\b/gi, "March Madness")
    .replace(/\bnevada\b/gi, "Nevada")
    .replace(/\bcraigslist\b/gi, "Craigslist");
}

function citationPages(paper: PaperEntry): string | null {
  return paper.data.pages?.trim().replace(/(\d)\s*-\s*(\d)/g, "$1–$2") ?? null;
}

function citationPersistentUrl(paper: PaperEntry): string {
  const oasisUrl = paper.data.oasis_url?.trim();
  const url = OASIS_MIRROR_ACTIVE && oasisUrl ? oasisUrl : paperHref(paper);
  return paper.data.doi ? `https://doi.org/${paper.data.doi}` : url;
}

export function formatCitations(paper: PaperEntry): CitationOption[] {
  const title = cleanPaperTitle(paper.data.title);
  const year = citationYear(paper);
  const volume = paper.data.volume;
  const issue = paper.data.issue;
  const pages = citationPages(paper);
  const persistentUrl = citationPersistentUrl(paper);
  const series = "UNLV Undergraduate Economics Working Paper Series";
  const repositoryPublication = volume && issue
    ? `${series}, ${volume}(${issue})${pages ? `, ${pages}` : ""}.`
    : `${series}.`;
  const mlaPublication = [
    series,
    volume ? `vol. ${volume}` : null,
    issue ? `no. ${issue}` : null,
    year,
    pages ? `pp. ${pages}` : null,
  ].filter(Boolean).join(", ");
  const chicagoPublication = volume
    ? `${series} ${volume}${issue ? ` (${issue})` : ""}${pages ? `: ${pages}` : ""}.`
    : `${series}.`;

  return [
    {
      id: "repository",
      label: "OASIS repository",
      citation: `${repositoryAuthors(paper.data.authors)} (${year}). ${title}. ${repositoryPublication} Available at: ${persistentUrl}`,
    },
    {
      id: "apa",
      label: "APA 7th",
      citation: `${apaAuthors(paper.data.authors)} (${year}). ${apaSentenceCase(title)}. ${repositoryPublication} ${persistentUrl}`,
    },
    {
      id: "mla",
      label: "MLA 9th",
      citation: `${withTerminalPeriod(invertedFirstAuthor(paper.data.authors, true))} “${title}.” ${mlaPublication}. ${persistentUrl}`,
    },
    {
      id: "chicago",
      label: "Chicago 17th (author-date)",
      citation: `${invertedFirstAuthor(paper.data.authors)}. ${year}. “${title}.” ${chicagoPublication} ${persistentUrl}`,
    },
  ];
}

export function formatCitation(paper: PaperEntry): string {
  return formatCitations(paper)[0].citation;
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
