import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const origin = "http://127.0.0.1:4321";
const outputDirectory = new URL("../artifacts/lighthouse/", import.meta.url);

async function isReady() {
  try {
    return (await fetch(origin, { signal: AbortSignal.timeout(1_000) })).ok;
  } catch {
    return false;
  }
}

async function waitForPreview(preview, serving, stderr) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error(`Production preview exited before becoming ready.${stderr() ? `\n${stderr()}` : ""}`);
    }
    if (serving() && (await isReady())) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Production preview did not become ready within 30 seconds.");
}

if (await isReady()) {
  throw new Error(
    `${origin} is already in use. Stop the existing service so Lighthouse cannot audit an unrelated build.`,
  );
}

const preview = spawn(process.execPath, ["scripts/serve-dist.mjs", "--host", "127.0.0.1", "--port", "4321"], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});
let previewStderr = "";
let previewServing = false;
preview.stdout?.on("data", (chunk) => {
  if (chunk.toString().includes("Serving ")) previewServing = true;
});
preview.stderr?.on("data", (chunk) => {
  previewStderr += chunk.toString();
});
try {
  await waitForPreview(
    preview,
    () => previewServing,
    () => previewStderr.trim(),
  );
} catch (error) {
  if (preview.exitCode === null) preview.kill("SIGTERM");
  throw error;
}

await mkdir(outputDirectory, { recursive: true });
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
});

const audits = [
  { name: "home-desktop", path: "/", preset: "desktop", performanceMinimum: 0.9 },
  {
    name: "paper-desktop",
    path: "/papers/hedonics-used-car-attributes/",
    preset: "desktop",
    performanceMinimum: 0.9,
  },
  { name: "home-mobile", path: "/", preset: undefined, performanceMinimum: 0.75 },
];
const failures = [];
const summary = [];

try {
  for (const audit of audits) {
    const result = await lighthouse(`${origin}${audit.path}`, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      preset: audit.preset,
    });
    if (!result?.lhr) throw new Error(`Lighthouse returned no report for ${audit.name}.`);

    const categories = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([id, category]) => [id, category.score ?? 0]),
    );
    const cls = result.lhr.audits["cumulative-layout-shift"]?.numericValue ?? Number.POSITIVE_INFINITY;
    const observation = { name: audit.name, path: audit.path, categories, cls };
    summary.push(observation);
    await writeFile(
      new URL(`${audit.name}.json`, outputDirectory),
      `${JSON.stringify(result.lhr, null, 2)}\n`,
      "utf8",
    );

    if (categories.performance < audit.performanceMinimum) {
      failures.push(`${audit.name}: performance ${categories.performance} < ${audit.performanceMinimum}`);
    }
    if (categories.accessibility < 1)
      failures.push(`${audit.name}: accessibility ${categories.accessibility} < 1`);
    if (categories.seo < 0.95) failures.push(`${audit.name}: SEO ${categories.seo} < 0.95`);
    if (categories["best-practices"] < 0.95)
      failures.push(`${audit.name}: best practices ${categories["best-practices"]} < 0.95`);
    if (cls >= 0.1) failures.push(`${audit.name}: CLS ${cls} >= 0.1`);
  }
} finally {
  chrome.kill();
  preview.kill("SIGTERM");
}

await writeFile(
  new URL("summary.json", outputDirectory),
  `${JSON.stringify({ generated_at: new Date().toISOString(), audits: summary, failures }, null, 2)}\n`,
  "utf8",
);

if (failures.length > 0) {
  console.error(
    `ERROR: Lighthouse thresholds failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `OK: ${summary.length} Lighthouse audits met accessibility, SEO, best-practices, performance, and CLS thresholds.`,
);
