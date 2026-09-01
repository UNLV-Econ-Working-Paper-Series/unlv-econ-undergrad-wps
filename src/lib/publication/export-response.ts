import type { PublicationRecord } from "./types";
import { generateBibTeXCollection } from "./bibtex";
import { generateRisCollection } from "./ris";

export type CitationExportFormat = "bibtex" | "ris";

const FORMAT = {
  bibtex: {
    extension: "bib",
    mediaType: "application/x-bibtex",
  },
  ris: {
    extension: "ris",
    mediaType: "application/x-research-info-systems",
  },
} as const;

function safeDownloadStem(value: string): string {
  const normalized = value.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(normalized)) {
    throw new Error(`Unsafe citation download filename: ${JSON.stringify(value)}.`);
  }
  return normalized;
}

export function citationExportHref(
  kind: "paper" | "issue",
  slug: string,
  format: CitationExportFormat,
): string {
  const safeSlug = safeDownloadStem(slug);
  const filename = format === "bibtex" ? "citation.bib" : "citation.ris";
  return kind === "paper"
    ? `/papers/${safeSlug}/${filename}`
    : `/issues/${safeSlug}/${format === "bibtex" ? "citations.bib" : "citations.ris"}`;
}

export function buildCitationExportResponse(
  records: readonly PublicationRecord[],
  format: CitationExportFormat,
  downloadStem: string,
): Response {
  const safeStem = safeDownloadStem(downloadStem);
  const definition = FORMAT[format];
  const body = format === "bibtex" ? generateBibTeXCollection(records) : generateRisCollection(records);

  return new Response(body, {
    headers: {
      "Content-Type": `${definition.mediaType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${safeStem}.${definition.extension}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
