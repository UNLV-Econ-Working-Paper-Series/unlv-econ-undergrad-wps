import { citationYear } from "./dates";
import { normalizePaperTitle, normalizeWhitespace } from "./title";
import type { PublicationRecord } from "./types";
import { citationPersistentUrl, SERIES_TITLE } from "./citations";
import { normalizeDoi } from "./urls";
import { currentVersionLabel } from "./versions";

export function escapeRis(value: string): string {
  return normalizeWhitespace(value.replace(/[\u0000-\u001f\u007f]+/gu, " "));
}

function risLine(tag: string, value: string | number): string {
  return `${tag}  - ${escapeRis(String(value))}`;
}

function pageParts(value: string | undefined): { start?: string; end?: string } {
  if (!value) return {};
  const normalized = normalizeWhitespace(value);
  const match = normalized.match(/^(.+?)\s*[-–—]\s*(.+)$/u);
  return match ? { start: match[1], end: match[2] } : { start: normalized };
}

export function generateRis(record: PublicationRecord): string {
  const lines = [
    risLine("TY", "RPRT"),
    ...record.authors.map((author) => risLine("AU", author.name)),
    risLine("TI", normalizePaperTitle(record.title)),
    risLine("T2", SERIES_TITLE),
    risLine("PY", citationYear(record)),
    risLine("DA", record.citable_published_at.replace(/-/gu, "/")),
    risLine("VL", record.volume),
    risLine("IS", record.issue_number),
    risLine("M3", record.series_number),
  ];
  const pages = pageParts(record.pages);
  if (pages.start) lines.push(risLine("SP", pages.start));
  if (pages.end) lines.push(risLine("EP", pages.end));
  if (record.doi) lines.push(risLine("DO", normalizeDoi(record.doi)));
  lines.push(risLine("UR", citationPersistentUrl(record)));
  for (const keyword of record.keywords) lines.push(risLine("KW", keyword));
  const version = currentVersionLabel(record.current_version);
  if (version !== "Current version" || record.current_version.note) {
    lines.push(risLine("N1", [version, record.current_version.note].filter(Boolean).join(": ")));
  }
  lines.push("ER  -");
  return `${lines.join("\n")}\n`;
}

export function generateRisCollection(records: readonly PublicationRecord[]): string {
  return records.map(generateRis).join("\n");
}
