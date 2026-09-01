import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { buildRepositoryCitation } from "../src/lib/publication/citations";
import type { PublicationRecord } from "../src/lib/publication/types";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const DEFAULT_PAPER_DIRECTORY = resolve(REPOSITORY_ROOT, "src/content/papers");
const DEFAULT_JSON_PATH = resolve(REPOSITORY_ROOT, "docs/audits/oasis-external-verification.json");
const DEFAULT_MARKDOWN_PATH = resolve(REPOSITORY_ROOT, "docs/audits/OASIS_EXTERNAL_VERIFICATION.md");
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/iu;
const OASIS_HOST = "oasis.library.unlv.edu";
const MAX_ITEM_BYTES = 1_500_000;

export type TransportStatus = "verified" | "network_failure" | "http_error";
export type ComparisonStatus = "match" | "mismatch" | "not_available";
export type RecordOutcome =
  | "verified"
  | "mismatch"
  | "network_failure"
  | "remote_error"
  | "invalid_local_data";

export interface TransportResult {
  status: TransportStatus;
  requested_url: string;
  final_url?: string;
  http_status?: number;
  attempts: number;
  error?: string;
  reached_oasis?: boolean;
}

export interface FieldComparison {
  field: string;
  status: ComparisonStatus;
  local?: string | string[] | number;
  remote?: string | string[] | number;
  note?: string;
}

export interface OasisMetadata {
  title?: string;
  authors: string[];
  abstract?: string;
  keywords: string[];
  disciplines: string[];
  doi?: string;
  item_url?: string;
  pdf_url?: string;
  online_date?: string;
  citable_date?: string;
  volume?: number;
  issue_number?: number;
  pages?: string;
  rights_statement?: string;
  repository_citation?: string;
}

export interface RecordAudit {
  slug: string;
  title: string;
  authors: string[];
  local_field: string;
  local_issue_term: string;
  doi: string | null;
  doi_syntax_valid: boolean;
  item_url: string;
  pdf_url: string;
  frontend_citation: string;
  repository_citation: string | null;
  remote_disciplines: string[];
  doi_resolution: TransportResult;
  item_availability: TransportResult;
  pdf_availability: TransportResult;
  comparisons: FieldComparison[];
  outcome: RecordOutcome;
}

export interface AuditOutput {
  schema_version: 1;
  generated_at: string;
  source: string;
  configuration: {
    timeout_ms: number;
    max_attempts: number;
    concurrency: number;
  };
  summary: Record<RecordOutcome, number> & { total: number };
  records: RecordAudit[];
}

interface RetryOptions {
  timeoutMs: number;
  maxAttempts: number;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  waitImpl?: (milliseconds: number) => Promise<void>;
  readBody?: "text" | "sample" | "none";
}

interface RetryResult {
  transport: TransportResult;
  body?: string;
}

interface CliOptions {
  paperDirectory: string;
  jsonPath: string;
  markdownPath: string;
  timeoutMs: number;
  maxAttempts: number;
  concurrency: number;
}

function normalizeWhitespace(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/u, "") || "/";
  return url.toString().replace(/\/$/u, "");
}

function normalizeDoi(value: string): string {
  let doi = normalizeWhitespace(value);
  doi = doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "");
  try {
    doi = decodeURIComponent(doi);
  } catch {
    // Keep the original text so deterministic validation can reject it.
  }
  return doi.toLowerCase();
}

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    lt: "<",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    quot: '"',
    rsquo: "’",
    lsquo: "‘",
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, body: string) => {
    if (body.startsWith("#x")) return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return named[body.toLowerCase()] ?? entity;
  });
}

function stripHtml(value: string): string {
  return normalizeWhitespace(decodeHtml(value.replace(/<[^>]+>/gu, " ")));
}

function parseTagAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gu;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function paragraphForElement(html: string, id: string): string | undefined {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const element = html.match(new RegExp(`<div\\s+id=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/div>`, "iu"));
  if (!element) return undefined;
  const paragraph = element[1].match(/<p[^>]*>([\s\S]*?)<\/p>/iu);
  return paragraph ? stripHtml(paragraph[1]) : undefined;
}

function textForElement(html: string, id: string): string | undefined {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const element = html.match(new RegExp(`<div\\s+id=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/div>`, "iu"));
  return element ? stripHtml(element[1]) : undefined;
}

function oasisAuthorDisplay(value: string): string {
  const [family, ...given] = value.split(",").map((part) => normalizeWhitespace(part));
  return given.length > 0 ? normalizeWhitespace(`${given.join(" ")} ${family}`) : normalizeWhitespace(value);
}

function parseUsDate(value: string | undefined): string | undefined {
  const match = value?.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/u);
  if (!match) return undefined;
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function parseOnlineDate(value: string | undefined): string | undefined {
  const match = value?.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/u);
  if (!match) return undefined;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

export function validateDoiSyntax(value: string): boolean {
  return DOI_PATTERN.test(normalizeDoi(value));
}

export function parseOasisMetadata(html: string): OasisMetadata {
  const metadata = new Map<string, string[]>();
  for (const match of html.matchAll(/<meta\b[^>]*>/giu)) {
    const attributes = parseTagAttributes(match[0]);
    const key = (attributes.name ?? attributes.property)?.toLowerCase();
    if (!key || attributes.content === undefined) continue;
    const values = metadata.get(key) ?? [];
    values.push(attributes.content);
    metadata.set(key, values);
  }

  const first = (key: string) => metadata.get(key)?.[0];
  const firstPage = first("bepress_citation_firstpage");
  const lastPage = paragraphForElement(html, "lpage");
  const citationText = textForElement(html, "recommended_citation")
    ?.replace(/^Repository Citation\s*/u, "");

  return {
    title: first("bepress_citation_title"),
    authors: (metadata.get("bepress_citation_author") ?? []).map(oasisAuthorDisplay),
    abstract: first("description"),
    keywords: first("keywords")?.split(";").map(normalizeWhitespace).filter(Boolean) ?? [],
    disciplines: paragraphForElement(html, "bp_categories")?.split("|").map(normalizeWhitespace).filter(Boolean) ?? [],
    doi: first("bepress_citation_doi"),
    item_url: first("bepress_citation_abstract_html_url"),
    pdf_url: first("bepress_citation_pdf_url"),
    online_date: parseOnlineDate(first("bepress_citation_online_date")),
    citable_date: parseUsDate(paragraphForElement(html, "publication_date")),
    volume: Number.parseInt(first("bepress_citation_volume") ?? "", 10) || undefined,
    issue_number: Number.parseInt(first("bepress_citation_issue") ?? "", 10) || undefined,
    pages: firstPage && lastPage ? `${firstPage}-${lastPage}` : undefined,
    rights_statement: paragraphForElement(html, "rights"),
    repository_citation: citationText,
  };
}

function transportErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Request timed out";
    return error.message;
  }
  return String(error);
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

export async function requestWithRetry(url: string, options: RetryOptions): Promise<RetryResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const waitImpl = options.waitImpl ?? wait;
  let lastError = "Request failed";

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: {
          "user-agent": "UNLV-Econ-WPS-record-audit/1.0 (+https://econ-undergrad-wps.sites.unlv.edu/)",
          ...options.headers,
        },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const transport: TransportResult = {
        status: response.ok ? "verified" : "http_error",
        requested_url: url,
        final_url: response.url || url,
        http_status: response.status,
        attempts: attempt,
        reached_oasis: (() => {
          try {
            return new URL(response.url || url).hostname.toLowerCase() === OASIS_HOST;
          } catch {
            return false;
          }
        })(),
      };

      if (!response.ok && isRetryableStatus(response.status) && attempt < options.maxAttempts) {
        await response.body?.cancel();
        await waitImpl(250 * (2 ** (attempt - 1)));
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel();
        return { transport };
      }

      if (options.readBody === "text") {
        const declaredLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10);
        if (declaredLength > MAX_ITEM_BYTES) {
          await response.body?.cancel();
          return {
            transport: {
              ...transport,
              status: "http_error",
              error: `Response exceeded ${MAX_ITEM_BYTES} byte audit limit`,
            },
          };
        }
        const body = await response.text();
        if (new TextEncoder().encode(body).byteLength > MAX_ITEM_BYTES) {
          return {
            transport: {
              ...transport,
              status: "http_error",
              error: `Response exceeded ${MAX_ITEM_BYTES} byte audit limit`,
            },
          };
        }
        return { transport, body };
      }

      if (options.readBody === "sample") {
        const reader = response.body?.getReader();
        await reader?.read();
        await reader?.cancel();
      } else {
        await response.body?.cancel();
      }
      return { transport };
    } catch (error) {
      clearTimeout(timeout);
      lastError = transportErrorMessage(error);
      if (attempt < options.maxAttempts) {
        await waitImpl(250 * (2 ** (attempt - 1)));
        continue;
      }
      return {
        transport: {
          status: "network_failure",
          requested_url: url,
          attempts: attempt,
          error: lastError,
        },
      };
    }
  }

  return {
    transport: {
      status: "network_failure",
      requested_url: url,
      attempts: options.maxAttempts,
      error: lastError,
    },
  };
}

function compareScalar(
  field: string,
  local: string | number | undefined,
  remote: string | number | undefined,
  normalizer: (value: string) => string = normalizeWhitespace,
): FieldComparison {
  if (remote === undefined) return { field, status: "not_available", local, note: "Field not exposed by OAsis" };
  const localValue = typeof local === "string" ? normalizer(local) : local;
  const remoteValue = typeof remote === "string" ? normalizer(remote) : remote;
  return {
    field,
    status: localValue === remoteValue ? "match" : "mismatch",
    local,
    remote,
  };
}

function compareList(field: string, local: string[], remote: string[]): FieldComparison {
  if (remote.length === 0) return { field, status: "not_available", local, note: "Field not exposed by OAsis" };
  const localValues = local.map(normalizeWhitespace);
  const remoteValues = remote.map(normalizeWhitespace);
  return {
    field,
    status: JSON.stringify(localValues) === JSON.stringify(remoteValues) ? "match" : "mismatch",
    local,
    remote,
  };
}

function missingRequiredRemoteFields(remote: OasisMetadata): string[] {
  const missing: string[] = [];
  if (!remote.title) missing.push("title");
  if (remote.authors.length === 0) missing.push("authors");
  if (!remote.abstract) missing.push("abstract");
  if (remote.keywords.length === 0) missing.push("keywords");
  if (!remote.doi) missing.push("doi");
  if (!remote.item_url) missing.push("item_url");
  if (!remote.pdf_url) missing.push("pdf_url");
  if (!remote.online_date) missing.push("online_date");
  if (!remote.citable_date) missing.push("citable_date");
  if (!remote.volume) missing.push("volume");
  if (!remote.issue_number) missing.push("issue_number");
  if (!remote.pages) missing.push("pages");
  if (!remote.rights_statement) missing.push("rights_statement");
  return missing;
}

export function compareRecord(record: PublicationRecord, remote: OasisMetadata): FieldComparison[] {
  const remoteRightsLabel = remote.rights_statement?.split(".")[0]
    .toLocaleLowerCase("en-US")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("en-US"));

  return [
    compareScalar("title", record.title, remote.title),
    compareList("authors", record.authors.map((author) => author.name), remote.authors),
    compareScalar("abstract", record.abstract, remote.abstract),
    compareList("keywords", record.keywords, remote.keywords),
    compareScalar("doi", record.doi ? normalizeDoi(record.doi) : undefined, remote.doi ? normalizeDoi(remote.doi) : undefined),
    compareScalar("oasis_url", record.oasis_url, remote.item_url, normalizeUrl),
    compareScalar("pdf_url", record.pdf_url, remote.pdf_url, normalizeUrl),
    compareScalar("repository_published_at", record.repository_published_at, remote.online_date),
    compareScalar("citable_published_at", record.citable_published_at, remote.citable_date),
    compareScalar("volume", record.volume, remote.volume),
    compareScalar("issue_number", record.issue_number, remote.issue_number),
    compareScalar("pages", record.pages, remote.pages),
    compareScalar("rights_statement", record.rights_statement, remoteRightsLabel),
    {
      field: "field",
      status: "not_available",
      local: record.field,
      remote: remote.disciplines,
      note: "OAsis exposes disciplines, not the controlled local research field",
    },
    {
      field: "issue_term",
      status: "not_available",
      local: record.issue_term,
      note: "OAsis exposes volume and issue, not the local semester label",
    },
    {
      field: "faculty_sponsor",
      status: "not_available",
      local: record.faculty_sponsor?.name,
      note: "No faculty-sponsor field was exposed on the audited OAsis item page",
    },
  ];
}

export function classifyRecordOutcome(input: {
  doiSyntaxValid: boolean;
  comparisons: FieldComparison[];
  transports: TransportResult[];
  doiReachedOasis?: boolean;
}): RecordOutcome {
  if (!input.doiSyntaxValid) return "invalid_local_data";
  if (input.comparisons.some((comparison) => comparison.status === "mismatch")) return "mismatch";
  if (input.doiReachedOasis === false) return "mismatch";
  if (input.transports.some((transport) => transport.status === "network_failure")) return "network_failure";
  if (input.transports.some((transport) => transport.status === "http_error")) return "remote_error";
  return "verified";
}

async function readLocalRecords(paperDirectory: string): Promise<Array<{ slug: string; record: PublicationRecord }>> {
  const fileNames = (await readdir(paperDirectory)).filter((name) => name.endsWith(".md")).sort();
  const records = await Promise.all(fileNames.map(async (fileName) => {
    const source = await readFile(resolve(paperDirectory, fileName), "utf8");
    const parsed = parseFrontmatter(source).frontmatter as PublicationRecord;
    return { slug: fileName.replace(/\.md$/u, ""), record: parsed };
  }));

  return records.sort((left, right) => {
    const leftItem = Number.parseInt(new URL(left.record.oasis_url).pathname.split("/").filter(Boolean).at(-1) ?? "0", 10);
    const rightItem = Number.parseInt(new URL(right.record.oasis_url).pathname.split("/").filter(Boolean).at(-1) ?? "0", 10);
    return leftItem - rightItem || left.slug.localeCompare(right.slug);
  });
}

async function auditOneRecord(
  slug: string,
  record: PublicationRecord,
  options: Pick<CliOptions, "timeoutMs" | "maxAttempts">,
): Promise<RecordAudit> {
  const doi = record.doi ? normalizeDoi(record.doi) : null;
  const doiSyntaxValid = doi !== null && validateDoiSyntax(doi);
  const retry = { timeoutMs: options.timeoutMs, maxAttempts: options.maxAttempts };
  const invalidDoiTransport: TransportResult = {
    status: "http_error",
    requested_url: doi ? `https://doi.org/${doi}` : "",
    attempts: 0,
    error: doi ? "Invalid DOI syntax" : "DOI missing",
  };

  const [doiResult, itemResult, pdfResult] = await Promise.all([
    doiSyntaxValid
      ? requestWithRetry(`https://doi.org/${doi}`, { ...retry, readBody: "none" })
      : Promise.resolve({ transport: invalidDoiTransport }),
    requestWithRetry(record.oasis_url, { ...retry, readBody: "text" }),
    requestWithRetry(record.pdf_url, {
      ...retry,
      headers: { Range: "bytes=0-1023" },
      readBody: "sample",
    }),
  ]);

  const remote = itemResult.body ? parseOasisMetadata(itemResult.body) : undefined;
  const missingRemoteFields = remote ? missingRequiredRemoteFields(remote) : [];
  const itemTransport: TransportResult = missingRemoteFields.length > 0
    ? {
        ...itemResult.transport,
        status: "http_error",
        error: `OAsis response omitted required metadata: ${missingRemoteFields.join(", ")}`,
      }
    : itemResult.transport;
  const comparisons = remote ? compareRecord(record, remote) : [];
  const doiReachedOasis = doiResult.transport.final_url
    ? doiResult.transport.reached_oasis === true
    : undefined;
  const outcome = classifyRecordOutcome({
    doiSyntaxValid,
    comparisons,
    transports: [doiResult.transport, itemTransport, pdfResult.transport],
    doiReachedOasis,
  });

  return {
    slug,
    title: record.title,
    authors: record.authors.map((author) => author.name),
    local_field: record.field,
    local_issue_term: record.issue_term,
    doi,
    doi_syntax_valid: doiSyntaxValid,
    item_url: record.oasis_url,
    pdf_url: record.pdf_url,
    frontend_citation: buildRepositoryCitation(record),
    repository_citation: remote?.repository_citation ?? null,
    remote_disciplines: remote?.disciplines ?? [],
    doi_resolution: doiResult.transport,
    item_availability: itemTransport,
    pdf_availability: pdfResult.transport,
    comparisons,
    outcome,
  };
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  callback: (value: T) => Promise<U>,
): Promise<U[]> {
  const output = new Array<U>(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await callback(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return output;
}

function statusLabel(transport: TransportResult): string {
  if (transport.status === "verified") return `verified (${transport.http_status})`;
  if (transport.status === "http_error") return `HTTP ${transport.http_status ?? "error"}`;
  return `network failure${transport.error ? `: ${transport.error}` : ""}`;
}

export function renderMarkdown(output: AuditOutput): string {
  const lines = [
    "# OAsis External Verification",
    "",
    `Generated: ${output.generated_at}`,
    "",
    "This is a bounded external check, not a PDF accessibility certification. A metadata mismatch means the retrieved OAsis record differs from local structured data. A network failure means the comparison could not be completed. HTTP errors, including access-control responses, are reported separately and are not treated as metadata mismatches.",
    "",
    "## Summary",
    "",
    `- Total records: ${output.summary.total}`,
    `- Fully verified: ${output.summary.verified}`,
    `- Metadata or DOI-target mismatches: ${output.summary.mismatch}`,
    `- Network failures: ${output.summary.network_failure}`,
    `- Remote HTTP errors: ${output.summary.remote_error}`,
    `- Invalid local records: ${output.summary.invalid_local_data}`,
    "",
    "## Record results",
    "",
    "| Slug | DOI syntax / target | OAsis item | PDF probe | Compared fields | Outcome |",
    "| --- | --- | --- | --- | ---: | --- |",
  ];

  for (const record of output.records) {
    const compared = record.comparisons.filter((comparison) => comparison.status !== "not_available");
    const matches = compared.filter((comparison) => comparison.status === "match").length;
    const mismatches = compared.filter((comparison) => comparison.status === "mismatch").length;
    const doiTarget = record.doi_resolution.reached_oasis === true
      ? "OAsis reached"
      : statusLabel(record.doi_resolution);
    lines.push(
      `| \`${record.slug}\` | ${record.doi_syntax_valid ? "valid" : "invalid"}; ${doiTarget} | ${statusLabel(record.item_availability)} | ${statusLabel(record.pdf_availability)} | ${matches} match / ${mismatches} mismatch | **${record.outcome}** |`,
    );
  }

  const exceptions = output.records.filter((record) => record.outcome !== "verified");
  lines.push("", "## Exceptions and limits", "");
  if (exceptions.length === 0) {
    lines.push("No transport or metadata exceptions were observed.");
  } else {
    for (const record of exceptions) {
      lines.push(`### ${record.slug}`, "");
      for (const comparison of record.comparisons.filter((entry) => entry.status === "mismatch")) {
        lines.push(`- Metadata mismatch in \`${comparison.field}\`: local \`${JSON.stringify(comparison.local)}\`; OAsis \`${JSON.stringify(comparison.remote)}\`.`);
      }
      for (const [label, transport] of [
        ["DOI", record.doi_resolution],
        ["OAsis item", record.item_availability],
        ["PDF", record.pdf_availability],
      ] as const) {
        if (transport.status !== "verified") {
          lines.push(`- ${label}: ${statusLabel(transport)} after ${transport.attempts} attempt(s).`);
        }
      }
      lines.push("");
    }
  }

  lines.push(
    "- OAsis disciplines are recorded for context but are not treated as the controlled local research field.",
    "- The local semester label is not inferred from repository volume and issue metadata.",
    "- A successful range probe or readable PDF does not establish WCAG or PDF/UA conformance.",
    "- This script is intended for manual, scheduled, and release-time use; it is deliberately not part of the normal build.",
    "",
  );
  return lines.join("\n");
}

function parseIntegerArgument(name: string, value: string | undefined, minimum: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}`);
  }
  return parsed;
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    paperDirectory: DEFAULT_PAPER_DIRECTORY,
    jsonPath: DEFAULT_JSON_PATH,
    markdownPath: DEFAULT_MARKDOWN_PATH,
    timeoutMs: 12_000,
    maxAttempts: 3,
    concurrency: 3,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--papers") options.paperDirectory = resolve(value ?? "");
    else if (argument === "--json") options.jsonPath = resolve(value ?? "");
    else if (argument === "--markdown") options.markdownPath = resolve(value ?? "");
    else if (argument === "--timeout-ms") options.timeoutMs = parseIntegerArgument(argument, value, 1_000, 60_000);
    else if (argument === "--attempts") options.maxAttempts = parseIntegerArgument(argument, value, 1, 5);
    else if (argument === "--concurrency") options.concurrency = parseIntegerArgument(argument, value, 1, 6);
    else throw new Error(`Unknown argument: ${argument}`);
    index += 1;
  }
  return options;
}

export async function runExternalAudit(options: CliOptions): Promise<AuditOutput> {
  const localRecords = await readLocalRecords(options.paperDirectory);
  const records = await mapWithConcurrency(
    localRecords,
    options.concurrency,
    ({ slug, record }) => auditOneRecord(slug, record, options),
  );
  const summary: AuditOutput["summary"] = {
    total: records.length,
    verified: 0,
    mismatch: 0,
    network_failure: 0,
    remote_error: 0,
    invalid_local_data: 0,
  };
  for (const record of records) summary[record.outcome] += 1;

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source: "https://oasis.library.unlv.edu/econ_ug_papers/",
    configuration: {
      timeout_ms: options.timeoutMs,
      max_attempts: options.maxAttempts,
      concurrency: options.concurrency,
    },
    summary,
    records,
  };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const output = await runExternalAudit(options);
  await Promise.all([
    mkdir(dirname(options.jsonPath), { recursive: true }).then(() => writeFile(options.jsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8")),
    mkdir(dirname(options.markdownPath), { recursive: true }).then(() => writeFile(options.markdownPath, renderMarkdown(output), "utf8")),
  ]);

  console.log(`Wrote ${options.jsonPath}`);
  console.log(`Wrote ${options.markdownPath}`);
  console.log(JSON.stringify(output.summary));

  if (output.summary.mismatch > 0 || output.summary.invalid_local_data > 0) process.exitCode = 1;
  else if (output.summary.network_failure > 0 || output.summary.remote_error > 0) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
