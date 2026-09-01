import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { unzipSync, zipSync } from "fflate";
import { assertCleanGitReleaseState } from "./lib/git-release-state.mjs";
import { parseAndValidateReleaseManifest } from "./lib/release-manifest.mjs";

const root = process.cwd();
const distRoot = path.resolve(root, "dist");
const artifactRoot = path.resolve(root, "artifacts");
const artifactPath = path.join(artifactRoot, "faculty-sites-dist.zip");
const checksumPath = `${artifactPath}.sha256`;
// ZIP stores local-time calendar fields. January 2 remains inside the format's
// 1980 lower bound in every supported release timezone.
const normalizedMtime = new Date(1980, 0, 2, 0, 0, 0, 0);
const packageMetadata = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

function comparePaths(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

const forbidden = [
  /(^|\/)\.(?:env|git)(?:\.|\/|$)/iu,
  /(^|\/)(?:node_modules|src|tests|scripts|docs|intake|private|runtime)(\/|$)/iu,
  /(^|\/)(?:package(?:-lock)?\.json|tsconfig\.json)$/iu,
  /\.(?:docx?|pem|key|p12|pfx|sqlite3?|db|zip)$/iu,
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => comparePaths(a.name, b.name))) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(distRoot, absolute).split(path.sep).join("/");
    if (entry.isSymbolicLink()) throw new Error(`Release artifact cannot contain symbolic link: ${relative}`);
    if (entry.isDirectory()) files.push(...(await collect(absolute)));
    if (entry.isFile()) files.push({ absolute, relative });
  }
  return files;
}

try {
  if (!(await stat(distRoot)).isDirectory()) throw new Error("dist is not a directory");
} catch {
  console.error("ERROR: dist is missing. Run the verified production build first.");
  process.exit(1);
}

const files = await collect(distRoot);
const violations = files.filter(({ relative }) => forbidden.some((pattern) => pattern.test(relative)));
if (violations.length > 0) {
  console.error(
    `ERROR: prohibited release files found:\n${violations.map(({ relative }) => `- ${relative}`).join("\n")}`,
  );
  process.exit(1);
}

const required = ["index.html", "404.html", "robots.txt", "sitemap.xml", "build-manifest.json"];
const fileNames = new Set(files.map(({ relative }) => relative));
for (const requiredFile of required) {
  if (!fileNames.has(requiredFile)) throw new Error(`Required release file is missing: ${requiredFile}`);
}

const payloads = new Map();
for (const file of files) payloads.set(file.relative, new Uint8Array(await readFile(file.absolute)));

const buildManifest = parseAndValidateReleaseManifest(payloads.get("build-manifest.json"), {
  expectedVersion: packageMetadata.version,
  expectedCommit: process.env.RELEASE_COMMIT_SHA?.trim() || undefined,
  requireCleanSource: true,
});
assertCleanGitReleaseState(root, {
  manifestCommit: buildManifest.commit,
  manifestSourceTree: buildManifest.source_tree,
  environmentCommit: process.env.RELEASE_COMMIT_SHA?.trim() || undefined,
  environmentSourceTree: process.env.RELEASE_SOURCE_TREE?.trim() || undefined,
});

const checksumManifest = `${[...payloads.entries()]
  .map(([relative, data]) => `${sha256(data)}  ${relative}`)
  .join("\n")}\n`;
payloads.set("SHA256SUMS.txt", new TextEncoder().encode(checksumManifest));

const zipEntries = {};
for (const [relative, data] of [...payloads.entries()].sort(([a], [b]) => comparePaths(a, b))) {
  zipEntries[relative] = [data, { mtime: normalizedMtime }];
}

const archive = zipSync(zipEntries, { level: 9 });
await mkdir(artifactRoot, { recursive: true });
await writeFile(artifactPath, archive);
await writeFile(checksumPath, `${sha256(archive)}  ${path.basename(artifactPath)}\n`, "utf8");

const extracted = unzipSync(archive);
const extractedNames = Object.keys(extracted).sort(comparePaths);
const expectedNames = [...payloads.keys()].sort(comparePaths);
if (JSON.stringify(extractedNames) !== JSON.stringify(expectedNames)) {
  throw new Error("ZIP verification failed: extracted file inventory differs from the intended inventory.");
}
for (const [relative, intended] of payloads) {
  if (sha256(extracted[relative]) !== sha256(intended)) {
    throw new Error(`ZIP verification failed: checksum mismatch for ${relative}`);
  }
}

console.log(
  `OK: wrote and verified ${path.relative(root, artifactPath)} with ${payloads.size} files for commit ${buildManifest.commit}.`,
);
console.log(`SHA-256: ${sha256(archive)}`);
