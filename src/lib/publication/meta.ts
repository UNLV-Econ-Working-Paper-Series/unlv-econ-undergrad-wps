import { authorMachineMetadata } from "./authors";
import { citationPublicationDate, normalizeIsoDate } from "./dates";
import { normalizePaperTitle, normalizeWhitespace } from "./title";
import type { MetaTagData, PublicationRecord } from "./types";
import { normalizeDoi } from "./urls";
import { SERIES_TITLE } from "./citations";

export const TECHNICAL_REPORT_INSTITUTION =
  "Molasky Family Department of Economics and Real Estate, University of Nevada, Las Vegas";

function absoluteUrl(value: string, label: string): URL {
  try {
    const url = new URL(value);
    if (!/^https?:$/u.test(url.protocol)) throw new Error();
    return url;
  } catch {
    throw new Error(`${label} must be an absolute HTTP(S) URL.`);
  }
}

function pageParts(value: string | undefined): { first?: string; last?: string } {
  if (!value) return {};
  const match = normalizeWhitespace(value).match(/^(.+?)\s*[-–—]\s*(.+)$/u);
  return match ? { first: match[1], last: match[2] } : { first: normalizeWhitespace(value) };
}

export interface ScholarlyMetaOptions {
  canonicalUrl: string;
  citationPdfUrl?: string;
  allowCrossDomainPdf?: boolean;
}

export function buildScholarlyMetaTags(
  record: PublicationRecord,
  options: ScholarlyMetaOptions,
): MetaTagData[] {
  const canonical = absoluteUrl(options.canonicalUrl, "canonicalUrl");
  const tags: MetaTagData[] = [
    { name: "citation_title", content: normalizePaperTitle(record.title) },
    { name: "citation_publication_date", content: citationPublicationDate(record) },
    { name: "citation_online_date", content: normalizeIsoDate(record.repository_published_at, "repository_published_at") },
    { name: "citation_journal_title", content: SERIES_TITLE },
    { name: "citation_volume", content: String(record.volume) },
    { name: "citation_issue", content: String(record.issue_number) },
    { name: "citation_technical_report_institution", content: TECHNICAL_REPORT_INSTITUTION },
    { name: "citation_technical_report_number", content: record.series_number },
    { name: "citation_abstract_html_url", content: canonical.toString() },
    { name: "citation_keywords", content: record.keywords.map(normalizeWhitespace).join("; ") },
    { name: "citation_language", content: "en" },
  ];

  for (const author of authorMachineMetadata(record.authors)) {
    tags.push({ name: "citation_author", content: author.name });
    if (author.affiliation) {
      tags.push({ name: "citation_author_institution", content: author.affiliation });
    }
    if (author.orcid) tags.push({ name: "citation_author_orcid", content: author.orcid });
  }

  const pages = pageParts(record.pages);
  if (pages.first) tags.push({ name: "citation_firstpage", content: pages.first });
  if (pages.last) tags.push({ name: "citation_lastpage", content: pages.last });
  if (record.doi) tags.push({ name: "citation_doi", content: normalizeDoi(record.doi) });

  if (options.citationPdfUrl) {
    const pdf = absoluteUrl(options.citationPdfUrl, "citationPdfUrl");
    const sameOrigin = pdf.origin === canonical.origin;
    if (sameOrigin || options.allowCrossDomainPdf === true) {
      tags.push({ name: "citation_pdf_url", content: pdf.toString() });
    }
  }

  return tags;
}
