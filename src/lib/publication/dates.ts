import type { PublicationRecord } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/u;

export function normalizeIsoDate(value: string, fieldName = "date"): string {
  const normalized = value.trim();
  const match = normalized.match(ISO_DATE);
  if (!match) throw new Error(`${fieldName} must be an ISO date in YYYY-MM-DD format.`);

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`${fieldName} is not a valid calendar date.`);
  }
  return normalized;
}

export function formatIsoDate(value: string | undefined, fallback = "Date not available"): string {
  if (!value?.trim()) return fallback;
  const iso = normalizeIsoDate(value);
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function issuePublicationDate(record: Pick<PublicationRecord, "issue_published_at">): string | null {
  return record.issue_published_at ? normalizeIsoDate(record.issue_published_at, "issue_published_at") : null;
}

export function citationPublicationDate(record: Pick<PublicationRecord, "citable_published_at">): string {
  return normalizeIsoDate(record.citable_published_at, "citable_published_at");
}

export function citationYear(record: Pick<PublicationRecord, "citable_published_at">): string {
  return citationPublicationDate(record).slice(0, 4);
}

export interface PublicationDateSet {
  issue: string | null;
  citable: string;
  repository: string;
  currentVersion: string;
  historicalOriginal: string | null;
  migrated: string | null;
}

export function publicationDateSet(record: PublicationRecord): PublicationDateSet {
  return {
    issue: issuePublicationDate(record),
    citable: normalizeIsoDate(record.citable_published_at, "citable_published_at"),
    repository: normalizeIsoDate(record.repository_published_at, "repository_published_at"),
    currentVersion: normalizeIsoDate(record.current_version.published_at, "current_version.published_at"),
    historicalOriginal: record.historical_provenance?.original_publication_date
      ? normalizeIsoDate(
          record.historical_provenance.original_publication_date,
          "historical_provenance.original_publication_date",
        )
      : null,
    migrated: record.historical_provenance?.migrated_at
      ? normalizeIsoDate(record.historical_provenance.migrated_at, "historical_provenance.migrated_at")
      : null,
  };
}
