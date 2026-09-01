import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  auditProduction,
  analyzeLegacyResponse,
  analyzeSecurityHeaders,
  inspectHtmlSafety,
  parseAttributes,
  parseCliOptions,
  validateBuildManifest,
} from "../../scripts/verify-production.mjs";

const canonicalOrigin = "https://econ-undergrad-wps.sites.unlv.edu";
const packageMetadata = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));

test("CLI parsing validates bounded network options and full commit SHAs", () => {
  const options = parseCliOptions([
    "--expected-commit",
    "0123456789abcdef0123456789abcdef01234567",
    "--attempts",
    "2",
    "--timeout-ms",
    "8000",
  ]);
  assert.equal(options.origin, canonicalOrigin);
  assert.equal(options.attempts, 2);
  assert.equal(options.timeoutMs, 8000);
  assert.throws(() => parseCliOptions(["--attempts", "0"]), /integer from 1 through 5/u);
  assert.throws(() => parseCliOptions(["--expected-commit", "short"]), /40-character/u);
  assert.throws(() => parseCliOptions(["--unknown", "value"]), /Unknown option/u);
  assert.throws(
    () => parseCliOptions(["--json", "same-file", "--markdown", "same-file"]),
    /different output files/u,
  );
});

test("attribute parser decodes common HTML entities", () => {
  assert.deepEqual(parseAttributes(' rel="canonical" href="/a?x=1&amp;y=2" disabled'), {
    rel: "canonical",
    href: "/a?x=1&y=2",
    disabled: "",
  });
});

test("build manifest validation enforces identity, clean source, and exact commit", () => {
  const expectedCommit = "0123456789abcdef0123456789abcdef01234567";
  const valid = {
    schema_version: 1,
    site: `${canonicalOrigin}/`,
    source_repository: "https://github.com/UNLV-Econ-Working-Paper-Series/unlv-econ-undergrad-wps",
    release_version: packageMetadata.version,
    commit: expectedCommit,
    source_tree: "clean",
    built_at: "2026-08-31T12:34:56.000Z",
  };
  assert.deepEqual(validateBuildManifest(valid, { expectedCommit }), []);

  const issues = validateBuildManifest(
    { ...valid, commit: "unknown", source_tree: "dirty", release_version: "unversioned" },
    { expectedCommit },
  );
  assert.ok(issues.some((issue) => issue.includes("lowercase 40-character")));
  assert.ok(issues.some((issue) => issue.includes('source_tree must equal "clean"')));
  assert.ok(issues.some((issue) => issue.includes("must not be unversioned")));
});

test("security header analysis detects duplicate nosniff and invalid CSP token", () => {
  const unsafe = analyzeSecurityHeaders({
    "strict-transport-security": "max-age=31536000",
    "content-security-policy": "default-src 'self'; SAMEORIGIN",
    "x-content-type-options": "nosniff, nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=()",
    "x-frame-options": "SAMEORIGIN",
  });
  assert.ok(unsafe.failures.some((failure) => failure.includes("invalid X-Frame-Options token")));
  assert.ok(unsafe.failures.some((failure) => failure.includes("exactly nosniff")));

  const safe = analyzeSecurityHeaders({
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "content-security-policy": "default-src 'self'; frame-ancestors 'self'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=()",
  });
  assert.deepEqual(safe.failures, []);
});

test("static legacy redirects require refresh, noindex, and target canonical", () => {
  const requestedUrl = `${canonicalOrigin}/graduate-assistants/`;
  const targetUrl = `${canonicalOrigin}/editorial-board/#junior-editors`;
  const body = `<!doctype html><head>
    <meta http-equiv="refresh" content="0;url=/editorial-board/#junior-editors">
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${targetUrl}">
  </head>`;
  assert.deepEqual(analyzeLegacyResponse({ status: 200, location: null, body, requestedUrl, targetUrl }), []);
  assert.ok(
    analyzeLegacyResponse({ status: 200, location: null, body: "<html></html>", requestedUrl, targetUrl })
      .length >= 3,
  );
});

test("HTML safety identifies remote executable scripts and mixed content", () => {
  const result = inspectHtmlSafety(
    '<script src="https://cdn.example/script.js"></script><img src="http://example.test/image.png">',
    `${canonicalOrigin}/`,
    canonicalOrigin,
  );
  assert.deepEqual(result.remoteScripts, ["https://cdn.example/script.js"]);
  assert.deepEqual(result.mixedContent, ["http://example.test/image.png"]);
});

test("production audit accepts a complete deterministic HTTP fixture", async () => {
  const expectedCommit = "0123456789abcdef0123456789abcdef01234567";
  const securityHeaders = {
    "cache-control": "no-cache",
    "content-security-policy": "default-src 'self'; frame-ancestors 'self'",
    "permissions-policy": "camera=(), microphone=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
  };
  const socialMetadata = `
    <meta property="og:title" content="A title">
    <meta property="og:description" content="A description">
    <meta property="og:image" content="${canonicalOrigin}/assets/brand/og-image.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="A title">
    <meta name="twitter:description" content="A description">
    <meta name="twitter:image" content="${canonicalOrigin}/assets/brand/og-image.png">`;
  const homepage = `<!doctype html><html><head>
    <link rel="canonical" href="${canonicalOrigin}/">
    <link rel="stylesheet" href="/_astro/BaseLayout.BtihzBYH.css">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalOrigin}/">
    ${socialMetadata}
  </head><body>Working Paper Series<script src="/_astro/SiteHeader.CiKyRR-1.js"></script></body></html>`;
  const paperPath = "/papers/hedonics-used-car-attributes/";
  const paperTitle = "Hedonics of Used Car Attributes on Market Price";
  const paperUrl = `${canonicalOrigin}${paperPath}`;
  const paper = `<!doctype html><html><head>
    <link rel="canonical" href="${paperUrl}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${paperUrl}">
    ${socialMetadata}
    <meta name="citation_title" content="${paperTitle}">
    <meta name="citation_author" content="Alexander Bent">
    <meta name="citation_publication_date" content="2026/05/21">
    <meta name="citation_doi" content="10.34917/40601193">
    <meta name="citation_abstract_html_url" content="${paperUrl}">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      headline: paperTitle,
      url: paperUrl,
    })}</script>
  </head><body>${paperTitle}</body></html>`;
  const manifest = JSON.stringify({
    schema_version: 1,
    site: `${canonicalOrigin}/`,
    source_repository: "https://github.com/UNLV-Econ-Working-Paper-Series/unlv-econ-undergrad-wps",
    release_version: packageMetadata.version,
    commit: expectedCommit,
    source_tree: "clean",
    built_at: "2026-08-31T12:34:56.000Z",
  });

  const fixture = new Map([
    ["/", { body: homepage, headers: { ...securityHeaders, "content-type": "text/html" } }],
    ["/papers/", { body: "Working Papers", headers: { "content-type": "text/html" } }],
    [paperPath, { body: paper, headers: { "content-type": "text/html" } }],
    ["/issues/2025-fall/", { body: "Fall 2025", headers: { "content-type": "text/html" } }],
    [
      "/fields/applied-microeconomics/",
      { body: "Applied Microeconomics", headers: { "content-type": "text/html" } },
    ],
    ["/contact/", { body: "Contact", headers: { "content-type": "text/html" } }],
    ["/sitemap.xml", { body: "<urlset></urlset>", headers: { "content-type": "application/xml" } }],
    ["/robots.txt", { body: "Sitemap:", headers: { "content-type": "text/plain" } }],
    [
      "/_astro/BaseLayout.BtihzBYH.css",
      {
        body: "body { color: black; }",
        headers: { "cache-control": "public, max-age=31536000, immutable", "content-type": "text/css" },
      },
    ],
    [
      "/_astro/SiteHeader.CiKyRR-1.js",
      {
        body: "console.log('fixture');",
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": "application/javascript",
        },
      },
    ],
    [
      "/build-manifest.json",
      { body: manifest, headers: { "cache-control": "no-cache", "content-type": "application/json" } },
    ],
    [
      `${paperPath}citation.bib`,
      {
        body: "@techreport{fixture, doi = {10.34917/40601193}}",
        headers: {
          "content-disposition": 'attachment; filename="citation.bib"',
          "content-type": "application/x-bibtex",
          "x-content-type-options": "nosniff",
        },
      },
    ],
    [
      `${paperPath}citation.ris`,
      {
        body: "TY  - RPRT\nDO  - 10.34917/40601193\nER  -",
        headers: {
          "content-disposition": 'attachment; filename="citation.ris"',
          "content-type": "application/x-research-info-systems",
          "x-content-type-options": "nosniff",
        },
      },
    ],
    [
      "/release-verifier-intentional-missing-route/",
      { body: "<h1>Page Not Found</h1>", headers: { "content-type": "text/html" }, status: 404 },
    ],
    ["/assets/", { body: "<h1>Page Not Found</h1>", headers: { "content-type": "text/html" }, status: 404 }],
  ]);
  const legacy = new Map([
    ["/categories/", "/fields/"],
    ["/our/", "/for-authors/"],
    ["/graduate-assistants/", "/editorial-board/#junior-editors"],
  ]);

  const fetchImpl = async (input) => {
    const url = new URL(input);
    let definition;
    if (url.protocol === "http:") {
      definition = { body: "", headers: { location: `${canonicalOrigin}/` }, status: 301 };
    } else if (legacy.has(url.pathname)) {
      definition = {
        body: "",
        headers: { location: new URL(legacy.get(url.pathname), canonicalOrigin).toString() },
        status: 301,
      };
    } else {
      definition = fixture.get(url.pathname);
    }
    assert.ok(definition, `Unexpected fixture request: ${url}`);
    const response = new Response(definition.body, {
      headers: definition.headers,
      status: definition.status ?? 200,
    });
    Object.defineProperty(response, "url", { value: url.toString() });
    Object.defineProperty(response, "redirected", { value: false });
    return response;
  };

  const report = await auditProduction(
    {
      origin: canonicalOrigin,
      expectedCommit,
      jsonPath: "unused.json",
      markdownPath: "unused.md",
      timeoutMs: 1000,
      attempts: 1,
      includeExternal: false,
    },
    { fetchImpl },
  );
  assert.deepEqual(report.failures, []);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.observations.length, 19);
});
