import { normalizeIsoDate } from "./dates";
import { normalizeWhitespace } from "./title";
import type {
  CurrentPublicationVersion,
  PreviousPublicationVersion,
  PreviousVersionStatus,
  PublicationRecord,
} from "./types";

const STATUS_LABELS: Readonly<Record<PreviousVersionStatus, string>> = {
  superseded: "Superseded",
  corrected: "Corrected",
  withdrawn: "Withdrawn",
};

export interface VersionTimelineEntry {
  label: string;
  publishedAt: string;
  note?: string;
  status: "current" | PreviousVersionStatus;
  publicUrl?: string;
  oasisUrl?: string;
}

export function currentVersionLabel(version: CurrentPublicationVersion): string {
  return normalizeWhitespace(version.label ?? "") || "Current version";
}

export function previousVersionStatusLabel(status: PreviousVersionStatus): string {
  return STATUS_LABELS[status];
}

export function validateVersionHistory(
  current: CurrentPublicationVersion,
  previous: readonly PreviousPublicationVersion[],
): void {
  const currentDate = normalizeIsoDate(current.published_at, "current_version.published_at");
  const currentLabel = current.label ? normalizeWhitespace(current.label) : "";
  if (current.label !== undefined && !currentLabel) {
    throw new Error("current_version.label must not be blank when provided.");
  }
  if (!current.oasis_url.trim() || !current.pdf_url.trim()) {
    throw new Error("Current version requires OAsis and PDF URLs.");
  }

  const labels = new Set<string>();
  for (const [index, version] of previous.entries()) {
    const label = normalizeWhitespace(version.label);
    const note = normalizeWhitespace(version.note);
    if (!label) throw new Error(`previous_versions[${index}].label must not be blank.`);
    if (!note) throw new Error(`previous_versions[${index}].note must not be blank.`);
    const key = label.toLocaleLowerCase("en-US");
    if (labels.has(key) || (currentLabel && key === currentLabel.toLocaleLowerCase("en-US"))) {
      throw new Error(`Duplicate version label: ${JSON.stringify(label)}.`);
    }
    labels.add(key);
    const previousDate = normalizeIsoDate(version.published_at, `previous_versions[${index}].published_at`);
    if (previousDate > currentDate) {
      throw new Error(`Previous version ${JSON.stringify(label)} cannot postdate the current version.`);
    }
    if (!STATUS_LABELS[version.status]) {
      throw new Error(`Unknown previous-version status: ${JSON.stringify(version.status)}.`);
    }
  }
}

export function versionTimeline(
  record: Pick<PublicationRecord, "current_version" | "previous_versions">,
): VersionTimelineEntry[] {
  validateVersionHistory(record.current_version, record.previous_versions);
  const previous = record.previous_versions
    .map((version) => ({
      label: normalizeWhitespace(version.label),
      publishedAt: normalizeIsoDate(version.published_at),
      note: normalizeWhitespace(version.note),
      status: version.status,
      ...(version.public_url ? { publicUrl: version.public_url } : {}),
      ...(version.oasis_url ? { oasisUrl: version.oasis_url } : {}),
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return [
    {
      label: currentVersionLabel(record.current_version),
      publishedAt: normalizeIsoDate(record.current_version.published_at),
      ...(record.current_version.note ? { note: normalizeWhitespace(record.current_version.note) } : {}),
      status: "current",
      oasisUrl: record.current_version.oasis_url,
    },
    ...previous,
  ];
}
