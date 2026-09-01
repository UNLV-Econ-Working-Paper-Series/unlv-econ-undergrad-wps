import { normalizeWhitespace } from "./title";

const TERM_LABELS: Readonly<Record<string, string>> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

export interface ParsedIssueSlug {
  term: string;
  year: number;
  label: string;
}

export function parseIssueSlug(value: string): ParsedIssueSlug | null {
  const match = value.trim().match(/^(\d{4})-(spring|summer|fall|winter)$/iu);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const term = match[2].toLocaleLowerCase("en-US");
  return { term, year, label: `${TERM_LABELS[term]} ${year}` };
}

export function normalizeIssueTerm(value: string): string {
  const term = normalizeWhitespace(value);
  const match = term.match(/^(spring|summer|fall|winter)\s+(\d{4})$/iu);
  if (!match) return term;
  return `${TERM_LABELS[match[1].toLocaleLowerCase("en-US")]} ${match[2]}`;
}

export function issueLabel(issueTerm: string, issueSlug?: string): string {
  const explicit = normalizeIssueTerm(issueTerm);
  if (explicit) return explicit;
  const parsed = issueSlug ? parseIssueSlug(issueSlug) : null;
  return parsed?.label ?? "Issue not specified";
}

export function volumeIssueLabel(volume: number, issueNumber: number): string {
  if (!Number.isInteger(volume) || volume <= 0) throw new Error("Volume must be a positive integer.");
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error("Issue number must be a positive integer.");
  }
  return `Volume ${volume}, Issue ${issueNumber}`;
}
