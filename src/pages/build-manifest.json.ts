import { execFileSync } from "node:child_process";
import packageMetadata from "../../package.json";
import { SERIES } from "../config/publication";

export const prerender = true;

function gitValue(args: string[], fallback: string): string {
  try {
    return (
      execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback
    );
  } catch {
    return fallback;
  }
}

function detectedSourceTree(): "clean" | "dirty" | "unknown" {
  const status = gitValue(["status", "--porcelain"], "unknown");
  if (status === "") return "clean";
  return status === "unknown" ? "unknown" : "dirty";
}

export function GET(): Response {
  const observedCommit = gitValue(["rev-parse", "HEAD"], "unknown");
  const observedSourceTree = detectedSourceTree();
  const declaredCommit = process.env.RELEASE_COMMIT_SHA?.trim();
  const declaredSourceTree = process.env.RELEASE_SOURCE_TREE?.trim();
  if (declaredCommit && declaredCommit !== observedCommit) {
    throw new Error(`RELEASE_COMMIT_SHA does not match observed Git HEAD ${observedCommit}.`);
  }
  if (declaredSourceTree && declaredSourceTree !== observedSourceTree) {
    throw new Error(`RELEASE_SOURCE_TREE does not match observed Git state ${observedSourceTree}.`);
  }
  const commit = declaredCommit || observedCommit;
  const sourceTree = declaredSourceTree || observedSourceTree;
  const builtAt = process.env.RELEASE_BUILT_AT?.trim() || new Date().toISOString();

  return new Response(
    `${JSON.stringify(
      {
        schema_version: 1,
        site: SERIES.siteUrl,
        source_repository: "https://github.com/UNLV-Econ-Working-Paper-Series/unlv-econ-undergrad-wps",
        release_version: packageMetadata.version,
        commit,
        source_tree: sourceTree,
        built_at: builtAt,
      },
      null,
      2,
    )}\n`,
    {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
