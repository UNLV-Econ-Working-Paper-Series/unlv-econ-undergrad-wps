import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { zipSync } from "fflate";

import { inspectGitReleaseState } from "../../scripts/lib/git-release-state.mjs";
import {
  parseAndValidateReleaseManifest,
  validateReleaseManifest,
} from "../../scripts/lib/release-manifest.mjs";

const execute = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const packageMetadata = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
const validCommit = "0123456789abcdef0123456789abcdef01234567";

function manifest(overrides = {}) {
  return {
    schema_version: 1,
    site: "https://econ-undergrad-wps.sites.unlv.edu/",
    source_repository: "https://github.com/UNLV-Econ-Working-Paper-Series/unlv-econ-undergrad-wps",
    release_version: packageMetadata.version,
    commit: validCommit,
    source_tree: "clean",
    built_at: "2026-08-31T12:34:56.000Z",
    ...overrides,
  };
}

function validationOptions() {
  return {
    expectedVersion: packageMetadata.version,
    expectedCommit: validCommit,
    requireCleanSource: true,
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeArtifact(directory, buildManifest) {
  const encoder = new TextEncoder();
  const payloads = {
    "build-manifest.json": encoder.encode(`${JSON.stringify(buildManifest, null, 2)}\n`),
    "index.html": encoder.encode("<!doctype html><title>Fixture</title>"),
  };
  const checksums = Object.entries(payloads)
    .map(([name, value]) => `${sha256(value)}  ${name}`)
    .join("\n");
  const archive = zipSync({
    ...payloads,
    "SHA256SUMS.txt": encoder.encode(`${checksums}\n`),
  });
  const artifactPath = path.join(directory, "fixture.zip");
  await writeFile(artifactPath, archive);
  return artifactPath;
}

test("release manifest validator accepts the exact schema and expected fingerprint", () => {
  assert.deepEqual(validateReleaseManifest(manifest(), validationOptions()), []);
  assert.equal(
    parseAndValidateReleaseManifest(JSON.stringify(manifest()), validationOptions()).commit,
    validCommit,
  );
});

test("release manifest validator rejects placeholder versions, commits, and source trees", () => {
  const cases = [
    [manifest({ release_version: "unversioned" }), /must not be unversioned/u],
    [manifest({ commit: "unknown" }), /non-placeholder lowercase 40-character/u],
    [manifest({ commit: "0".repeat(40) }), /non-placeholder lowercase 40-character/u],
    [manifest({ commit: "A".repeat(40) }), /non-placeholder lowercase 40-character/u],
    [manifest({ source_tree: "dirty" }), /source_tree must equal "clean"/u],
    [manifest({ source_tree: "unknown" }), /source_tree must equal "clean"/u],
  ];

  for (const [candidate, expectedMessage] of cases) {
    assert.throws(
      () => parseAndValidateReleaseManifest(JSON.stringify(candidate), validationOptions()),
      expectedMessage,
    );
  }
});

test("Git release-state inspection includes untracked files and rejects forged clean claims", async (t) => {
  const temporaryRepository = await mkdtemp(path.join(os.tmpdir(), "unlv-release-git-state-"));
  t.after(() => rm(temporaryRepository, { recursive: true, force: true }));
  await execute("git", ["init", "--quiet"], { cwd: temporaryRepository });
  await writeFile(path.join(temporaryRepository, "tracked.txt"), "tracked\n", "utf8");
  await execute("git", ["add", "tracked.txt"], { cwd: temporaryRepository });
  await execute(
    "git",
    [
      "-c",
      "user.name=Release Test",
      "-c",
      "user.email=release-test@example.invalid",
      "commit",
      "--quiet",
      "-m",
      "fixture",
    ],
    { cwd: temporaryRepository },
  );

  const clean = inspectGitReleaseState(temporaryRepository);
  assert.equal(clean.sourceTree, "clean");
  assert.match(clean.commit, /^[a-f0-9]{40}$/u);
  assert.deepEqual(clean.issues, []);

  await writeFile(path.join(temporaryRepository, "untracked.txt"), "untracked\n", "utf8");
  const dirty = inspectGitReleaseState(temporaryRepository, {
    manifestCommit: clean.commit,
    manifestSourceTree: "clean",
    environmentCommit: clean.commit,
    environmentSourceTree: "clean",
  });
  assert.equal(dirty.sourceTree, "dirty");
  assert.ok(dirty.changedEntryCount >= 1);
  assert.ok(dirty.issues.some((issue) => issue.includes("release source is dirty")));
  assert.ok(dirty.issues.some((issue) => issue.includes("manifest source_tree")));
  assert.ok(dirty.issues.some((issue) => issue.includes("RELEASE_SOURCE_TREE")));
});

test("release artifact verifier enforces the shared fingerprint gate", async (t) => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "unlv-release-manifest-"));
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const validArtifact = await writeArtifact(temporaryDirectory, manifest());
  const validResult = await execute(
    process.execPath,
    ["scripts/verify-release-artifact.mjs", validArtifact],
    {
      cwd: repositoryRoot,
      env: { ...process.env, RELEASE_COMMIT_SHA: validCommit },
    },
  );
  assert.match(validResult.stdout, new RegExp(`verified 3 archive entries for commit ${validCommit}`, "u"));

  for (const [name, candidate, expectedMessage] of [
    ["unversioned", manifest({ release_version: "unversioned" }), "must not be unversioned"],
    ["unknown-commit", manifest({ commit: "unknown" }), "non-placeholder lowercase 40-character"],
    ["dirty-source", manifest({ source_tree: "dirty" }), 'source_tree must equal "clean"'],
  ]) {
    const caseDirectory = path.join(temporaryDirectory, name);
    await mkdir(caseDirectory);
    const artifactPath = await writeArtifact(caseDirectory, candidate);
    await assert.rejects(
      execute(process.execPath, ["scripts/verify-release-artifact.mjs", artifactPath], {
        cwd: repositoryRoot,
        env: { ...process.env, RELEASE_COMMIT_SHA: validCommit },
      }),
      (error) => {
        assert.match(`${error.stderr ?? ""}${error.stdout ?? ""}`, new RegExp(expectedMessage, "u"));
        return true;
      },
    );
  }
});
