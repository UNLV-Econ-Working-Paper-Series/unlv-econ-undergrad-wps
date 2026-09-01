import { getCollection, type CollectionEntry } from "astro:content";
import { ISSUE_DEFINITIONS, definedIssueLabel } from "../data/issues";
import {
  buildCitationOptions,
  buildRepositoryCitation,
  formatIsoDate,
  issueLabel,
  normalizePaperTitle,
  parseIssueSlug,
  parseSeriesIdentifier,
  researchFieldSlug,
  volumeIssueLabel,
  type CitationOption,
  type CitationStyle,
  type ResearchField,
} from "./publication";
import { withBase } from "./urls";

export type PaperEntry = CollectionEntry<"papers">;
export type { CitationOption, CitationStyle };

export interface IssueGroup {
  slug: string;
  label: string;
  year: number | null;
  term: string;
  papers: PaperEntry[];
  sortKey: number;
}

export interface FieldGroup {
  name: ResearchField;
  slug: string;
  count: number;
  papers: PaperEntry[];
}

// Transitional name retained only for internal imports while legacy category
// routes redirect to the controlled Research Fields routes.
export type CategoryGroup = FieldGroup;

export interface SemesterGroup {
  semester: string;
  papers: PaperEntry[];
  sortKey: number;
}

const TERM_ORDER: Readonly<Record<string, number>> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

function issueSortKey(slug: string): number {
  const parsed = parseIssueSlug(slug);
  return parsed ? parsed.year * 10 + (TERM_ORDER[parsed.term] ?? 0) : 0;
}

function citableTime(paper: PaperEntry): number {
  return Date.parse(`${paper.data.citable_published_at}T00:00:00Z`);
}

function seriesSequence(paper: PaperEntry): number {
  return parseSeriesIdentifier(paper.data.series_number).sequence;
}

function comparePapersNewest(a: PaperEntry, b: PaperEntry): number {
  const dateDifference = citableTime(b) - citableTime(a);
  if (dateDifference !== 0) return dateDifference;
  return seriesSequence(b) - seriesSequence(a);
}

function comparePapersInIssue(a: PaperEntry, b: PaperEntry): number {
  const sequenceDifference = seriesSequence(a) - seriesSequence(b);
  return sequenceDifference || normalizePaperTitle(a.data.title).localeCompare(normalizePaperTitle(b.data.title));
}

export const cleanPaperTitle = normalizePaperTitle;
export const formatPaperDate = formatIsoDate;

export function paperSlug(paper: PaperEntry): string {
  return paper.id.replace(/\.(md|mdx)$/iu, "");
}

export function getIssueSlugForPaper(paper: PaperEntry): string {
  return paper.data.issue_slug;
}

export function getIssueLabelForPaper(paper: PaperEntry): string {
  return issueLabel(paper.data.issue_term, paper.data.issue_slug);
}

export function paperHref(paper: PaperEntry): string {
  return withBase(`/papers/${paperSlug(paper)}/`);
}

export function paperPdfHref(paper: PaperEntry): string {
  return paper.data.pdf_url;
}

export function repositoryIssueLabel(paper: PaperEntry): string {
  return volumeIssueLabel(paper.data.volume, paper.data.issue_number);
}

export function formatCitations(paper: PaperEntry): CitationOption[] {
  return buildCitationOptions(paper.data);
}

export function formatCitation(paper: PaperEntry): string {
  return buildRepositoryCitation(paper.data);
}

export async function getAllPapers(): Promise<PaperEntry[]> {
  return [...(await getCollection("papers"))].sort(comparePapersNewest);
}

export async function getIssueGroups(): Promise<IssueGroup[]> {
  const papers = await getAllPapers();
  const groups = new Map<string, IssueGroup>();

  for (const paper of papers) {
    const slug = paper.data.issue_slug;
    const parsed = parseIssueSlug(slug);
    const existing = groups.get(slug);
    if (existing) {
      existing.papers.push(paper);
      continue;
    }
    groups.set(slug, {
      slug,
      label: issueLabel(paper.data.issue_term, slug),
      year: parsed?.year ?? null,
      term: parsed?.term ?? paper.data.issue_term,
      papers: [paper],
      sortKey: issueSortKey(slug),
    });
  }

  for (const issue of ISSUE_DEFINITIONS) {
    if (groups.has(issue.slug)) continue;
    const parsed = parseIssueSlug(issue.slug);
    groups.set(issue.slug, {
      slug: issue.slug,
      label: definedIssueLabel(issue.slug) ?? issue.label,
      year: parsed?.year ?? null,
      term: parsed?.term ?? "unknown",
      papers: [],
      sortKey: issueSortKey(issue.slug),
    });
  }

  return [...groups.values()]
    .map((group) => ({ ...group, papers: [...group.papers].sort(comparePapersInIssue) }))
    .sort((a, b) => b.sortKey - a.sortKey || a.label.localeCompare(b.label));
}

export async function getFieldGroups(): Promise<FieldGroup[]> {
  const papers = await getAllPapers();
  const groups = new Map<ResearchField, PaperEntry[]>();
  for (const paper of papers) {
    const existing = groups.get(paper.data.field) ?? [];
    existing.push(paper);
    groups.set(paper.data.field, existing);
  }
  return [...groups.entries()]
    .map(([name, fieldPapers]) => ({
      name,
      slug: researchFieldSlug(name),
      count: fieldPapers.length,
      papers: [...fieldPapers].sort(comparePapersNewest),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const getCategoryGroups = getFieldGroups;

export function groupPapersBySemester(papers: PaperEntry[]): SemesterGroup[] {
  const groups = new Map<string, SemesterGroup>();
  for (const paper of papers) {
    const semester = paper.data.issue_term;
    const existing = groups.get(semester);
    if (existing) {
      existing.papers.push(paper);
      continue;
    }
    groups.set(semester, {
      semester,
      papers: [paper],
      sortKey: issueSortKey(paper.data.issue_slug),
    });
  }
  return [...groups.values()]
    .map((group) => ({ ...group, papers: [...group.papers].sort(comparePapersInIssue) }))
    .sort((a, b) => b.sortKey - a.sortKey || b.semester.localeCompare(a.semester));
}
