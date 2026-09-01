import {
  formatInvertedAuthor,
  joinHumanList,
  parsePersonName,
  authorInitials,
  validateAuthors,
} from "./authors";
import { citationYear } from "./dates";
import { normalizePaperTitle, normalizeWhitespace, quoteTitle, withTerminalPunctuation } from "./title";
import type { CitationOption, PublicationAuthor, PublicationRecord } from "./types";
import { doiUrl, normalizeOasisUrl } from "./urls";

export const SERIES_TITLE = "UNLV Undergraduate Economics Working Paper Series";

function normalizedPages(value: string | undefined): string | null {
  const pages = value ? normalizeWhitespace(value) : "";
  return pages ? pages.replace(/(\d)\s*[-–—]\s*(\d)/gu, "$1–$2") : null;
}

function apaAuthor(author: PublicationAuthor): string {
  const { family, given, suffix } = parsePersonName(author.name);
  const main = `${family}, ${authorInitials(given)}`.trim();
  return suffix ? `${main}, ${suffix}` : main;
}

function apaAuthors(authors: readonly PublicationAuthor[]): string {
  validateAuthors(authors);
  const values = authors.map(apaAuthor);
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")}, & ${values.at(-1)}`;
}

function repositoryAuthors(authors: readonly PublicationAuthor[]): string {
  validateAuthors(authors);
  return authors.map(apaAuthor).join(", ");
}

function mlaAuthors(authors: readonly PublicationAuthor[]): string {
  validateAuthors(authors);
  const first = formatInvertedAuthor(authors[0]);
  if (authors.length === 1) return first;
  if (authors.length >= 3) return `${first}, et al.`;
  return `${first}, and ${normalizeWhitespace(authors[1].name)}`;
}

function chicagoAuthors(authors: readonly PublicationAuthor[]): string {
  validateAuthors(authors);
  const [first, ...rest] = authors;
  return joinHumanList([
    formatInvertedAuthor(first),
    ...rest.map((author) => normalizeWhitespace(author.name)),
  ]);
}

export function citationPersistentUrl(record: Pick<PublicationRecord, "doi" | "oasis_url">): string {
  return record.doi ? doiUrl(record.doi) : normalizeOasisUrl(record.oasis_url);
}

function seriesReference(
  record: Pick<PublicationRecord, "volume" | "issue_number" | "pages" | "series_number">,
): string {
  const pages = normalizedPages(record.pages);
  return `${SERIES_TITLE}, ${record.volume}(${record.issue_number})${pages ? `, ${pages}` : ""} (${record.series_number}).`;
}

export function buildCitationOptions(record: PublicationRecord): CitationOption[] {
  const title = normalizePaperTitle(record.title);
  const year = citationYear(record);
  const pages = normalizedPages(record.pages);
  const persistentUrl = citationPersistentUrl(record);
  const series = seriesReference(record);

  const mlaPublication = [
    SERIES_TITLE,
    `vol. ${record.volume}`,
    `no. ${record.issue_number}`,
    year,
    pages ? `pp. ${pages}` : null,
    record.series_number,
  ]
    .filter(Boolean)
    .join(", ");

  const chicagoPublication = `${SERIES_TITLE} ${record.volume} (${record.issue_number})${pages ? `: ${pages}` : ""}, ${record.series_number}.`;

  return [
    {
      id: "repository",
      label: "OAsis repository",
      citation: `${repositoryAuthors(record.authors)} (${year}). ${withTerminalPunctuation(title)} ${series} ${persistentUrl}`,
    },
    {
      id: "apa",
      label: "APA 7th",
      citation: `${apaAuthors(record.authors)} (${year}). ${withTerminalPunctuation(title)} ${series} ${persistentUrl}`,
    },
    {
      id: "mla",
      label: "MLA 9th",
      citation: `${withTerminalPunctuation(mlaAuthors(record.authors))} ${quoteTitle(title)}. ${mlaPublication}. ${persistentUrl}`,
    },
    {
      id: "chicago",
      label: "Chicago 17th (author-date)",
      citation: `${withTerminalPunctuation(chicagoAuthors(record.authors))} ${year}. ${quoteTitle(title)}. ${chicagoPublication} ${persistentUrl}`,
    },
  ];
}

export function buildRepositoryCitation(record: PublicationRecord): string {
  return buildCitationOptions(record)[0].citation;
}
