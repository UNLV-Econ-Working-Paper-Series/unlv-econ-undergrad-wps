import { authorMachineMetadata } from "./authors";
import { normalizePaperTitle, normalizeWhitespace } from "./title";
import type { PublicationRecord } from "./types";
import { citationPublicationDate } from "./dates";
import { doiUrl, normalizeDoi, normalizeOasisUrl } from "./urls";
import { currentVersionLabel } from "./versions";
import { SERIES_TITLE } from "./citations";

function absoluteHttpUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be an absolute URL.`);
  }
  if (!/^https?:$/u.test(url.protocol)) throw new Error(`${label} must use HTTP or HTTPS.`);
  return url.toString();
}

export interface JsonLdOptions {
  canonicalUrl: string;
}

export function buildScholarlyJsonLd(
  record: PublicationRecord,
  options: JsonLdOptions,
): Record<string, unknown> {
  const canonicalUrl = absoluteHttpUrl(options.canonicalUrl, "canonicalUrl");
  const authors = authorMachineMetadata(record.authors).map((author) => ({
    "@type": "Person",
    name: author.name,
    ...(author.orcid ? { sameAs: absoluteHttpUrl(author.orcid, "author ORCID") } : {}),
    ...(author.affiliation
      ? { affiliation: { "@type": "Organization", name: author.affiliation } }
      : {}),
  }));
  const identifiers: Array<Record<string, string>> = [
    { "@type": "PropertyValue", propertyID: "Series number", value: record.series_number },
  ];
  if (record.doi) {
    identifiers.push({ "@type": "PropertyValue", propertyID: "DOI", value: normalizeDoi(record.doi) });
  }

  const sameAs = [normalizeOasisUrl(record.oasis_url), ...(record.doi ? [doiUrl(record.doi)] : [])];
  const priorPublicUrls = record.previous_versions.flatMap((version) => {
    if (version.public_url) return [absoluteHttpUrl(version.public_url, "previous version public_url")];
    if (version.oasis_url) return [normalizeOasisUrl(version.oasis_url)];
    return [];
  });
  const historical = record.historical_provenance;

  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": canonicalUrl,
    url: canonicalUrl,
    name: normalizePaperTitle(record.title),
    headline: normalizePaperTitle(record.title),
    description: normalizeWhitespace(record.abstract),
    author: authors,
    identifier: identifiers,
    sameAs,
    datePublished: citationPublicationDate(record),
    dateModified: record.current_version.published_at,
    version: currentVersionLabel(record.current_version),
    keywords: record.keywords.map(normalizeWhitespace),
    about: { "@type": "Thing", name: record.field },
    isPartOf: {
      "@type": "PublicationIssue",
      issueNumber: String(record.issue_number),
      name: normalizeWhitespace(record.issue_term),
      isPartOf: {
        "@type": "PublicationVolume",
        volumeNumber: String(record.volume),
        name: SERIES_TITLE,
      },
    },
    ...(record.license_url ? { license: absoluteHttpUrl(record.license_url, "license_url") } : {}),
    ...(record.rights_statement ? { copyrightNotice: normalizeWhitespace(record.rights_statement) } : {}),
    ...(priorPublicUrls.length > 0 ? { citation: priorPublicUrls } : {}),
    ...(historical?.original_url
      ? { isBasedOn: absoluteHttpUrl(historical.original_url, "historical_provenance.original_url") }
      : {}),
    ...(historical?.original_publication_date
      ? { dateCreated: historical.original_publication_date }
      : {}),
  };
}
