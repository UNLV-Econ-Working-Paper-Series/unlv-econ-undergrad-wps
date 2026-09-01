import { normalizeDoi } from "./urls";
import { normalizePaperTitle, normalizeWhitespace } from "./title";
import type { PublicationRecord } from "./types";
import { currentVersionLabel } from "./versions";

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function buildSearchIndexText(record: PublicationRecord): string {
  const historical = record.historical_provenance;
  const values: Array<string | undefined> = [
    normalizePaperTitle(record.title),
    ...record.authors.flatMap((author) => [author.name, author.affiliation]),
    record.abstract,
    ...record.keywords,
    record.field,
    record.issue_term,
    record.issue_slug,
    String(record.volume),
    String(record.issue_number),
    record.series_number,
    record.doi ? normalizeDoi(record.doi) : undefined,
    record.faculty_sponsor?.name,
    record.rights_statement,
    record.copyright_holder,
    record.conflict_statement,
    record.ai_disclosure,
    record.ethics_statement,
    record.data_availability,
    record.code_availability,
    currentVersionLabel(record.current_version),
    record.current_version.note,
    ...record.previous_versions.flatMap((version) => [version.label, version.status, version.note]),
    historical?.source_name,
    historical?.original_term,
    historical?.note,
  ];
  return normalizeSearchText(
    values
      .filter((value): value is string => Boolean(value))
      .map(normalizeWhitespace)
      .join(" "),
  );
}
