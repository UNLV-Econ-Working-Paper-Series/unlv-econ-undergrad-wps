import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_CANONICAL_ORIGIN = "https://econ-undergrad-wps.sites.unlv.edu";
const DEFAULT_DIST_DIRECTORY = path.resolve(process.cwd(), "dist");
const DEFAULT_OUTPUT_DIRECTORY = path.resolve(process.cwd(), "artifacts/external-links");
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_CONCURRENCY = 6;
const RETRYABLE_STATUSES = new Set([408, 425, 429]);

function compareText(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function decodeHtmlAttribute(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, body) => {
    let codePoint;
    if (body.toLowerCase().startsWith("#x")) codePoint = Number.parseInt(body.slice(2), 16);
    else if (body.startsWith("#")) codePoint = Number.parseInt(body.slice(1), 10);
    else return namedEntities[body.toLowerCase()] ?? entity;

    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : entity;
  });
}

function tagAttributes(html) {
  const attributes = [];
  let ignoredElement = null;

  for (const match of html.matchAll(/<[^>]+>/gu)) {
    const tag = match[0];
    if (ignoredElement) {
      if (new RegExp(`^<\\/${ignoredElement}\\b`, "iu").test(tag)) ignoredElement = null;
      continue;
    }
    if (/^<!--/u.test(tag) || /^<\//u.test(tag) || /^<!/u.test(tag) || /^<\?/u.test(tag)) continue;

    for (const attribute of tag.matchAll(/\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/giu)) {
      attributes.push({
        attribute: attribute[1].toLowerCase(),
        value: decodeHtmlAttribute(attribute[2] ?? attribute[3] ?? attribute[4] ?? "").trim(),
      });
    }

    const ignoredMatch = tag.match(/^<(script|style)\b/iu);
    if (ignoredMatch && !/\/\s*>$/u.test(tag)) ignoredElement = ignoredMatch[1].toLowerCase();
  }

  return attributes;
}

async function filesBelow(directory, root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not allowed in dist: ${path.relative(root, absolute)}`);
    }
    if (entry.isDirectory()) files.push(...(await filesBelow(absolute, root)));
    if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function normalizedCanonicalOrigin(value) {
  const canonical = new URL(value);
  if (!new Set(["http:", "https:"]).has(canonical.protocol)) {
    throw new Error("Canonical origin must use http or https.");
  }
  return canonical.origin;
}

function reportPath(absolute) {
  const relative = path.relative(process.cwd(), absolute);
  if (relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) {
    return relative.split(path.sep).join("/");
  }
  return absolute.split(path.sep).join("/");
}

export async function scanExternalLinks({ distDirectory, canonicalOrigin }) {
  const root = path.resolve(distDirectory);
  const excludedOrigin = normalizedCanonicalOrigin(canonicalOrigin);
  let rootStat;
  try {
    rootStat = await stat(root);
  } catch {
    throw new Error(`Built site directory does not exist: ${root}. Run the production build first.`);
  }
  if (!rootStat.isDirectory()) throw new Error(`Built site path is not a directory: ${root}`);

  const htmlFiles = (await filesBelow(root, root)).filter((file) => file.toLowerCase().endsWith(".html"));
  const discovered = new Map();

  for (const file of htmlFiles) {
    const relativeFile = path.relative(root, file).split(path.sep).join("/");
    const sourceUrl = new URL(relativeFile, `${excludedOrigin}/`);
    const html = await readFile(file, "utf8");

    for (const reference of tagAttributes(html)) {
      if (!reference.value) continue;
      let parsed;
      try {
        parsed = new URL(reference.value, sourceUrl);
      } catch {
        continue;
      }
      if (!new Set(["http:", "https:"]).has(parsed.protocol) || parsed.origin === excludedOrigin) continue;

      parsed.hash = "";
      const requestedUrl = parsed.toString();
      const existing = discovered.get(requestedUrl) ?? {
        requested_url: requestedUrl,
        sources: [],
      };
      const source = { file: relativeFile, attribute: reference.attribute };
      if (
        !existing.sources.some(
          (candidate) => candidate.file === source.file && candidate.attribute === source.attribute,
        )
      ) {
        existing.sources.push(source);
      }
      discovered.set(requestedUrl, existing);
    }
  }

  const links = [...discovered.values()].sort((left, right) =>
    compareText(left.requested_url, right.requested_url),
  );
  for (const link of links) {
    link.sources.sort((left, right) =>
      compareText(`${left.file}:${left.attribute}`, `${right.file}:${right.attribute}`),
    );
  }

  return {
    htmlFiles: htmlFiles.map((file) => path.relative(root, file).split(path.sep).join("/")),
    links,
  };
}

export function classifyHttpStatus(status) {
  if (status >= 200 && status < 400) return "verified";
  // LinkedIn uses the non-standard 999 response to reject automated clients.
  // Like 401/403, it proves that the configured host and path were reached but
  // cannot establish the human-browser response, so retain it as a warning.
  if (status === 401 || status === 403 || status === 999) return "access-restricted";
  if (status === 404 || status === 410) return "broken";
  return "remote-failure";
}

function retryableStatus(status) {
  return RETRYABLE_STATUSES.has(status) || status >= 500;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function errorMessage(error, timeoutMs) {
  if (error instanceof Error && error.name === "AbortError") return `Timed out after ${timeoutMs} ms`;
  return error instanceof Error ? error.message : String(error);
}

async function cancelBody(response) {
  try {
    await response.body?.cancel();
  } catch {
    // Headers are sufficient evidence. A cancellation failure must not trigger a body read.
  }
}

export async function probeExternalUrl(requestedUrl, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const waitImpl = options.waitImpl ?? wait;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(requestedUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
          Range: "bytes=0-0",
          "User-Agent": `UNLV-Econ-WPS-external-link-auditor/1.0 (+${DEFAULT_CANONICAL_ORIGIN}/)`,
        },
        redirect: "follow",
        signal: controller.signal,
      });
      await cancelBody(response);
      const result = {
        requested_url: requestedUrl,
        final_url: response.url || requestedUrl,
        status: response.status,
        content_type: response.headers.get("content-type"),
        outcome: classifyHttpStatus(response.status),
        attempts: attempt,
        method: "GET",
        error: response.status >= 400 ? `HTTP ${response.status}` : null,
      };

      if (retryableStatus(response.status) && attempt < maxAttempts) {
        await waitImpl(Math.min(250 * 2 ** (attempt - 1), 2_000));
        continue;
      }
      return result;
    } catch (error) {
      const lastNetworkError = errorMessage(error, timeoutMs);
      if (attempt < maxAttempts) {
        await waitImpl(Math.min(250 * 2 ** (attempt - 1), 2_000));
        continue;
      }
      return {
        requested_url: requestedUrl,
        final_url: null,
        status: null,
        content_type: null,
        outcome: "network-failure",
        attempts: attempt,
        method: "GET",
        error: lastNetworkError,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`External probe exhausted without a result: ${requestedUrl}`);
}

async function mapWithConcurrency(values, concurrency, callback) {
  const output = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await callback(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return output;
}

export function determineExitCode(records) {
  if (records.some((record) => record.outcome === "broken")) return 1;
  if (records.some((record) => new Set(["remote-failure", "network-failure"]).has(record.outcome))) return 2;
  return 0;
}

function summarize(records, htmlFileCount) {
  const summary = {
    html_files: htmlFileCount,
    unique_external_urls: records.length,
    verified: 0,
    "access-restricted": 0,
    broken: 0,
    "remote-failure": 0,
    "network-failure": 0,
    exit_code: determineExitCode(records),
  };
  for (const record of records) summary[record.outcome] += 1;
  return summary;
}

function markdownCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function renderExternalLinkMarkdown(output) {
  const summary = output.summary;
  const lines = [
    "# External Link Audit",
    "",
    `Generated: ${output.generated_at}`,
    "",
    `Canonical origin excluded from the audit: ${output.canonical_origin}`,
    "",
    "The auditor sends a one-byte range request, follows redirects, and cancels the response body after receiving headers. HTTP 401, 403, and LinkedIn's non-standard 999 response are warnings because they establish that the server was reached but access was restricted. HTTP 404 and 410 responses fail the gate as broken links. Other HTTP and network failures remain unresolved and use exit code 2.",
    "",
    "## Summary",
    "",
    `- Built HTML files scanned: ${summary.html_files}`,
    `- Unique external URLs: ${summary.unique_external_urls}`,
    `- Verified: ${summary.verified}`,
    `- Access restricted (warning): ${summary["access-restricted"]}`,
    `- Broken (404/410): ${summary.broken}`,
    `- Remote failures: ${summary["remote-failure"]}`,
    `- Network failures: ${summary["network-failure"]}`,
    `- Exit code: ${summary.exit_code}`,
    "",
    "## Results",
    "",
    "| Outcome | Requested URL | Final URL | Status | Content type | Attempts | Sources | Detail |",
    "| --- | --- | --- | ---: | --- | ---: | --- | --- |",
  ];

  for (const record of output.records) {
    const sources = record.sources.map((source) => `${source.file} (${source.attribute})`).join("<br>");
    lines.push(
      `| ${markdownCell(record.outcome)} | ${markdownCell(record.requested_url)} | ${markdownCell(record.final_url)} | ${markdownCell(record.status)} | ${markdownCell(record.content_type)} | ${record.attempts} | ${markdownCell(sources)} | ${markdownCell(record.error)} |`,
    );
  }

  if (output.records.length === 0)
    lines.push("| verified | No external href/src URLs were found. | — | — | — | — | — | — |");
  lines.push("");
  return lines.join("\n");
}

function positiveInteger(name, value, minimum, maximum) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
  }
  return parsed;
}

export function parseExternalLinkArguments(argv) {
  const values = {
    distDirectory: DEFAULT_DIST_DIRECTORY,
    canonicalOrigin: DEFAULT_CANONICAL_ORIGIN,
    outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
    jsonPath: null,
    markdownPath: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    concurrency: DEFAULT_CONCURRENCY,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.`);

    if (argument === "--dist") values.distDirectory = path.resolve(value);
    else if (argument === "--origin") values.canonicalOrigin = normalizedCanonicalOrigin(value);
    else if (argument === "--output-dir") values.outputDirectory = path.resolve(value);
    else if (argument === "--json") values.jsonPath = path.resolve(value);
    else if (argument === "--markdown") values.markdownPath = path.resolve(value);
    else if (argument === "--timeout-ms") values.timeoutMs = positiveInteger(argument, value, 250, 60_000);
    else if (argument === "--attempts") values.maxAttempts = positiveInteger(argument, value, 1, 5);
    else if (argument === "--concurrency") values.concurrency = positiveInteger(argument, value, 1, 12);
    else throw new Error(`Unknown argument: ${argument}`);
    index += 1;
  }

  values.jsonPath ??= path.join(values.outputDirectory, "external-links.json");
  values.markdownPath ??= path.join(values.outputDirectory, "EXTERNAL_LINKS.md");
  return values;
}

function resolvedOptions(options) {
  const outputDirectory = path.resolve(options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY);
  return {
    distDirectory: path.resolve(options.distDirectory ?? DEFAULT_DIST_DIRECTORY),
    canonicalOrigin: normalizedCanonicalOrigin(options.canonicalOrigin ?? DEFAULT_CANONICAL_ORIGIN),
    outputDirectory,
    jsonPath: path.resolve(options.jsonPath ?? path.join(outputDirectory, "external-links.json")),
    markdownPath: path.resolve(options.markdownPath ?? path.join(outputDirectory, "EXTERNAL_LINKS.md")),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxAttempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
  };
}

export async function runExternalLinkAudit(options = {}, dependencies = {}) {
  const resolved = resolvedOptions(options);
  const scanned = await scanExternalLinks(resolved);
  const records = await mapWithConcurrency(scanned.links, resolved.concurrency, async (link) => ({
    ...(await probeExternalUrl(link.requested_url, {
      timeoutMs: resolved.timeoutMs,
      maxAttempts: resolved.maxAttempts,
      fetchImpl: dependencies.fetchImpl,
      waitImpl: dependencies.waitImpl,
    })),
    sources: link.sources,
  }));
  const output = {
    schema_version: 1,
    generated_at: (dependencies.now ?? (() => new Date()))().toISOString(),
    canonical_origin: resolved.canonicalOrigin,
    dist_directory: reportPath(resolved.distDirectory),
    configuration: {
      timeout_ms: resolved.timeoutMs,
      max_attempts: resolved.maxAttempts,
      concurrency: resolved.concurrency,
      request_method: "GET",
      range: "bytes=0-0",
      redirects: "follow",
    },
    summary: summarize(records, scanned.htmlFiles.length),
    records,
  };

  await Promise.all([
    mkdir(path.dirname(resolved.jsonPath), { recursive: true }).then(() =>
      writeFile(resolved.jsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8"),
    ),
    mkdir(path.dirname(resolved.markdownPath), { recursive: true }).then(() =>
      writeFile(resolved.markdownPath, renderExternalLinkMarkdown(output), "utf8"),
    ),
  ]);

  return {
    output,
    exitCode: output.summary.exit_code,
    jsonPath: resolved.jsonPath,
    markdownPath: resolved.markdownPath,
  };
}

async function main() {
  const options = parseExternalLinkArguments(process.argv.slice(2));
  const result = await runExternalLinkAudit(options);
  console.log(`Wrote ${result.jsonPath}`);
  console.log(`Wrote ${result.markdownPath}`);
  console.log(JSON.stringify(result.output.summary));

  const restricted = result.output.summary["access-restricted"];
  if (restricted > 0)
    console.warn(
      `WARNING: ${restricted} external URL(s) returned an access-restriction response (401, 403, or 999).`,
    );
  if (result.exitCode === 1) console.error("ERROR: one or more external URLs returned HTTP 404 or 410.");
  if (result.exitCode === 2)
    console.error("ERROR: one or more external URLs had an unresolved remote or network failure.");
  process.exitCode = result.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
