import { execFileSync } from "node:child_process";

function gitValue(root, args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function inspectGitReleaseState(
  root,
  { manifestCommit, manifestSourceTree, environmentCommit, environmentSourceTree } = {},
) {
  const issues = [];
  let commit = null;
  let sourceTree = "unknown";
  let changedEntryCount = null;

  try {
    commit = gitValue(root, ["rev-parse", "HEAD"]).trim();
    const status = gitValue(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
    const changedEntries = status.split("\0").filter(Boolean);
    changedEntryCount = changedEntries.length;
    sourceTree = changedEntries.length === 0 ? "clean" : "dirty";
  } catch (error) {
    issues.push(
      `unable to inspect Git release state: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (commit && (!/^[a-f0-9]{40}$/u.test(commit) || /^0{40}$/u.test(commit))) {
    issues.push(`observed Git HEAD is not a valid release commit: ${JSON.stringify(commit)}`);
  }
  if (sourceTree !== "clean") {
    issues.push(
      sourceTree === "dirty"
        ? `release source is dirty (${changedEntryCount} tracked or untracked status entries)`
        : "release source cleanliness could not be established",
    );
  }
  if (manifestCommit && commit && manifestCommit !== commit) {
    issues.push(`manifest commit ${manifestCommit} does not match observed Git HEAD ${commit}`);
  }
  if (manifestSourceTree && manifestSourceTree !== sourceTree) {
    issues.push(
      `manifest source_tree ${JSON.stringify(manifestSourceTree)} does not match observed ${sourceTree}`,
    );
  }
  if (environmentCommit && commit && environmentCommit !== commit) {
    issues.push(`RELEASE_COMMIT_SHA ${environmentCommit} does not match observed Git HEAD ${commit}`);
  }
  if (environmentSourceTree && environmentSourceTree !== sourceTree) {
    issues.push(
      `RELEASE_SOURCE_TREE ${JSON.stringify(environmentSourceTree)} does not match observed ${sourceTree}`,
    );
  }

  return { commit, sourceTree, changedEntryCount, issues };
}

export function assertCleanGitReleaseState(root, claims = {}) {
  const state = inspectGitReleaseState(root, claims);
  if (state.issues.length > 0) {
    throw new Error(
      `Git release-state validation failed:\n${state.issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
  }
  return state;
}
