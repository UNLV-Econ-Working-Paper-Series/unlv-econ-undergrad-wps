import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  classifyHttpStatus,
  determineExitCode,
  probeExternalUrl,
  runExternalLinkAudit,
  scanExternalLinks,
} from "../../scripts/verify-external-links.mjs";

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "unlv-external-links-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("scans unique external href/src URLs while excluding the canonical origin", async (t) => {
  const root = await temporaryDirectory(t);
  const distDirectory = path.join(root, "dist");
  await mkdir(path.join(distDirectory, "papers"), { recursive: true });
  await writeFile(
    path.join(distDirectory, "index.html"),
    `
    <a href="/papers/">Local</a>
    <a href="https://outside.example/item?a=1&amp;b=2#summary">External</a>
    <script src="https://assets.example/site.js"></script>
    <script>const example = '<a href="https://not-markup.example/">not markup</a>';</script>
  `,
  );
  await writeFile(
    path.join(distDirectory, "papers/index.html"),
    `
    <a href="https://outside.example/item?a=1&amp;b=2#other">Duplicate</a>
    <img src="//images.example/cover.webp" alt="">
  `,
  );

  const result = await scanExternalLinks({
    distDirectory,
    canonicalOrigin: "https://canonical.example",
  });

  assert.deepEqual(result.htmlFiles, ["index.html", "papers/index.html"]);
  assert.deepEqual(
    result.links.map((link) => link.requested_url),
    [
      "https://assets.example/site.js",
      "https://images.example/cover.webp",
      "https://outside.example/item?a=1&b=2",
    ],
  );
  assert.deepEqual(result.links.at(-1).sources, [
    { file: "index.html", attribute: "href" },
    { file: "papers/index.html", attribute: "href" },
  ]);
});

test("writes exact bounded probe evidence and applies gate exit-code precedence", async (t) => {
  const root = await temporaryDirectory(t);
  const distDirectory = path.join(root, "dist");
  const outputDirectory = path.join(root, "artifacts");
  await mkdir(distDirectory, { recursive: true });
  await writeFile(
    path.join(distDirectory, "index.html"),
    `
    <a href="https://links.example/ok">OK</a>
    <a href="https://links.example/restricted">Restricted</a>
    <a href="https://links.example/missing">Missing</a>
    <a href="https://links.example/remote">Remote failure</a>
    <a href="https://links.example/network">Network failure</a>
    <a href="https://links.example/retry">Retry succeeds</a>
  `,
  );

  const calls = new Map();
  let cancelledBodies = 0;
  const fetchImpl = async (url, options) => {
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "follow");
    assert.equal(options.headers.Range, "bytes=0-0");
    calls.set(url, (calls.get(url) ?? 0) + 1);
    const attempt = calls.get(url);
    if (url.endsWith("/network")) throw new TypeError("DNS unavailable");

    let status = 200;
    if (url.endsWith("/restricted")) status = 403;
    if (url.endsWith("/missing")) status = 404;
    if (url.endsWith("/remote")) status = 503;
    if (url.endsWith("/retry") && attempt === 1) status = 503;
    return {
      status,
      url: url.endsWith("/ok") ? "https://final.example/ok" : url,
      headers: new Headers({ "Content-Type": status === 200 ? "text/html; charset=utf-8" : "text/plain" }),
      body: {
        cancel: async () => {
          cancelledBodies += 1;
        },
      },
    };
  };

  const result = await runExternalLinkAudit(
    {
      distDirectory,
      canonicalOrigin: "https://canonical.example",
      outputDirectory,
      timeoutMs: 500,
      maxAttempts: 2,
      concurrency: 2,
    },
    {
      fetchImpl,
      waitImpl: async () => undefined,
      now: () => new Date("2026-08-31T12:00:00.000Z"),
    },
  );

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.output.summary, {
    html_files: 1,
    unique_external_urls: 6,
    verified: 2,
    "access-restricted": 1,
    broken: 1,
    "remote-failure": 1,
    "network-failure": 1,
    exit_code: 1,
  });
  assert.equal(calls.get("https://links.example/missing"), 1);
  assert.equal(calls.get("https://links.example/restricted"), 1);
  assert.equal(calls.get("https://links.example/remote"), 2);
  assert.equal(calls.get("https://links.example/network"), 2);
  assert.equal(calls.get("https://links.example/retry"), 2);
  assert.equal(cancelledBodies, 7);

  const ok = result.output.records.find((record) => record.requested_url.endsWith("/ok"));
  assert.equal(ok.final_url, "https://final.example/ok");
  assert.equal(ok.status, 200);
  assert.equal(ok.content_type, "text/html; charset=utf-8");
  assert.equal(ok.outcome, "verified");
  const persisted = JSON.parse(await readFile(result.jsonPath, "utf8"));
  assert.deepEqual(persisted, result.output);
  const markdown = await readFile(result.markdownPath, "utf8");
  assert.match(markdown, /\| broken \| https:\/\/links\.example\/missing \|/u);
  assert.match(markdown, /\| access-restricted \| https:\/\/links\.example\/restricted \|/u);
  assert.match(markdown, /\| network-failure \| https:\/\/links\.example\/network \|/u);
});

test("access restrictions warn without failing while unresolved failures use exit code 2", () => {
  assert.equal(classifyHttpStatus(401), "access-restricted");
  assert.equal(classifyHttpStatus(403), "access-restricted");
  assert.equal(classifyHttpStatus(999), "access-restricted");
  assert.equal(determineExitCode([{ outcome: "access-restricted" }]), 0);
  assert.equal(determineExitCode([{ outcome: "remote-failure" }]), 2);
  assert.equal(determineExitCode([{ outcome: "network-failure" }]), 2);
  assert.equal(determineExitCode([{ outcome: "network-failure" }, { outcome: "broken" }]), 1);
});

test("aborts and retries stalled requests within the configured per-attempt timeout", async () => {
  let calls = 0;
  const result = await probeExternalUrl("https://links.example/stalled", {
    timeoutMs: 5,
    maxAttempts: 2,
    waitImpl: async () => undefined,
    fetchImpl: async (_url, options) => {
      calls += 1;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener(
          "abort",
          () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          },
          { once: true },
        );
      });
    },
  });

  assert.equal(calls, 2);
  assert.equal(result.outcome, "network-failure");
  assert.equal(result.attempts, 2);
  assert.equal(result.error, "Timed out after 5 ms");
});
