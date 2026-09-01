import { citationYear } from "./dates";
import { normalizePaperTitle, normalizeWhitespace } from "./title";
import type { PublicationRecord } from "./types";
import { citationPersistentUrl, SERIES_TITLE } from "./citations";
import { normalizeDoi } from "./urls";
import { currentVersionLabel } from "./versions";

const BIBTEX_ESCAPES: Readonly<Record<string, string>> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "#": "\\#",
  "%": "\\%",
  "_": "\\_",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escapeBibTeX(value: string): string {
  return normalizeWhitespace(value).replace(/[\\{}$&#%_~^]/gu, (character) => BIBTEX_ESCAPES[character]);
}

export function bibTeXKey(seriesNumber: string): string {
  return seriesNumber.replace(/[^A-Za-z0-9]+/gu, "");
}

export function generateBibTeX(record: PublicationRecord): string {
  const fields: Array<[string, string, protectCapitalization?: boolean]> = [
    ["title", normalizePaperTitle(record.title), true],
    ["author", record.authors.map((author) => normalizeWhitespace(author.name)).join(" and ")],
    ["year", citationYear(record)],
    ["date", record.citable_published_at],
    ["type", "Working paper"],
    ["series", SERIES_TITLE],
    ["number", record.series_number],
    ["volume", String(record.volume)],
    ["issue", String(record.issue_number)],
    ["url", citationPersistentUrl(record)],
  ];

  if (record.pages) fields.push(["pages", record.pages.replace(/\s*[-–—]\s*/gu, "--")]);
  if (record.doi) fields.push(["doi", normalizeDoi(record.doi)]);
  const version = currentVersionLabel(record.current_version);
  if (version !== "Current version" || record.current_version.note) {
    fields.push([
      "note",
      [version !== "Current version" ? version : null, record.current_version.note].filter(Boolean).join(": "),
    ]);
  }

  const body = fields
    .map(([key, value, protectCapitalization]) => {
      const escaped = escapeBibTeX(value);
      return `  ${key} = {${protectCapitalization ? `{${escaped}}` : escaped}},`;
    })
    .join("\n")
    .replace(/,(\n?)$/u, "$1");
  return `@techreport{${bibTeXKey(record.series_number)},\n${body}\n}`;
}

export function generateBibTeXCollection(records: readonly PublicationRecord[]): string {
  if (records.length === 0) return "";
  return `${records.map(generateBibTeX).join("\n\n")}\n`;
}
