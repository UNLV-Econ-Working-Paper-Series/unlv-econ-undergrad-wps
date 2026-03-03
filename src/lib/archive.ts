import { ARCHIVE_PAPERS, type ArchivePaper } from "../data/archive-papers";

export interface ArchiveIssueGroup {
  slug: string;
  label: string;
  year: number;
  term: string;
  papers: ArchivePaper[];
  categories: string[];
}

const TERM_ORDER: Record<string, number> = {
  spring: 1,
  summer: 2,
  fall: 3,
  winter: 4,
};

const CATEGORY_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Applied Micro", pattern: /(consumer|behavior|crime|child|housing|taxi|animal|hummus|marijuana|fighter|film|market)/i },
  { label: "Finance", pattern: /(revenue|salary|wealth|wage|risk|contract|earnings)/i },
  { label: "Methods", pattern: /(analysis|model|determinants|expectation|patterns|hedonic)/i },
  { label: "Labor", pattern: /(wage|labor|employment|gender)/i },
  { label: "IO & Strategy", pattern: /(industry|opec|oil|ufc|baseball|business)/i },
  { label: "Policy", pattern: /(legalization|policy|public|crime|care)/i },
];

function parseSemester(semester: string): { term: string; year: number } {
  const normalized = semester.trim();
  const match = normalized.match(/^(spring|summer|fall|winter)\s+(\d{4})$/i);
  if (!match) {
    return { term: "unknown", year: 0 };
  }

  return {
    term: match[1].toLowerCase(),
    year: Number.parseInt(match[2], 10),
  };
}

function semesterLabel(term: string, year: number): string {
  if (!year || term === "unknown") {
    return "Archive Issue";
  }
  return `${term[0].toUpperCase()}${term.slice(1)} ${year}`;
}

function semesterSlug(semester: string): string {
  return semester
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function inferCategories(title: string): string[] {
  const matches = CATEGORY_RULES.filter((rule) => rule.pattern.test(title)).map((rule) => rule.label);
  if (matches.length === 0) {
    return ["Applied Micro"];
  }
  return [...new Set(matches)];
}

export function getArchiveIssueGroups(): ArchiveIssueGroup[] {
  const bySemester = new Map<string, ArchiveIssueGroup>();

  for (const paper of ARCHIVE_PAPERS) {
    const semester = paper.semester?.trim() || `Archive ${paper.year}`;
    const parsed = parseSemester(semester);
    const slug = semesterSlug(semester);

    const existing = bySemester.get(slug);
    if (existing) {
      existing.papers.push(paper);
      const tags = new Set(existing.categories);
      for (const category of inferCategories(paper.title)) {
        tags.add(category);
      }
      existing.categories = [...tags].sort((a, b) => a.localeCompare(b));
      continue;
    }

    bySemester.set(slug, {
      slug,
      label: semesterLabel(parsed.term, parsed.year || paper.year),
      year: parsed.year || paper.year,
      term: parsed.term,
      papers: [paper],
      categories: inferCategories(paper.title),
    });
  }

  return [...bySemester.values()].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return (TERM_ORDER[b.term] ?? 0) - (TERM_ORDER[a.term] ?? 0);
  });
}
