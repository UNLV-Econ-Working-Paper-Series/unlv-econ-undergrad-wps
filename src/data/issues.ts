export interface IssueDefinition {
  slug: string;
  label: string;
  description?: string;
}

export const ISSUE_YEARS: number[] = [2026, 2025, 2024];

export const ISSUE_DEFINITIONS: IssueDefinition[] = [
  {
    slug: "2026-spring",
    label: "Spring 2026",
  },
  {
    slug: "2024-spring",
    label: "Spring 2024",
  },
];

const issueLabelBySlug = new Map(ISSUE_DEFINITIONS.map((item) => [item.slug, item.label]));

export function definedIssueLabel(slug: string): string | undefined {
  return issueLabelBySlug.get(slug);
}
