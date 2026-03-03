export interface IssueDefinition {
  slug: string;
  label: string;
  description?: string;
}

export const ISSUE_DEFINITIONS: IssueDefinition[] = [
  {
    slug: "2025-fall",
    label: "Fall 2025",
    description: "Student research from the Fall 2025 ECON 495 capstone cohort.",
  },
  {
    slug: "2025-spring",
    label: "Spring 2025",
    description: "Research from Spring 2025.",
  },
  {
    slug: "2024-spring",
    label: "Spring 2024",
    description: "Student research from the Spring 2024 ECON 495 cohort.",
  },
];

const issueLabelBySlug = new Map(ISSUE_DEFINITIONS.map((item) => [item.slug, item.label]));

export function definedIssueLabel(slug: string): string | undefined {
  return issueLabelBySlug.get(slug);
}
