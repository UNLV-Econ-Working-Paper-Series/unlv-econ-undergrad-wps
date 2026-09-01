import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { validateReleaseManifest } from "./lib/release-manifest.mjs";

const CANONICAL_ORIGIN = "https://econ-undergrad-wps.sites.unlv.edu";
const REPRESENTATIVE_PAPER_PATH = "/papers/hedonics-used-car-attributes/";
const REPRESENTATIVE_PAPER_TITLE = "Hedonics of Used Car Attributes on Market Price";
const REPRESENTATIVE_PAPER_DOI = "10.34917/40601193";
const DEFAULT_JSON_PATH = "artifacts/production/production-verification.json";
const DEFAULT_MARKDOWN_PATH = "artifacts/production/PRODUCTION_VERIFICATION.md";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const USER_AGENT = "UNLV-Econ-WPS-production-verifier/2.0";
const PACKAGE_VERSION = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
).version;

const SAFE_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-encoding",
  "content-length",
  "content-security-policy",
  "content-type",
  "etag",
  "expires",
  "last-modified",
  "location",
  "permissions-policy",
  "referrer-policy",
  "server",
  "strict-transport-security",
  "vary",
  "x-content-type-options",
  "x-frame-options",
];

const ROUTES = [
  { path: "/", text: "Working Paper Series", mediaTypes: ["text/html"] },
  { path: "/papers/", text: "Working Papers", mediaTypes: ["text/html"] },
  {
    path: REPRESENTATIVE_PAPER_PATH,
    text: REPRESENTATIVE_PAPER_TITLE,
    mediaTypes: ["text/html"],
  },
  { path: "/issues/2025-fall/", text: "Fall 2025", mediaTypes: ["text/html"] },
  {
    path: "/fields/applied-microeconomics/",
    text: "Applied Microeconomics",
    mediaTypes: ["text/html"],
  },
  { path: "/contact/", text: "Contact", mediaTypes: ["text/html"] },
  { path: "/sitemap.xml", text: "<urlset", mediaTypes: ["application/xml", "text/xml"] },
  { path: "/robots.txt", text: "Sitemap:", mediaTypes: ["text/plain"] },
];

const LEGACY_REDIRECTS = [
  { source: "/categories/", target: "/fields/" },
  { source: "/our/", target: "/for-authors/" },
  { source: "/graduate-assistants/", target: "/editorial-board/#junior-editors" },
];

const CITATION_EXPORTS = [
  {
    path: `${REPRESENTATIVE_PAPER_PATH}citation.bib`,
    mediaType: "application/x-bibtex",
    markers: ["@techreport{", REPRESENTATIVE_PAPER_DOI],
  },
  {
    path: `${REPRESENTATIVE_PAPER_PATH}citation.ris`,
    mediaType: "application/x-research-info-systems",
    markers: ["TY  - RPRT", "ER  -", REPRESENTATIVE_PAPER_DOI],
  },
];

function parseInteger(value, name, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || String(parsed) !== value || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
  }
  return parsed;
}

export function parseCliOptions(argv) {
  const values = new Map();
  const flags = new Set();
  const valueOptions = new Set([
    "--origin",
    "--expected-commit",
    "--json",
    "--markdown",
    "--timeout-ms",
    "--attempts",
  ]);
  const flagOptions = new Set(["--include-external"]);

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (flagOptions.has(token)) {
      flags.add(token);
      continue;
    }
    if (!valueOptions.has(token)) throw new Error(`Unknown option: ${token}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${token} requires a value.`);
    if (values.has(token)) throw new Error(`${token} may only be supplied once.`);
    values.set(token, value);
    index += 1;
  }

  const origin = normalizeOrigin(values.get("--origin") ?? CANONICAL_ORIGIN);
  const expectedCommit = values.get("--expected-commit")?.trim().toLowerCase();
  if (expectedCommit && !/^[a-f0-9]{40}$/u.test(expectedCommit)) {
    throw new Error("--expected-commit must be a full 40-character hexadecimal Git commit.");
  }

  const jsonPath = values.get("--json") ?? DEFAULT_JSON_PATH;
  const markdownPath = values.get("--markdown") ?? DEFAULT_MARKDOWN_PATH;
  if (path.resolve(jsonPath) === path.resolve(markdownPath)) {
    throw new Error("--json and --markdown must name different output files.");
  }

  return {
    origin,
    expectedCommit,
    jsonPath,
    markdownPath,
    timeoutMs: parseInteger(values.get("--timeout-ms") ?? "15000", "--timeout-ms", 1000, 60000),
    attempts: parseInteger(values.get("--attempts") ?? "3", "--attempts", 1, 5),
    includeExternal: flags.has("--include-external"),
  };
}

export function normalizeOrigin(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid origin: ${JSON.stringify(value)}.`);
  }
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocal)) {
    throw new Error("Production verification requires HTTPS unless the origin is local.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("--origin must contain only a scheme, host, and optional port.");
  }
  return parsed.origin;
}

function createReport(options) {
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    origin: options.origin,
    expected_commit: options.expectedCommit ?? null,
    configuration: {
      attempts: options.attempts,
      timeout_ms: options.timeoutMs,
      maximum_body_bytes: MAX_BODY_BYTES,
      external_repository_checks_requested: options.includeExternal,
    },
    summary: { failures: 0, warnings: 0, observations: 0 },
    failures: [],
    warnings: [],
    observations: [],
    limitations: [
      "This verifier observes HTTP responses. It does not prove browser layout, keyboard operation, assistive-technology behavior, DNS ownership, TLS-chain quality, or server-side backup and rollback readiness.",
      "Set-Cookie values are never stored in the evidence artifacts.",
      "Repository-of-record DOI and OASIS availability are delegated to the separate OASIS verifier.",
    ],
  };
}

function addFailure(report, code, message, observationId) {
  const failure = { code, message };
  if (observationId) failure.observation_id = observationId;
  report.failures.push(failure);
}

function addWarning(report, code, message, observationId) {
  const warning = { code, message };
  if (observationId) warning.observation_id = observationId;
  report.warnings.push(warning);
}

function addObservation(report, observation) {
  const id = `http-${String(report.observations.length + 1).padStart(3, "0")}`;
  report.observations.push({ id, ...observation });
  return id;
}

function headerValue(headers, name) {
  if (headers && typeof headers.get === "function") return headers.get(name);
  const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  const value = key ? headers[key] : null;
  return Array.isArray(value) ? value.join(", ") : (value ?? null);
}

function safeHeaders(headers) {
  return Object.fromEntries(
    SAFE_RESPONSE_HEADERS.flatMap((name) => {
      const value = headerValue(headers, name);
      return value === null ? [] : [[name, value]];
    }),
  );
}

function cookieCount(headers) {
  if (typeof headers?.getSetCookie === "function") return headers.getSetCookie().length;
  return headerValue(headers, "set-cookie") === null ? 0 : 1;
}

function mediaType(headers) {
  return (headerValue(headers, "content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
}

function shouldRetryStatus(status) {
  return [408, 425, 429].includes(status) || status >= 500;
}

async function readBodyLimited(response, maximumBytes) {
  if (!response.body) return { text: "", bytes: 0, truncated: false };
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maximumBytes) {
      await reader.cancel("Production verifier body-size limit reached.");
      return { text: "", bytes, truncated: true };
    }
    chunks.push(Buffer.from(value));
  }

  return { text: Buffer.concat(chunks, bytes).toString("utf8"), bytes, truncated: false };
}

async function fetchWithRetries(url, options) {
  let lastError;
  const overallStartedAt = Date.now();
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const response = await options.fetchImpl(url, {
        headers: { Accept: "*/*", "User-Agent": USER_AGENT },
        redirect: options.redirect,
        signal: controller.signal,
      });
      if (attempt < options.attempts && shouldRetryStatus(response.status)) {
        await response.body?.cancel();
        continue;
      }
      const body = options.readBody
        ? await readBodyLimited(response, options.maximumBodyBytes)
        : { text: "", bytes: 0, truncated: false };
      if (!options.readBody) await response.body?.cancel();
      return {
        response,
        body: body.text,
        bodyBytes: body.bytes,
        bodyTruncated: body.truncated,
        attemptsUsed: attempt,
        elapsedMs: Date.now() - overallStartedAt,
      };
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts) break;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function request(context, value, options = {}) {
  const url = new URL(value, context.options.origin).toString();
  try {
    const result = await fetchWithRetries(url, {
      attempts: context.options.attempts,
      timeoutMs: context.options.timeoutMs,
      maximumBodyBytes: MAX_BODY_BYTES,
      fetchImpl: context.fetchImpl,
      redirect: options.redirect ?? "follow",
      readBody: options.readBody ?? true,
    });
    const cookies = cookieCount(result.response.headers);
    const observationId = addObservation(context.report, {
      label: options.label ?? value,
      requested_url: url,
      final_url: result.response.url || url,
      status: result.response.status,
      redirected: result.response.redirected,
      attempts: result.attemptsUsed,
      elapsed_ms: result.elapsedMs,
      body_bytes: result.bodyBytes,
      body_truncated: result.bodyTruncated,
      set_cookie_present: cookies > 0,
      set_cookie_count: cookies,
      response_headers: safeHeaders(result.response.headers),
    });
    if (result.bodyTruncated) {
      addFailure(
        context.report,
        "http.body-too-large",
        `${url} exceeded the ${MAX_BODY_BYTES}-byte verification limit.`,
        observationId,
      );
    }
    if (cookies > 0) {
      addFailure(
        context.report,
        "privacy.unexpected-cookie",
        `${url} returned ${cookies} Set-Cookie header${cookies === 1 ? "" : "s"}.`,
        observationId,
      );
    }
    return { ...result, observationId, requestedUrl: url };
  } catch (error) {
    const observationId = addObservation(context.report, {
      label: options.label ?? value,
      requested_url: url,
      final_url: null,
      status: null,
      attempts: context.options.attempts,
      error: error instanceof Error ? error.message : String(error),
    });
    addFailure(
      context.report,
      "http.request-failed",
      `${url} failed after ${context.options.attempts} attempt(s): ${error instanceof Error ? error.message : String(error)}`,
      observationId,
    );
    return null;
  }
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/gu, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([a-f0-9]+);/giu, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&quot;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&amp;/giu, "&");
}

export function parseAttributes(source) {
  const attributes = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu;
  for (const match of source.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function openingTags(html, name) {
  const pattern = new RegExp(`<${name}\\b([^>]*)>`, "giu");
  return [...html.matchAll(pattern)].map((match) => parseAttributes(match[1]));
}

function scriptBlocks(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/giu)].map((match) => ({
    attributes: parseAttributes(match[1]),
    body: match[2],
  }));
}

function metaValues(html, attribute, value) {
  return openingTags(html, "meta")
    .filter((meta) => meta[attribute]?.toLowerCase() === value.toLowerCase())
    .map((meta) => meta.content ?? "");
}

function canonicalHref(html) {
  return (
    openingTags(html, "link").find((link) =>
      (link.rel ?? "").toLowerCase().split(/\s+/u).includes("canonical"),
    )?.href ?? null
  );
}

function equivalentUrl(actual, expected, base) {
  try {
    return new URL(actual, base).toString() === new URL(expected, base).toString();
  } catch {
    return false;
  }
}

function validateMetadataValue(report, html, selector, expected, label, observationId) {
  const [attribute, name] = selector;
  const values = metaValues(html, attribute, name);
  if (!values.includes(expected)) {
    addFailure(
      report,
      "metadata.missing-or-wrong",
      `${label} must expose ${attribute}=${JSON.stringify(name)} with content ${JSON.stringify(expected)}.`,
      observationId,
    );
  }
}

function jsonLdNodes(value) {
  if (Array.isArray(value)) return value.flatMap(jsonLdNodes);
  if (!value || typeof value !== "object") return [];
  const record = value;
  const graph = Array.isArray(record["@graph"]) ? record["@graph"].flatMap(jsonLdNodes) : [];
  return [record, ...graph];
}

export function inspectHtmlSafety(html, documentUrl, allowedOrigin) {
  const issues = [];
  const remoteScripts = [];
  const mixedContent = [];

  for (const script of scriptBlocks(html)) {
    const source = script.attributes.src;
    if (!source) continue;
    try {
      const resolved = new URL(source, documentUrl);
      if (!["http:", "https:"].includes(resolved.protocol) || resolved.origin !== allowedOrigin) {
        remoteScripts.push(resolved.toString());
      }
      if (resolved.protocol === "http:" && new URL(documentUrl).protocol === "https:") {
        mixedContent.push(resolved.toString());
      }
    } catch {
      issues.push(`Invalid script URL: ${source}`);
    }
  }

  const attributePattern = /\b(?:href|src|action|poster)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/giu;
  for (const match of html.matchAll(attributePattern)) {
    const value = decodeHtml(match[1] ?? match[2] ?? match[3]);
    if (/^http:\/\//iu.test(value) && new URL(documentUrl).protocol === "https:") mixedContent.push(value);
  }
  for (const match of html.matchAll(/url\(\s*["']?(http:\/\/[^)"']+)/giu)) {
    if (new URL(documentUrl).protocol === "https:") mixedContent.push(match[1]);
  }

  return {
    issues,
    remoteScripts: [...new Set(remoteScripts)],
    mixedContent: [...new Set(mixedContent)],
  };
}

export function validateBuildManifest(manifest, options) {
  return validateReleaseManifest(manifest, {
    expectedVersion: PACKAGE_VERSION,
    expectedCommit: options?.expectedCommit,
    requireCleanSource: true,
  });
}

function parseCacheControl(value) {
  const directives = new Map();
  for (const part of (value ?? "").split(",")) {
    const [name, rawValue] = part.trim().split("=", 2);
    if (name) directives.set(name.toLowerCase(), rawValue?.replace(/^"|"$/gu, "") ?? true);
  }
  return directives;
}

function numericCacheDirective(directives, name) {
  const value = directives.get(name);
  return typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : Number.NaN;
}

export function analyzeSecurityHeaders(headers, isHttps = true) {
  const failures = [];
  const warnings = [];
  const csp = headerValue(headers, "content-security-policy") ?? "";
  const hsts = headerValue(headers, "strict-transport-security") ?? "";
  const contentTypeOptions = headerValue(headers, "x-content-type-options") ?? "";
  const referrerPolicy = headerValue(headers, "referrer-policy") ?? "";
  const permissionsPolicy = headerValue(headers, "permissions-policy") ?? "";
  const frameOptions = headerValue(headers, "x-frame-options") ?? "";
  const server = headerValue(headers, "server") ?? "";

  if (isHttps) {
    const maxAge = /(?:^|;)\s*max-age=(\d+)(?:;|$)/iu.exec(hsts)?.[1];
    if (!maxAge) failures.push("Strict-Transport-Security is missing or lacks max-age.");
    else if (Number(maxAge) < 31_536_000) failures.push("HSTS max-age is less than 31536000 seconds.");
  }
  if (!csp) failures.push("Content-Security-Policy is missing.");
  else {
    if (!/(?:^|;)\s*default-src\s+/iu.test(csp)) failures.push("CSP lacks a default-src directive.");
    if (/\bSAMEORIGIN\b/iu.test(csp)) failures.push("CSP contains invalid X-Frame-Options token SAMEORIGIN.");
    if (/(?:^|\s)'unsafe-eval'(?:\s|;|$)/iu.test(csp)) failures.push("CSP allows unsafe-eval.");
  }
  if (contentTypeOptions.toLowerCase() !== "nosniff") {
    failures.push("X-Content-Type-Options must be exactly nosniff without duplicate values.");
  }
  if (!referrerPolicy) failures.push("Referrer-Policy is missing.");
  else if (/^(?:unsafe-url|no-referrer-when-downgrade)$/iu.test(referrerPolicy.trim())) {
    failures.push(`Referrer-Policy is too permissive: ${referrerPolicy}.`);
  }
  if (!permissionsPolicy) failures.push("Permissions-Policy is missing.");
  const hasFrameAncestors = /(?:^|;)\s*frame-ancestors\s+/iu.test(csp);
  if (!hasFrameAncestors && !/^(?:DENY|SAMEORIGIN)$/iu.test(frameOptions.trim())) {
    failures.push("Clickjacking protection is missing (frame-ancestors or X-Frame-Options).");
  }
  if (/\b(?:Apache|nginx|Microsoft-IIS|PHP)\/\d/iu.test(server)) {
    failures.push(`Server header discloses a software version: ${server}.`);
  } else if (server) {
    warnings.push(`Server product is disclosed: ${server}.`);
  }
  return { failures, warnings };
}

function validateHtmlCache(headers) {
  const value = headerValue(headers, "cache-control");
  if (!value) return ["HTML response lacks Cache-Control."];
  const directives = parseCacheControl(value);
  const maxAge = numericCacheDirective(directives, "max-age");
  const explicitlyRevalidated = directives.has("no-cache") || directives.has("no-store");
  if (directives.has("immutable")) return ["HTML response must not be immutable."];
  if (!explicitlyRevalidated && (!Number.isFinite(maxAge) || maxAge > 3600)) {
    return ["HTML Cache-Control must require revalidation or use max-age no greater than 3600."];
  }
  return [];
}

function validateManifestCache(headers) {
  const value = headerValue(headers, "cache-control");
  if (!value) return ["build-manifest.json lacks Cache-Control."];
  const directives = parseCacheControl(value);
  const maxAge = numericCacheDirective(directives, "max-age");
  if (!directives.has("no-cache") && !directives.has("no-store") && maxAge !== 0) {
    return ["build-manifest.json must require revalidation (no-cache, no-store, or max-age=0)."];
  }
  return [];
}

function validateAssetCache(headers) {
  const value = headerValue(headers, "cache-control");
  if (!value) return ["Hashed asset lacks Cache-Control."];
  const directives = parseCacheControl(value);
  const maxAge = numericCacheDirective(directives, "max-age");
  const failures = [];
  if (!Number.isFinite(maxAge) || maxAge < 31_536_000)
    failures.push("Hashed asset max-age is less than 31536000.");
  if (!directives.has("immutable")) failures.push("Hashed asset Cache-Control lacks immutable.");
  return failures;
}

function inspectRouteResponse(context, route, result) {
  const { report } = context;
  const expectedUrl = new URL(route.path, context.options.origin).toString();
  if (result.response.status !== 200) {
    addFailure(
      report,
      "route.status",
      `${route.path} returned ${result.response.status}; expected 200.`,
      result.observationId,
    );
  }
  if (result.response.url !== expectedUrl) {
    addFailure(
      report,
      "route.final-url",
      `${route.path} ended at ${result.response.url || "an unknown URL"}; expected ${expectedUrl}.`,
      result.observationId,
    );
  }
  const actualMediaType = mediaType(result.response.headers);
  if (!route.mediaTypes.includes(actualMediaType)) {
    addFailure(
      report,
      "route.content-type",
      `${route.path} returned ${actualMediaType || "no Content-Type"}; expected ${route.mediaTypes.join(" or ")}.`,
      result.observationId,
    );
  }
  if (!result.body.includes(route.text)) {
    addFailure(
      report,
      "route.required-text",
      `${route.path} is missing required text ${JSON.stringify(route.text)}.`,
      result.observationId,
    );
  }
}

function inspectDocumentSafety(context, result) {
  const safety = inspectHtmlSafety(result.body, result.response.url, context.options.origin);
  for (const issue of safety.issues) {
    addFailure(context.report, "html.invalid-url", issue, result.observationId);
  }
  for (const source of safety.remoteScripts) {
    addFailure(
      context.report,
      "privacy.remote-executable-script",
      `${result.response.url} loads remote executable script ${source}.`,
      result.observationId,
    );
  }
  for (const source of safety.mixedContent) {
    addFailure(
      context.report,
      "security.mixed-content",
      `${result.response.url} references insecure content ${source}.`,
      result.observationId,
    );
  }
}

function inspectHomepageMetadata(context, result) {
  const canonical = `${context.options.origin}/`;
  if (!equivalentUrl(canonicalHref(result.body), canonical, canonical)) {
    addFailure(
      context.report,
      "metadata.canonical",
      `Homepage canonical must equal ${canonical}.`,
      result.observationId,
    );
  }
  for (const [selector, expected] of [
    [["property", "og:type"], "website"],
    [["property", "og:url"], canonical],
    [["name", "twitter:card"], "summary_large_image"],
  ]) {
    validateMetadataValue(context.report, result.body, selector, expected, "Homepage", result.observationId);
  }
  for (const [attribute, name] of [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:image"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ]) {
    if (!metaValues(result.body, attribute, name).some(Boolean)) {
      addFailure(
        context.report,
        "metadata.missing-social-value",
        `Homepage is missing a non-empty ${attribute}=${JSON.stringify(name)} value.`,
        result.observationId,
      );
    }
  }
}

function inspectPaperMetadata(context, result) {
  const canonical = new URL(REPRESENTATIVE_PAPER_PATH, context.options.origin).toString();
  if (!equivalentUrl(canonicalHref(result.body), canonical, canonical)) {
    addFailure(
      context.report,
      "metadata.paper-canonical",
      `Representative paper canonical must equal ${canonical}.`,
      result.observationId,
    );
  }
  for (const [attribute, name] of [
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:image"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ]) {
    if (!metaValues(result.body, attribute, name).some(Boolean)) {
      addFailure(
        context.report,
        "metadata.missing-paper-social-value",
        `Representative paper is missing a non-empty ${attribute}=${JSON.stringify(name)} value.`,
        result.observationId,
      );
    }
  }
  validateMetadataValue(
    context.report,
    result.body,
    ["name", "twitter:card"],
    "summary_large_image",
    "Representative paper",
    result.observationId,
  );
  for (const [selector, expected] of [
    [["property", "og:type"], "article"],
    [["property", "og:url"], canonical],
    [["name", "citation_title"], REPRESENTATIVE_PAPER_TITLE],
    [["name", "citation_doi"], REPRESENTATIVE_PAPER_DOI],
    [["name", "citation_abstract_html_url"], canonical],
  ]) {
    validateMetadataValue(
      context.report,
      result.body,
      selector,
      expected,
      "Representative paper",
      result.observationId,
    );
  }
  if (metaValues(result.body, "name", "citation_author").length === 0) {
    addFailure(
      context.report,
      "metadata.citation-author",
      "Representative paper is missing citation_author metadata.",
      result.observationId,
    );
  }
  if (!metaValues(result.body, "name", "citation_publication_date").some(Boolean)) {
    addFailure(
      context.report,
      "metadata.citation-date",
      "Representative paper is missing citation_publication_date metadata.",
      result.observationId,
    );
  }

  const parsed = [];
  for (const script of scriptBlocks(result.body)) {
    if (script.attributes.type?.toLowerCase() !== "application/ld+json") continue;
    try {
      parsed.push(JSON.parse(script.body));
    } catch (error) {
      addFailure(
        context.report,
        "metadata.invalid-json-ld",
        `Representative paper JSON-LD is invalid: ${error instanceof Error ? error.message : String(error)}`,
        result.observationId,
      );
    }
  }
  const scholarlyArticle = parsed.flatMap(jsonLdNodes).find((node) => {
    const type = node["@type"];
    return type === "ScholarlyArticle" || (Array.isArray(type) && type.includes("ScholarlyArticle"));
  });
  if (!scholarlyArticle) {
    addFailure(
      context.report,
      "metadata.scholarly-json-ld",
      "Representative paper lacks a ScholarlyArticle JSON-LD record.",
      result.observationId,
    );
    return;
  }
  const contextValue =
    scholarlyArticle["@context"] ?? parsed.find((value) => value?.["@context"])?.["@context"];
  if (contextValue !== "https://schema.org" && contextValue !== "http://schema.org") {
    addFailure(
      context.report,
      "metadata.schema-context",
      "ScholarlyArticle JSON-LD lacks a schema.org @context.",
      result.observationId,
    );
  }
  if (scholarlyArticle.headline !== REPRESENTATIVE_PAPER_TITLE) {
    addFailure(
      context.report,
      "metadata.schema-headline",
      "ScholarlyArticle headline does not match the representative paper title.",
      result.observationId,
    );
  }
  if (!equivalentUrl(scholarlyArticle.url, canonical, canonical)) {
    addFailure(
      context.report,
      "metadata.schema-url",
      "ScholarlyArticle URL does not match the representative paper canonical.",
      result.observationId,
    );
  }
}

function stylesheetUrls(html, baseUrl) {
  return openingTags(html, "link")
    .filter((link) => (link.rel ?? "").toLowerCase().split(/\s+/u).includes("stylesheet"))
    .flatMap((link) => {
      try {
        return link.href ? [new URL(link.href, baseUrl).toString()] : [];
      } catch {
        return [];
      }
    });
}

function javascriptUrls(html, baseUrl) {
  return scriptBlocks(html).flatMap((script) => {
    try {
      return script.attributes.src ? [new URL(script.attributes.src, baseUrl).toString()] : [];
    } catch {
      return [];
    }
  });
}

async function inspectAssets(context, homepage) {
  const cssUrls = [...new Set(stylesheetUrls(homepage.body, homepage.response.url))].filter(
    (url) => new URL(url).origin === context.options.origin,
  );
  const jsUrls = [...new Set(javascriptUrls(homepage.body, homepage.response.url))].filter(
    (url) => new URL(url).origin === context.options.origin,
  );
  if (cssUrls.length === 0) {
    addFailure(
      context.report,
      "asset.stylesheet-missing",
      "Homepage does not reference a same-origin stylesheet.",
    );
  }

  for (const [kind, urls] of [
    ["stylesheet", cssUrls.slice(0, 2)],
    ["script", jsUrls.slice(0, 2)],
  ]) {
    for (const url of urls) {
      const result = await request(context, url, { label: `Representative ${kind}` });
      if (!result) continue;
      if (result.response.status !== 200 || result.response.url !== url) {
        addFailure(
          context.report,
          "asset.response",
          `${url} must return 200 without redirect; received ${result.response.status} at ${result.response.url}.`,
          result.observationId,
        );
      }
      const actualMediaType = mediaType(result.response.headers);
      const correctType =
        kind === "stylesheet"
          ? actualMediaType === "text/css"
          : ["application/javascript", "text/javascript", "application/ecmascript"].includes(actualMediaType);
      if (!correctType) {
        addFailure(
          context.report,
          "asset.content-type",
          `${url} returned ${actualMediaType || "no Content-Type"}; expected ${kind} MIME.`,
          result.observationId,
        );
      }
      if (kind === "stylesheet" && !result.body.includes("{")) {
        addFailure(
          context.report,
          "asset.empty-css",
          `${url} does not contain recognizable CSS.`,
          result.observationId,
        );
      }
      if (!/_astro\/[^/?]+\.[a-z0-9_-]{6,}\.(?:css|m?js)(?:$|\?)/iu.test(url)) {
        addFailure(
          context.report,
          "asset.not-content-hashed",
          `${url} is not a recognizable content-hashed Astro asset.`,
          result.observationId,
        );
      }
      for (const issue of validateAssetCache(result.response.headers)) {
        addFailure(context.report, "cache.asset", `${url}: ${issue}`, result.observationId);
      }
    }
  }

  if (jsUrls.length === 0) {
    addWarning(
      context.report,
      "asset.no-external-javascript",
      "Homepage has no same-origin external JavaScript. Inline Astro scripts remain covered by CSP and HTML-safety observations.",
      homepage.observationId,
    );
  }
}

export function analyzeLegacyResponse({ status, location, body, requestedUrl, targetUrl }) {
  const issues = [];
  if ([301, 302, 303, 307, 308].includes(status)) {
    if (!location) issues.push("HTTP redirect lacks a Location header.");
    else if (!equivalentUrl(location, targetUrl, requestedUrl)) {
      issues.push(`HTTP redirect points to ${location}, expected ${targetUrl}.`);
    }
    return issues;
  }
  if (status !== 200)
    return [`Legacy route returned ${status}, expected a redirect or static redirect page.`];

  const refresh = openingTags(body, "meta").find(
    (meta) => meta["http-equiv"]?.toLowerCase() === "refresh",
  )?.content;
  const destination = refresh?.match(/^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*(.+?)\s*$/iu)?.[1];
  if (!destination || !equivalentUrl(destination.replace(/^['"]|['"]$/gu, ""), targetUrl, requestedUrl)) {
    issues.push(`Static redirect page does not refresh to ${targetUrl}.`);
  }
  const robots = metaValues(body, "name", "robots").map((value) => value.toLowerCase().replace(/\s+/gu, ""));
  if (!robots.includes("noindex,follow")) issues.push("Static redirect page lacks robots=noindex, follow.");
  if (!equivalentUrl(canonicalHref(body), targetUrl, requestedUrl)) {
    issues.push(`Static redirect page canonical does not equal ${targetUrl}.`);
  }
  return issues;
}

async function inspectLegacyRedirects(context) {
  for (const redirect of LEGACY_REDIRECTS) {
    const requestedUrl = new URL(redirect.source, context.options.origin).toString();
    const targetUrl = new URL(redirect.target, context.options.origin).toString();
    const result = await request(context, redirect.source, {
      label: `Legacy redirect ${redirect.source}`,
      redirect: "manual",
    });
    if (!result) continue;
    const issues = analyzeLegacyResponse({
      status: result.response.status,
      location: result.response.headers.get("location"),
      body: result.body,
      requestedUrl,
      targetUrl,
    });
    for (const issue of issues) {
      addFailure(context.report, "redirect.legacy", `${redirect.source}: ${issue}`, result.observationId);
    }
  }
}

async function inspectHttpRedirect(context) {
  if (context.options.origin !== CANONICAL_ORIGIN) {
    addWarning(
      context.report,
      "https.redirect-skipped",
      `HTTP-to-HTTPS redirect was skipped because ${context.options.origin} is not the canonical production origin.`,
    );
    return;
  }
  const insecureUrl = `${CANONICAL_ORIGIN.replace(/^https:/u, "http:")}/`;
  const result = await request(context, insecureUrl, {
    label: "Canonical HTTP-to-HTTPS redirect",
    redirect: "manual",
  });
  if (!result) return;
  if (![301, 302, 307, 308].includes(result.response.status)) {
    addFailure(
      context.report,
      "https.redirect-status",
      `${insecureUrl} returned ${result.response.status}; expected an HTTP redirect.`,
      result.observationId,
    );
  }
  const location = result.response.headers.get("location");
  if (!location || !equivalentUrl(location, `${CANONICAL_ORIGIN}/`, insecureUrl)) {
    addFailure(
      context.report,
      "https.redirect-location",
      `${insecureUrl} must redirect to ${CANONICAL_ORIGIN}/; received ${location ?? "no Location header"}.`,
      result.observationId,
    );
  }
}

async function inspectBuildManifest(context) {
  const result = await request(context, "/build-manifest.json", { label: "Build fingerprint" });
  if (!result) return;
  const expectedUrl = new URL("/build-manifest.json", context.options.origin).toString();
  if (result.response.status !== 200 || result.response.url !== expectedUrl) {
    addFailure(
      context.report,
      "manifest.response",
      `build-manifest.json must return 200 at ${expectedUrl}; received ${result.response.status} at ${result.response.url}.`,
      result.observationId,
    );
  }
  if (mediaType(result.response.headers) !== "application/json") {
    addFailure(
      context.report,
      "manifest.content-type",
      `build-manifest.json returned ${mediaType(result.response.headers) || "no Content-Type"}.`,
      result.observationId,
    );
  }
  for (const issue of validateManifestCache(result.response.headers)) {
    addFailure(context.report, "cache.manifest", issue, result.observationId);
  }
  try {
    const manifest = JSON.parse(result.body);
    for (const issue of validateBuildManifest(manifest, { expectedCommit: context.options.expectedCommit })) {
      addFailure(context.report, "manifest.schema", issue, result.observationId);
    }
  } catch (error) {
    addFailure(
      context.report,
      "manifest.invalid-json",
      `build-manifest.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      result.observationId,
    );
  }
}

async function inspectCitations(context) {
  for (const citation of CITATION_EXPORTS) {
    const result = await request(context, citation.path, { label: `Citation export ${citation.path}` });
    if (!result) continue;
    const expectedUrl = new URL(citation.path, context.options.origin).toString();
    if (result.response.status !== 200 || result.response.url !== expectedUrl) {
      addFailure(
        context.report,
        "citation.response",
        `${citation.path} must return 200 without redirect; received ${result.response.status} at ${result.response.url}.`,
        result.observationId,
      );
    }
    if (mediaType(result.response.headers) !== citation.mediaType) {
      addFailure(
        context.report,
        "citation.content-type",
        `${citation.path} returned ${mediaType(result.response.headers) || "no Content-Type"}; expected ${citation.mediaType}.`,
        result.observationId,
      );
    }
    if ((result.response.headers.get("x-content-type-options") ?? "").toLowerCase() !== "nosniff") {
      addFailure(
        context.report,
        "citation.nosniff",
        `${citation.path} must return exactly X-Content-Type-Options: nosniff.`,
        result.observationId,
      );
    }
    for (const marker of citation.markers) {
      if (!result.body.includes(marker)) {
        addFailure(
          context.report,
          "citation.content",
          `${citation.path} is missing ${JSON.stringify(marker)}.`,
          result.observationId,
        );
      }
    }
    const disposition = result.response.headers.get("content-disposition");
    if (result.response.status === 200 && !disposition) {
      addWarning(
        context.report,
        "citation.content-disposition",
        `${citation.path} lacks Content-Disposition; MIME and content remain release gates.`,
        result.observationId,
      );
    }
  }
}

async function inspectCustom404(context) {
  const result = await request(context, "/release-verifier-intentional-missing-route/", {
    label: "Intentional missing route",
  });
  if (!result) return;
  if (result.response.status !== 404) {
    addFailure(
      context.report,
      "error-page.status",
      `Intentional missing route returned ${result.response.status}; expected 404.`,
      result.observationId,
    );
  }
  if (mediaType(result.response.headers) !== "text/html") {
    addFailure(
      context.report,
      "error-page.content-type",
      `Intentional missing route returned ${mediaType(result.response.headers) || "no Content-Type"}; expected text/html.`,
      result.observationId,
    );
  }
  if (!result.body.includes("Page Not Found")) {
    addFailure(
      context.report,
      "error-page.custom-content",
      "Intentional missing route did not render the custom Page Not Found content.",
      result.observationId,
    );
  }
  const disclosurePatterns = [
    /\b(?:stack trace|traceback \(most recent call last\)|fatal error|uncaught exception)\b/iu,
    /\/(?:Users|home|var\/www)\/[\w./-]+/u,
    /\bApache\/\d+(?:\.\d+)+/iu,
  ];
  if (disclosurePatterns.some((pattern) => pattern.test(result.body))) {
    addFailure(
      context.report,
      "error-page.information-disclosure",
      "Custom 404 response appears to disclose an error trace, filesystem path, or server version.",
      result.observationId,
    );
  }
}

async function inspectDirectoryListing(context) {
  const result = await request(context, "/assets/", { label: "Directory-listing probe" });
  if (!result) return;
  const listing =
    result.response.status === 200 &&
    (/<title>\s*Index of \/assets\/?\s*<\/title>/iu.test(result.body) ||
      /<h1>\s*Index of \/assets\/?\s*<\/h1>/iu.test(result.body) ||
      /Directory listing for \/assets/iu.test(result.body));
  if (listing) {
    addFailure(
      context.report,
      "security.directory-listing",
      "/assets/ exposes a generated directory listing.",
      result.observationId,
    );
  } else if (![403, 404].includes(result.response.status)) {
    addWarning(
      context.report,
      "security.directory-listing-response",
      `/assets/ returned ${result.response.status} but did not match known directory-listing signatures.`,
      result.observationId,
    );
  }
}

function inspectSecurityAndCache(context, homepage) {
  const analysis = analyzeSecurityHeaders(
    homepage.response.headers,
    new URL(context.options.origin).protocol === "https:",
  );
  for (const failure of analysis.failures) {
    addFailure(context.report, "security.header", failure, homepage.observationId);
  }
  for (const warning of analysis.warnings) {
    addWarning(context.report, "security.header-observation", warning, homepage.observationId);
  }
  for (const issue of validateHtmlCache(homepage.response.headers)) {
    addFailure(context.report, "cache.html", issue, homepage.observationId);
  }
}

function escapeMarkdown(value) {
  return String(value).replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}

function renderMarkdown(report) {
  const status = report.failures.length === 0 ? "PASS" : "FAIL";
  const lines = [
    "# Production verification",
    "",
    `- Status: **${status}**`,
    `- Generated: ${report.generated_at}`,
    `- Origin: ${report.origin}`,
    `- Expected commit: ${report.expected_commit ?? "not supplied"}`,
    `- Failures: ${report.failures.length}`,
    `- Warnings: ${report.warnings.length}`,
    `- HTTP observations: ${report.observations.length}`,
    "",
    "## Failures",
    "",
  ];
  if (report.failures.length === 0) lines.push("None.");
  else {
    for (const failure of report.failures) {
      lines.push(
        `- \`${escapeMarkdown(failure.code)}\`${failure.observation_id ? ` (${failure.observation_id})` : ""}: ${escapeMarkdown(failure.message)}`,
      );
    }
  }
  lines.push("", "## Warnings", "");
  if (report.warnings.length === 0) lines.push("None.");
  else {
    for (const warning of report.warnings) {
      lines.push(
        `- \`${escapeMarkdown(warning.code)}\`${warning.observation_id ? ` (${warning.observation_id})` : ""}: ${escapeMarkdown(warning.message)}`,
      );
    }
  }
  lines.push(
    "",
    "## HTTP observations",
    "",
    "| ID | Label | Requested URL | Final URL | Status | MIME | Cache-Control | Cookies |",
    "| --- | --- | --- | --- | ---: | --- | --- | ---: |",
  );
  for (const observation of report.observations) {
    lines.push(
      `| ${observation.id} | ${escapeMarkdown(observation.label)} | ${escapeMarkdown(observation.requested_url)} | ${escapeMarkdown(observation.final_url ?? "request failed")} | ${observation.status ?? "-"} | ${escapeMarkdown(observation.response_headers?.["content-type"] ?? "-")} | ${escapeMarkdown(observation.response_headers?.["cache-control"] ?? "-")} | ${observation.set_cookie_count ?? 0} |`,
    );
  }
  lines.push("", "## Limitations", "");
  for (const limitation of report.limitations) lines.push(`- ${escapeMarkdown(limitation)}`);
  return `${lines.join("\n")}\n`;
}

async function writeEvidence(report, options) {
  report.summary = {
    failures: report.failures.length,
    warnings: report.warnings.length,
    observations: report.observations.length,
  };
  const jsonPath = path.resolve(options.jsonPath);
  const markdownPath = path.resolve(options.markdownPath);
  await mkdir(path.dirname(jsonPath), { recursive: true });
  await mkdir(path.dirname(markdownPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderMarkdown(report), "utf8");
  return { jsonPath, markdownPath };
}

export async function auditProduction(options, dependencies = {}) {
  const report = createReport(options);
  const context = { report, options, fetchImpl: dependencies.fetchImpl ?? globalThis.fetch };
  if (typeof context.fetchImpl !== "function")
    throw new Error("A Fetch-compatible implementation is required.");

  await inspectHttpRedirect(context);

  const routeResults = new Map();
  for (const route of ROUTES) {
    const result = await request(context, route.path, { label: `Required route ${route.path}` });
    if (!result) continue;
    inspectRouteResponse(context, route, result);
    routeResults.set(route.path, result);
    if (route.mediaTypes.includes("text/html")) inspectDocumentSafety(context, result);
  }

  const homepage = routeResults.get("/");
  if (homepage) {
    inspectHomepageMetadata(context, homepage);
    inspectSecurityAndCache(context, homepage);
    await inspectAssets(context, homepage);
  }
  const paper = routeResults.get(REPRESENTATIVE_PAPER_PATH);
  if (paper) inspectPaperMetadata(context, paper);

  await inspectBuildManifest(context);
  await inspectLegacyRedirects(context);
  await inspectCustom404(context);
  await inspectCitations(context);
  await inspectDirectoryListing(context);

  if (options.includeExternal) {
    addWarning(
      report,
      "external.delegated",
      "--include-external is retained for CLI compatibility; DOI and OASIS checks are performed by the separate bounded OASIS verifier.",
    );
  }

  report.summary = {
    failures: report.failures.length,
    warnings: report.warnings.length,
    observations: report.observations.length,
  };
  return report;
}

async function main() {
  let options;
  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
    return;
  }

  let report;
  try {
    report = await auditProduction(options);
  } catch (error) {
    report = createReport(options);
    addFailure(report, "verifier.internal-error", error instanceof Error ? error.message : String(error));
  }

  let evidence;
  try {
    evidence = await writeEvidence(report, options);
  } catch (error) {
    console.error(
      `ERROR: could not write production evidence: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
    return;
  }

  if (report.failures.length > 0) {
    console.error(
      `ERROR: production verification found ${report.failures.length} failure(s) and ${report.warnings.length} warning(s).`,
    );
    console.error(`Evidence: ${evidence.jsonPath}`);
    console.error(`Evidence: ${evidence.markdownPath}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `OK: ${report.observations.length} production responses verified with ${report.warnings.length} warning(s).`,
  );
  console.log(`Evidence: ${evidence.jsonPath}`);
  console.log(`Evidence: ${evidence.markdownPath}`);
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) await main();
