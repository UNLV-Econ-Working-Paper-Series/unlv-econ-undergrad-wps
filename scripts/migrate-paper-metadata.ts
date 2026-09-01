import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { RESEARCH_FIELD_ALIASES, RESEARCH_FIELDS, type ResearchField } from "../src/config/publication";

type UnknownRecord = Record<string, unknown>;

interface PublicAuthor {
  name: string;
  affiliation?: string;
  orcid?: string;
  institutional_profile?: string;
  public_profile?: string;
}

interface PublicVersion {
  label?: string;
  published_at: string;
  note?: string;
  oasis_url: string;
  pdf_url: string;
}

interface PreviousVersion {
  label: string;
  published_at: string;
  note: string;
  public_url?: string;
  oasis_url?: string;
  status: "superseded" | "corrected" | "withdrawn";
}

interface FacultySponsor {
  name: string;
  profile_url?: string;
}

interface HistoricalProvenance {
  source_name: string;
  original_url?: string;
  original_term: string;
  original_publication_date?: string;
  migrated_at?: string;
  note: string;
}

interface PaperMetadata {
  title: string;
  authors: PublicAuthor[];
  abstract: string;
  keywords: string[];
  field: ResearchField;
  issue_term: string;
  issue_slug: string;
  volume: number;
  issue_number: number;
  series_number: string;
  issue_published_at?: string;
  citable_published_at: string;
  repository_published_at: string;
  current_version: PublicVersion;
  previous_versions: PreviousVersion[];
  faculty_sponsor?: FacultySponsor;
  doi?: string;
  oasis_url: string;
  pdf_url: string;
  pages?: string;
  rights_statement?: string;
  license_url?: string;
  copyright_holder?: string;
  conflict_statement?: string;
  ai_disclosure?: string;
  ethics_statement?: string;
  data_availability?: string;
  code_availability?: string;
  historical_provenance?: HistoricalProvenance;
}

interface PaperFile {
  fileName: string;
  slug: string;
  source: string;
  body: string;
  raw: UnknownRecord;
  metadata?: PaperMetadata;
}

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const PAPER_DIRECTORY = resolve(REPOSITORY_ROOT, "src/content/papers");
const REPORT_PATH = resolve(REPOSITORY_ROOT, "docs/audits/PAPER_METADATA_MIGRATION_REPORT.md");
const INITIAL_REPOSITORY_ONLINE_DATE = "2026-08-05";
const EXPECTED_INITIAL_RECORD_COUNT = 15;

const DEPRECATED_KEYS = new Set(["semester", "category", "advisor", "pdf", "issue", "published_at"]);

const ALLOWED_PAPER_KEYS = new Set([
  "title",
  "authors",
  "abstract",
  "keywords",
  "field",
  "issue_term",
  "issue_slug",
  "volume",
  "issue_number",
  "series_number",
  "issue_published_at",
  "citable_published_at",
  "repository_published_at",
  "current_version",
  "previous_versions",
  "faculty_sponsor",
  "doi",
  "oasis_url",
  "pdf_url",
  "pages",
  "rights_statement",
  "license_url",
  "copyright_holder",
  "conflict_statement",
  "ai_disclosure",
  "ethics_statement",
  "data_availability",
  "code_availability",
  "historical_provenance",
]);

const INITIAL_LEGACY_CATEGORY_BY_SLUG: Readonly<Record<string, string>> = {
  "ai-wage-effects-us-occupations": "Labor and Demography",
  "commercial-bank-failures": "Finance",
  "gambling-losses-future-wagers": "Behavioral & Experimental Economics",
  "hedonics-used-car-attributes": "Applied Microeconomics",
  "key-determinants-diamond-value": "Applied Microeconomics",
  "las-vegas-casino-revenue": "Industrial Organization (IO) & Strategy",
  "march-madness-tournament-advancement": "Applied Microeconomics",
  "mlb-speed-premium": "Labor and Demography",
  "nba-real-team-value": "Industrial Organization (IO) & Strategy",
  "nevada-mining-output-growth": "Environmental and Resource",
  "residential-sale-prices-neighborhood-interior": "Urban, Regional, & Real Estate Economics",
  "rural-metropolitan-gender-wage-gap": "Labor and Demography",
  "social-determinants-educational-attainment": "Education",
  "the-race-for-increasing-college-costs": "Education",
  "used-electric-vehicle-tax-credit": "Public Economics & Policy",
};

const INITIAL_SERIES_NUMBER_BY_SLUG: Readonly<Record<string, string>> = {
  "the-race-for-increasing-college-costs": "UNLV-Econ-WPS-2024-001",
  "used-electric-vehicle-tax-credit": "UNLV-Econ-WPS-2024-002",
  "nba-real-team-value": "UNLV-Econ-WPS-2025-003",
  "hedonics-used-car-attributes": "UNLV-Econ-WPS-2026-004",
  "key-determinants-diamond-value": "UNLV-Econ-WPS-2026-005",
  "rural-metropolitan-gender-wage-gap": "UNLV-Econ-WPS-2026-006",
  "social-determinants-educational-attainment": "UNLV-Econ-WPS-2026-007",
  "ai-wage-effects-us-occupations": "UNLV-Econ-WPS-2026-008",
  "residential-sale-prices-neighborhood-interior": "UNLV-Econ-WPS-2026-009",
  "mlb-speed-premium": "UNLV-Econ-WPS-2026-010",
  "nevada-mining-output-growth": "UNLV-Econ-WPS-2026-011",
  "commercial-bank-failures": "UNLV-Econ-WPS-2026-012",
  "gambling-losses-future-wagers": "UNLV-Econ-WPS-2026-013",
  "las-vegas-casino-revenue": "UNLV-Econ-WPS-2026-014",
  "march-madness-tournament-advancement": "UNLV-Econ-WPS-2026-015",
};

function fail(fileName: string, message: string): never {
  throw new Error(`${fileName}: ${message}`);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: UnknownRecord, key: string, fileName: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(fileName, `missing non-empty string field ${key}`);
  }
  return value;
}

function optionalString(record: UnknownRecord, key: string, fileName: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    fail(fileName, `${key} must be a non-empty string when present`);
  }
  return value;
}

function requirePositiveInteger(record: UnknownRecord, key: string, fileName: string): number {
  const value = record[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    fail(fileName, `${key} must be a positive integer`);
  }
  return value as number;
}

function requireStringArray(record: UnknownRecord, key: string, fileName: string): string[] {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    fail(fileName, `${key} must be a non-empty array of non-empty strings`);
  }
  return value as string[];
}

function validateIsoDate(value: string, label: string, fileName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(fileName, `${label} must use YYYY-MM-DD`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(fileName, `${label} is not a valid calendar date`);
  }
}

function validateUrl(value: string, label: string, fileName: string): void {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      fail(fileName, `${label} must use HTTP or HTTPS`);
    }
  } catch {
    fail(fileName, `${label} must be an absolute URL`);
  }
}

function assertAllowedKeys(
  record: UnknownRecord,
  allowed: ReadonlySet<string>,
  label: string,
  fileName: string,
): void {
  const unexpected = Object.keys(record).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    fail(fileName, `${label} contains unsupported field(s): ${unexpected.join(", ")}`);
  }
}

function normalizeField(value: string, fileName: string): ResearchField {
  if ((RESEARCH_FIELDS as readonly string[]).includes(value)) return value as ResearchField;
  const field = RESEARCH_FIELD_ALIASES[value];
  if (!field) fail(fileName, `unmapped legacy category ${JSON.stringify(value)}`);
  return field;
}

function oasisRecordOrder(oasisUrl: string, fileName: string): number {
  const url = new URL(oasisUrl);
  const match = url.pathname.match(/\/econ_ug_papers\/(\d+)\/?$/);
  if (!match) fail(fileName, "OAsis item URL does not expose a stable public collection-order number");
  return Number(match[1]);
}

function migrateLegacyRecord(paper: PaperFile, seriesNumber: string): PaperMetadata {
  const raw = paper.raw;
  const title = requireString(raw, "title", paper.fileName);
  const authorNames = requireStringArray(raw, "authors", paper.fileName);
  const abstract = requireString(raw, "abstract", paper.fileName);
  const keywords = requireStringArray(raw, "keywords", paper.fileName);
  const issueTerm = requireString(raw, "semester", paper.fileName);
  const category = requireString(raw, "category", paper.fileName);
  const issueSlug = requireString(raw, "issue_slug", paper.fileName);
  const volume = requirePositiveInteger(raw, "volume", paper.fileName);
  const issueNumber = requirePositiveInteger(raw, "issue", paper.fileName);
  const citablePublishedAt = requireString(raw, "published_at", paper.fileName);
  const oasisUrl = requireString(raw, "oasis_url", paper.fileName);
  const pdfUrl = requireString(raw, "pdf", paper.fileName);
  const advisor = optionalString(raw, "advisor", paper.fileName);
  const doi = optionalString(raw, "doi", paper.fileName);
  const pages = optionalString(raw, "pages", paper.fileName);

  validateIsoDate(citablePublishedAt, "legacy published_at", paper.fileName);
  validateUrl(oasisUrl, "oasis_url", paper.fileName);
  validateUrl(pdfUrl, "pdf", paper.fileName);

  return {
    title,
    authors: authorNames.map((name) => ({ name })),
    abstract,
    keywords,
    field: normalizeField(category, paper.fileName),
    issue_term: issueTerm,
    issue_slug: issueSlug,
    volume,
    issue_number: issueNumber,
    series_number: seriesNumber,
    citable_published_at: citablePublishedAt,
    repository_published_at: INITIAL_REPOSITORY_ONLINE_DATE,
    current_version: {
      published_at: INITIAL_REPOSITORY_ONLINE_DATE,
      oasis_url: oasisUrl,
      pdf_url: pdfUrl,
    },
    previous_versions: [],
    ...(advisor ? { faculty_sponsor: { name: advisor } } : {}),
    ...(doi ? { doi } : {}),
    oasis_url: oasisUrl,
    pdf_url: pdfUrl,
    ...(pages ? { pages } : {}),
  };
}

function validateAuthor(value: unknown, fileName: string, index: number): PublicAuthor {
  if (!isRecord(value)) fail(fileName, `authors[${index}] must be an object`);
  assertAllowedKeys(
    value,
    new Set(["name", "affiliation", "orcid", "institutional_profile", "public_profile"]),
    `authors[${index}]`,
    fileName,
  );
  const author: PublicAuthor = { name: requireString(value, "name", fileName) };
  for (const key of ["affiliation", "orcid", "institutional_profile", "public_profile"] as const) {
    const item = optionalString(value, key, fileName);
    if (item) author[key] = item;
  }
  for (const key of ["orcid", "institutional_profile", "public_profile"] as const) {
    if (author[key]) validateUrl(author[key], `authors[${index}].${key}`, fileName);
  }
  return author;
}

function validatePublicVersion(value: unknown, fileName: string): PublicVersion {
  if (!isRecord(value)) fail(fileName, "current_version must be an object");
  assertAllowedKeys(
    value,
    new Set(["label", "published_at", "note", "oasis_url", "pdf_url"]),
    "current_version",
    fileName,
  );
  const version: PublicVersion = {
    published_at: requireString(value, "published_at", fileName),
    oasis_url: requireString(value, "oasis_url", fileName),
    pdf_url: requireString(value, "pdf_url", fileName),
  };
  const label = optionalString(value, "label", fileName);
  const note = optionalString(value, "note", fileName);
  if (label) version.label = label;
  if (note) version.note = note;
  validateIsoDate(version.published_at, "current_version.published_at", fileName);
  validateUrl(version.oasis_url, "current_version.oasis_url", fileName);
  validateUrl(version.pdf_url, "current_version.pdf_url", fileName);
  return version;
}

function validatePreviousVersions(value: unknown, fileName: string): PreviousVersion[] {
  if (!Array.isArray(value)) fail(fileName, "previous_versions must be an array");
  return value.map((item, index) => {
    if (!isRecord(item)) fail(fileName, `previous_versions[${index}] must be an object`);
    assertAllowedKeys(
      item,
      new Set(["label", "published_at", "note", "public_url", "oasis_url", "status"]),
      `previous_versions[${index}]`,
      fileName,
    );
    const status = requireString(item, "status", fileName);
    if (!(["superseded", "corrected", "withdrawn"] as const).includes(status as PreviousVersion["status"])) {
      fail(fileName, `previous_versions[${index}].status is invalid`);
    }
    const version: PreviousVersion = {
      label: requireString(item, "label", fileName),
      published_at: requireString(item, "published_at", fileName),
      note: requireString(item, "note", fileName),
      status: status as PreviousVersion["status"],
    };
    const publicUrl = optionalString(item, "public_url", fileName);
    const oasisUrl = optionalString(item, "oasis_url", fileName);
    if (publicUrl) {
      validateUrl(publicUrl, `previous_versions[${index}].public_url`, fileName);
      version.public_url = publicUrl;
    }
    if (oasisUrl) {
      validateUrl(oasisUrl, `previous_versions[${index}].oasis_url`, fileName);
      version.oasis_url = oasisUrl;
    }
    validateIsoDate(version.published_at, `previous_versions[${index}].published_at`, fileName);
    return version;
  });
}

function validateFacultySponsor(value: unknown, fileName: string): FacultySponsor | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) fail(fileName, "faculty_sponsor must be an object");
  assertAllowedKeys(value, new Set(["name", "profile_url"]), "faculty_sponsor", fileName);
  const sponsor: FacultySponsor = { name: requireString(value, "name", fileName) };
  const profileUrl = optionalString(value, "profile_url", fileName);
  if (profileUrl) {
    validateUrl(profileUrl, "faculty_sponsor.profile_url", fileName);
    sponsor.profile_url = profileUrl;
  }
  return sponsor;
}

function validateHistoricalProvenance(value: unknown, fileName: string): HistoricalProvenance | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) fail(fileName, "historical_provenance must be an object");
  assertAllowedKeys(
    value,
    new Set([
      "source_name",
      "original_url",
      "original_term",
      "original_publication_date",
      "migrated_at",
      "note",
    ]),
    "historical_provenance",
    fileName,
  );
  const provenance: HistoricalProvenance = {
    source_name: requireString(value, "source_name", fileName),
    original_term: requireString(value, "original_term", fileName),
    note: requireString(value, "note", fileName),
  };
  for (const key of ["original_url", "original_publication_date", "migrated_at"] as const) {
    const item = optionalString(value, key, fileName);
    if (item) provenance[key] = item;
  }
  if (provenance.original_url)
    validateUrl(provenance.original_url, "historical_provenance.original_url", fileName);
  if (provenance.original_publication_date) {
    validateIsoDate(
      provenance.original_publication_date,
      "historical_provenance.original_publication_date",
      fileName,
    );
  }
  if (provenance.migrated_at) {
    validateIsoDate(provenance.migrated_at, "historical_provenance.migrated_at", fileName);
  }
  return provenance;
}

function validateStructuredRecord(raw: UnknownRecord, fileName: string): PaperMetadata {
  assertAllowedKeys(raw, ALLOWED_PAPER_KEYS, "paper frontmatter", fileName);
  for (const key of DEPRECATED_KEYS) {
    if (key in raw) fail(fileName, `deprecated field ${key} is not permitted after migration`);
  }

  if (!Array.isArray(raw.authors) || raw.authors.length === 0) {
    fail(fileName, "authors must be a non-empty array of structured author objects");
  }

  const field = requireString(raw, "field", fileName);
  if (!(RESEARCH_FIELDS as readonly string[]).includes(field)) {
    fail(fileName, `field ${JSON.stringify(field)} is outside the controlled taxonomy`);
  }

  const paper: PaperMetadata = {
    title: requireString(raw, "title", fileName),
    authors: raw.authors.map((author, index) => validateAuthor(author, fileName, index)),
    abstract: requireString(raw, "abstract", fileName),
    keywords: requireStringArray(raw, "keywords", fileName),
    field: field as ResearchField,
    issue_term: requireString(raw, "issue_term", fileName),
    issue_slug: requireString(raw, "issue_slug", fileName),
    volume: requirePositiveInteger(raw, "volume", fileName),
    issue_number: requirePositiveInteger(raw, "issue_number", fileName),
    series_number: requireString(raw, "series_number", fileName),
    citable_published_at: requireString(raw, "citable_published_at", fileName),
    repository_published_at: requireString(raw, "repository_published_at", fileName),
    current_version: validatePublicVersion(raw.current_version, fileName),
    previous_versions: validatePreviousVersions(raw.previous_versions, fileName),
    oasis_url: requireString(raw, "oasis_url", fileName),
    pdf_url: requireString(raw, "pdf_url", fileName),
  };

  const issuePublishedAt = optionalString(raw, "issue_published_at", fileName);
  if (issuePublishedAt) paper.issue_published_at = issuePublishedAt;
  const sponsor = validateFacultySponsor(raw.faculty_sponsor, fileName);
  if (sponsor) paper.faculty_sponsor = sponsor;
  const provenance = validateHistoricalProvenance(raw.historical_provenance, fileName);
  if (provenance) paper.historical_provenance = provenance;

  for (const key of [
    "doi",
    "pages",
    "rights_statement",
    "license_url",
    "copyright_holder",
    "conflict_statement",
    "ai_disclosure",
    "ethics_statement",
    "data_availability",
    "code_availability",
  ] as const) {
    const item = optionalString(raw, key, fileName);
    if (item) paper[key] = item;
  }

  for (const [label, value] of [
    ["citable_published_at", paper.citable_published_at],
    ["repository_published_at", paper.repository_published_at],
    ["issue_published_at", paper.issue_published_at],
  ] as const) {
    if (value) validateIsoDate(value, label, fileName);
  }
  for (const [label, value] of [
    ["oasis_url", paper.oasis_url],
    ["pdf_url", paper.pdf_url],
    ["license_url", paper.license_url],
  ] as const) {
    if (value) validateUrl(value, label, fileName);
  }

  if (!/^UNLV-Econ-WPS-\d{4}-\d{3}$/.test(paper.series_number)) {
    fail(fileName, "series_number must match UNLV-Econ-WPS-YYYY-NNN");
  }
  if (paper.series_number.slice(14, 18) !== paper.citable_published_at.slice(0, 4)) {
    fail(fileName, "series-number year must match citable_published_at year");
  }
  if (paper.current_version.oasis_url !== paper.oasis_url) {
    fail(fileName, "current_version.oasis_url must match oasis_url");
  }
  if (paper.current_version.pdf_url !== paper.pdf_url) {
    fail(fileName, "current_version.pdf_url must match pdf_url");
  }
  if (paper.previous_versions.some((version) => version.published_at > paper.current_version.published_at)) {
    fail(fileName, "a previous version cannot postdate the current version");
  }
  if (paper.doi && !/^10\.\d{4,9}\/\S+$/i.test(paper.doi)) {
    fail(fileName, "doi is not in DOI form");
  }
  return paper;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function appendOptionalString(lines: string[], key: string, value: string | undefined, indent = ""): void {
  if (value !== undefined) lines.push(`${indent}${key}: ${quote(value)}`);
}

function serializeMetadata(paper: PaperMetadata): string {
  const lines: string[] = [];
  lines.push(`title: ${quote(paper.title)}`);
  lines.push("authors:");
  for (const author of paper.authors) {
    lines.push(`  - name: ${quote(author.name)}`);
    appendOptionalString(lines, "affiliation", author.affiliation, "    ");
    appendOptionalString(lines, "orcid", author.orcid, "    ");
    appendOptionalString(lines, "institutional_profile", author.institutional_profile, "    ");
    appendOptionalString(lines, "public_profile", author.public_profile, "    ");
  }
  lines.push(`abstract: ${quote(paper.abstract)}`);
  lines.push("keywords:");
  for (const keyword of paper.keywords) lines.push(`  - ${quote(keyword)}`);
  lines.push(`field: ${quote(paper.field)}`);
  lines.push(`issue_term: ${quote(paper.issue_term)}`);
  lines.push(`issue_slug: ${quote(paper.issue_slug)}`);
  lines.push(`volume: ${paper.volume}`);
  lines.push(`issue_number: ${paper.issue_number}`);
  lines.push(`series_number: ${quote(paper.series_number)}`);
  appendOptionalString(lines, "issue_published_at", paper.issue_published_at);
  lines.push(`citable_published_at: ${quote(paper.citable_published_at)}`);
  lines.push(`repository_published_at: ${quote(paper.repository_published_at)}`);
  lines.push("current_version:");
  appendOptionalString(lines, "label", paper.current_version.label, "  ");
  lines.push(`  published_at: ${quote(paper.current_version.published_at)}`);
  appendOptionalString(lines, "note", paper.current_version.note, "  ");
  lines.push(`  oasis_url: ${quote(paper.current_version.oasis_url)}`);
  lines.push(`  pdf_url: ${quote(paper.current_version.pdf_url)}`);
  if (paper.previous_versions.length === 0) {
    lines.push("previous_versions: []");
  } else {
    lines.push("previous_versions:");
    for (const version of paper.previous_versions) {
      lines.push(`  - label: ${quote(version.label)}`);
      lines.push(`    published_at: ${quote(version.published_at)}`);
      lines.push(`    note: ${quote(version.note)}`);
      appendOptionalString(lines, "public_url", version.public_url, "    ");
      appendOptionalString(lines, "oasis_url", version.oasis_url, "    ");
      lines.push(`    status: ${quote(version.status)}`);
    }
  }
  if (paper.faculty_sponsor) {
    lines.push("faculty_sponsor:");
    lines.push(`  name: ${quote(paper.faculty_sponsor.name)}`);
    appendOptionalString(lines, "profile_url", paper.faculty_sponsor.profile_url, "  ");
  }
  appendOptionalString(lines, "doi", paper.doi);
  lines.push(`oasis_url: ${quote(paper.oasis_url)}`);
  lines.push(`pdf_url: ${quote(paper.pdf_url)}`);
  appendOptionalString(lines, "pages", paper.pages);
  appendOptionalString(lines, "rights_statement", paper.rights_statement);
  appendOptionalString(lines, "license_url", paper.license_url);
  appendOptionalString(lines, "copyright_holder", paper.copyright_holder);
  appendOptionalString(lines, "conflict_statement", paper.conflict_statement);
  appendOptionalString(lines, "ai_disclosure", paper.ai_disclosure);
  appendOptionalString(lines, "ethics_statement", paper.ethics_statement);
  appendOptionalString(lines, "data_availability", paper.data_availability);
  appendOptionalString(lines, "code_availability", paper.code_availability);
  if (paper.historical_provenance) {
    lines.push("historical_provenance:");
    lines.push(`  source_name: ${quote(paper.historical_provenance.source_name)}`);
    appendOptionalString(lines, "original_url", paper.historical_provenance.original_url, "  ");
    lines.push(`  original_term: ${quote(paper.historical_provenance.original_term)}`);
    appendOptionalString(
      lines,
      "original_publication_date",
      paper.historical_provenance.original_publication_date,
      "  ",
    );
    appendOptionalString(lines, "migrated_at", paper.historical_provenance.migrated_at, "  ");
    lines.push(`  note: ${quote(paper.historical_provenance.note)}`);
  }
  return `${lines.join("\n")}\n`;
}

function buildSeriesAssignments(papers: PaperFile[]): Map<string, string> {
  const ordered = papers
    .map((paper) => {
      const citableDate = requireString(paper.raw, "published_at", paper.fileName);
      const oasisUrl = requireString(paper.raw, "oasis_url", paper.fileName);
      validateIsoDate(citableDate, "published_at", paper.fileName);
      validateUrl(oasisUrl, "oasis_url", paper.fileName);
      return {
        paper,
        citableDate,
        repositoryDate: INITIAL_REPOSITORY_ONLINE_DATE,
        collectionOrder: oasisRecordOrder(oasisUrl, paper.fileName),
      };
    })
    .sort(
      (a, b) =>
        a.repositoryDate.localeCompare(b.repositoryDate) ||
        a.collectionOrder - b.collectionOrder ||
        a.paper.slug.localeCompare(b.paper.slug),
    );

  if (ordered.length !== EXPECTED_INITIAL_RECORD_COUNT) {
    throw new Error(
      `Initial migration expected ${EXPECTED_INITIAL_RECORD_COUNT} records but found ${ordered.length}; ` +
        "audit the collection before assigning identifiers.",
    );
  }

  const collectionOrders = new Set<number>();
  for (const item of ordered) {
    if (collectionOrders.has(item.collectionOrder)) {
      fail(item.paper.fileName, `duplicate OAsis public collection order ${item.collectionOrder}`);
    }
    collectionOrders.add(item.collectionOrder);
  }

  return new Map(
    ordered.map((item, index) => [
      item.paper.fileName,
      `UNLV-Econ-WPS-${item.citableDate.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
    ]),
  );
}

function validateCollection(papers: PaperFile[]): void {
  const bySeries = new Map<string, string>();
  const bySeriesSuffix = new Map<string, string>();
  const byOasisUrl = new Map<string, string>();
  const byDoi = new Map<string, string>();

  const paperSlugs = new Set(papers.map((paper) => paper.slug));
  for (const initialSlug of Object.keys(INITIAL_SERIES_NUMBER_BY_SLUG)) {
    if (!paperSlugs.has(initialSlug)) {
      throw new Error(
        `Missing initial public record ${initialSlug}; preserve its identifier in a paper record or public tombstone.`,
      );
    }
  }

  for (const paper of papers) {
    if (!paper.metadata) fail(paper.fileName, "internal error: metadata was not normalized");
    const expectedInitialNumber = INITIAL_SERIES_NUMBER_BY_SLUG[paper.slug];
    if (expectedInitialNumber && paper.metadata.series_number !== expectedInitialNumber) {
      fail(
        paper.fileName,
        `immutable initial Series number changed: expected ${expectedInitialNumber}, found ${paper.metadata.series_number}`,
      );
    }
    for (const [label, value, registry] of [
      ["series_number", paper.metadata.series_number, bySeries],
      ["series_number suffix", paper.metadata.series_number.slice(-3), bySeriesSuffix],
      ["oasis_url", paper.metadata.oasis_url, byOasisUrl],
      ...(paper.metadata.doi ? [["doi", paper.metadata.doi.toLowerCase(), byDoi] as const] : []),
    ] as const) {
      const prior = registry.get(value);
      if (prior) fail(paper.fileName, `${label} collides with ${prior}: ${value}`);
      registry.set(value, paper.fileName);
    }
  }
}

function reportFor(papers: PaperFile[]): string {
  const initialPapers = papers
    .filter((paper) => INITIAL_SERIES_NUMBER_BY_SLUG[paper.slug])
    .sort((a, b) => a.metadata!.series_number.localeCompare(b.metadata!.series_number));
  const missingSponsorCount = papers.filter((paper) => !paper.metadata!.faculty_sponsor).length;
  const missingIssueDateCount = papers.filter((paper) => !paper.metadata!.issue_published_at).length;
  const priorVersionCount = papers.reduce(
    (total, paper) => total + paper.metadata!.previous_versions.length,
    0,
  );

  const lines = [
    "# Paper Metadata Migration Report",
    "",
    "This report is generated deterministically by `scripts/migrate-paper-metadata.ts`. It contains no wall-clock timestamp so a second migration run produces the same result.",
    "",
    "## Result",
    "",
    `- Records migrated and validated: ${papers.length}`,
    "- Legacy runtime fields removed: `authors: string[]`, `semester`, `category`, `advisor`, `pdf`, `issue`, and generic `published_at`",
    "- Explicit Series-number collisions: none",
    "- Duplicate canonical OAsis item URLs: none",
    "- Duplicate DOIs: none",
    "- Paper slugs, titles, abstract text, keywords, DOI values, OAsis URLs, PDF URLs, volume/issue metadata, and page ranges were preserved",
    "",
    "## Date semantics",
    "",
    "OAsis exposes two dates with different meanings for this initial collection. The former flat `published_at` values match the official citable `Publication Date` on each item record. The repository audit separately verified that all 15 records first appeared online in OAsis on 2026-08-05.",
    "",
    "- `citable_published_at` preserves the item record's official citable Publication Date.",
    "- `repository_published_at` records the verified date the OAsis record became public.",
    "- `current_version.published_at` records the verified public date of the currently deposited file.",
    "- `issue_published_at` remains absent because a semester label is not evidence of an issue-release date.",
    "",
    "## Initial Series-number assignments",
    "",
    "Assignments sort all 15 records by the verified repository-online date. Because all records tie on 2026-08-05, the stable public OAsis collection-item order determines the sequence, with slug only as a final deterministic fallback. The numeric suffix is a global, zero-padded accession sequence across the Series; it does not reset by year. It happens to correspond to the current public item order, but the Series identifier is stored explicitly and is not dynamically derived from an OAsis URL at runtime. The four-digit year comes from the separately verified citable Publication Date.",
    "",
    "| Series number | Paper slug | Citable date | Repository online | OAsis item order |",
    "| --- | --- | --- | --- | ---: |",
    ...initialPapers.map((paper) => {
      const metadata = paper.metadata!;
      return `| ${metadata.series_number} | \`${paper.slug}\` | ${metadata.citable_published_at} | ${metadata.repository_published_at} | ${oasisRecordOrder(metadata.oasis_url, paper.fileName)} |`;
    }),
    "",
    "Identifiers are immutable once publicly assigned. A withdrawal does not release an identifier for reuse.",
    "",
    "## Controlled-field migration",
    "",
    "| Paper slug | Legacy category | Controlled research field |",
    "| --- | --- | --- |",
    ...[...initialPapers]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((paper) => {
        const legacy = INITIAL_LEGACY_CATEGORY_BY_SLUG[paper.slug] ?? "Not recorded";
        return `| \`${paper.slug}\` | ${legacy} | ${paper.metadata!.field} |`;
      }),
    "",
    "Every resulting value is a member of the 17-value controlled taxonomy. No arbitrary public field variant was added.",
    "",
    "## Deliberately unresolved public metadata",
    "",
    `- Faculty sponsor absent: ${missingSponsorCount} of ${papers.length}. The former records did not publish sponsor metadata, so none was fabricated.`,
    `- Issue release date absent: ${missingIssueDateCount} of ${papers.length}. Semester labels were not converted into dates.`,
    `- Documented previous versions: ${priorVersionCount}. No superseded, corrected, or withdrawn version was inferred without public evidence.`,
    "- Rights, license, copyright-holder, conflict, AI-use, ethics, data-availability, and code-availability fields remain absent unless record-level public evidence supports them.",
    "- Private consent records, editorial votes, conflict forms, and rights documents are intentionally excluded from public content.",
    "",
    "## Repeatability and failure behavior",
    "",
    "- Default and `--dry-run` modes parse and validate every record without changing files.",
    "- `--write` converts an all-legacy collection or canonicalizes an all-structured collection and regenerates this report.",
    "- Mixed legacy/structured collections fail, preventing a long-lived dual schema.",
    "- Missing required fields, invalid dates or URLs, unknown research fields, duplicate Series numbers, duplicate OAsis URLs, duplicate DOIs, and ambiguous initial ordering fail the migration.",
    "- A second `--write` run is byte-stable when source metadata has not changed.",
    "",
  ];
  return lines.join("\n");
}

export interface PaperMigrationOptions {
  paperDirectory?: string;
  reportPath?: string;
  write?: boolean;
}

export interface PaperMigrationResult {
  state: "legacy" | "structured";
  recordCount: number;
  changedFileCount: number;
  report: string;
}

export async function runPaperMetadataMigration(
  options: PaperMigrationOptions = {},
): Promise<PaperMigrationResult> {
  const paperDirectory = options.paperDirectory ?? PAPER_DIRECTORY;
  const reportPath = options.reportPath ?? REPORT_PATH;
  const shouldWrite = options.write === true;
  const fileNames = (await readdir(paperDirectory)).filter((fileName) => fileName.endsWith(".md")).sort();
  if (fileNames.length === 0) throw new Error("No paper Markdown files found");

  const papers: PaperFile[] = await Promise.all(
    fileNames.map(async (fileName) => {
      const source = await readFile(resolve(paperDirectory, fileName), "utf8");
      const parsed = parseFrontmatter(source);
      return {
        fileName,
        slug: fileName.replace(/\.md$/, ""),
        source,
        body: parsed.content,
        raw: parsed.frontmatter as UnknownRecord,
      };
    }),
  );

  const states = new Set<"legacy" | "structured">(
    papers.map((paper) =>
      Object.keys(paper.raw).some((key) => DEPRECATED_KEYS.has(key)) ? "legacy" : "structured",
    ),
  );
  if (states.size !== 1) {
    throw new Error(
      "Mixed legacy and structured paper records are not supported; complete or revert the migration.",
    );
  }
  const state = [...states][0];

  if (state === "legacy") {
    const assignments = buildSeriesAssignments(papers);
    for (const paper of papers) {
      const seriesNumber = assignments.get(paper.fileName);
      if (!seriesNumber) fail(paper.fileName, "missing deterministic Series-number assignment");
      paper.metadata = migrateLegacyRecord(paper, seriesNumber);
      validateStructuredRecord(paper.metadata as unknown as UnknownRecord, paper.fileName);
    }
  } else {
    for (const paper of papers) {
      paper.metadata = validateStructuredRecord(paper.raw, paper.fileName);
    }
  }

  validateCollection(papers);
  const report = reportFor(papers);
  const changedFiles = papers.filter((paper) => {
    const next = `---\n${serializeMetadata(paper.metadata!)}---${paper.body}`;
    return next !== paper.source;
  });

  if (shouldWrite) {
    await Promise.all(
      papers.map((paper) => {
        const next = `---\n${serializeMetadata(paper.metadata!)}---${paper.body}`;
        return writeFile(resolve(paperDirectory, paper.fileName), next, "utf8");
      }),
    );
    await writeFile(reportPath, report, "utf8");
  }

  return {
    state,
    recordCount: papers.length,
    changedFileCount: changedFiles.length,
    report,
  };
}

function parseCliWriteMode(argv: string[]): boolean {
  const args = new Set(argv);
  const unknownArgs = [...args].filter((arg) => !["--dry-run", "--write"].includes(arg));
  if (unknownArgs.length > 0 || (args.has("--dry-run") && args.has("--write"))) {
    throw new Error(
      "Usage: tsx scripts/migrate-paper-metadata.ts [--dry-run | --write]\n" +
        "The default mode is --dry-run.",
    );
  }
  return args.has("--write");
}

async function main(): Promise<void> {
  const shouldWrite = parseCliWriteMode(process.argv.slice(2));
  const result = await runPaperMetadataMigration({ write: shouldWrite });

  console.log(
    `${shouldWrite ? "WRITE" : "DRY RUN"}: ${result.recordCount} paper records validated; ` +
      `${result.changedFileCount} content file(s) ${shouldWrite ? "rewritten" : "would be rewritten"}.`,
  );
  console.log(`Schema state: ${result.state}. Series-number and canonical-URL collisions: none.`);
  if (!shouldWrite) console.log("No files were changed. Run with --write to apply the migration.");
}

const entryPoint = process.argv[1] ? resolve(process.argv[1]) : null;
if (entryPoint === fileURLToPath(import.meta.url)) await main();
