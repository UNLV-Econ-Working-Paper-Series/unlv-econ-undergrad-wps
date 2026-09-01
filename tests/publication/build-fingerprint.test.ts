import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { detectSourceTree, readGitOutput } from "../../src/lib/build-fingerprint";

test("build fingerprint distinguishes clean, dirty, and unavailable Git state", async (t) => {
  const repository = await mkdtemp(path.join(os.tmpdir(), "unlv-build-fingerprint-"));
  t.after(() => rm(repository, { recursive: true, force: true }));

  const git = (args: string[]) =>
    execFileSync("git", args, {
      cwd: repository,
      stdio: ["ignore", "pipe", "pipe"],
    });

  git(["init", "--quiet"]);
  git(["config", "user.email", "release-test@example.invalid"]);
  git(["config", "user.name", "Release Test"]);
  await writeFile(path.join(repository, "README.md"), "fixture\n", "utf8");
  git(["add", "README.md"]);
  git(["commit", "--quiet", "-m", "fixture"]);

  assert.equal(readGitOutput(["status", "--porcelain"], repository), "");
  assert.equal(detectSourceTree(repository), "clean");
  assert.match(readGitOutput(["rev-parse", "HEAD"], repository) ?? "", /^[a-f0-9]{40}$/u);

  await writeFile(path.join(repository, "untracked.txt"), "dirty\n", "utf8");
  assert.equal(detectSourceTree(repository), "dirty");

  assert.equal(detectSourceTree(path.join(repository, "missing")), "unknown");
});
