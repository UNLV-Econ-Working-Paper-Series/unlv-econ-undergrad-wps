import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { unzipSync } from "fflate";
import { parseAndValidateReleaseManifest } from "./lib/release-manifest.mjs";

const artifactPath = path.resolve(process.cwd(), process.argv[2] || "artifacts/faculty-sites-dist.zip");
const packageMetadata = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

let archive;
try {
  archive = new Uint8Array(await readFile(artifactPath));
} catch {
  console.error(`ERROR: release artifact not found: ${artifactPath}`);
  process.exit(1);
}

const files = unzipSync(archive);
const names = Object.keys(files);
for (const name of names) {
  const normalized = name.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`Release artifact contains an unsafe path: ${JSON.stringify(name)}`);
  }
}
if (
  !names.includes("index.html") ||
  !names.includes("build-manifest.json") ||
  !names.includes("SHA256SUMS.txt")
) {
  throw new Error("Release artifact is missing required root files or has an unexpected folder wrapper.");
}
if (names.some((name) => name.startsWith("dist/")))
  throw new Error("Release artifact incorrectly contains a dist folder wrapper.");

const manifest = new TextDecoder().decode(files["SHA256SUMS.txt"]);
const expected = new Map(
  manifest
    .trim()
    .split("\n")
    .map((line) => {
      const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/u);
      if (!match) throw new Error(`Malformed checksum manifest line: ${JSON.stringify(line)}`);
      return [match[2], match[1]];
    }),
);

const payloadNames = names.filter((name) => name !== "SHA256SUMS.txt").sort((a, b) => a.localeCompare(b));
if (
  JSON.stringify(payloadNames) !== JSON.stringify([...expected.keys()].sort((a, b) => a.localeCompare(b)))
) {
  throw new Error("Release artifact file inventory differs from SHA256SUMS.txt.");
}
for (const [name, checksum] of expected) {
  if (sha256(files[name]) !== checksum) throw new Error(`Checksum mismatch: ${name}`);
}

const buildManifest = parseAndValidateReleaseManifest(files["build-manifest.json"], {
  expectedVersion: packageMetadata.version,
  expectedCommit: process.env.RELEASE_COMMIT_SHA?.trim() || undefined,
  requireCleanSource: true,
});

console.log(`OK: verified ${names.length} archive entries for commit ${buildManifest.commit}.`);
console.log(`Artifact SHA-256: ${sha256(archive)}`);
