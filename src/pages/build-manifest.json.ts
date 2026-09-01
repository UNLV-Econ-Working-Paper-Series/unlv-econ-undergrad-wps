import packageMetadata from "../../package.json";
import { SERIES } from "../config/publication";
import { detectSourceTree, readGitOutput } from "../lib/build-fingerprint";

export const prerender = true;

export function GET(): Response {
  const observedCommit = readGitOutput(["rev-parse", "HEAD"]) || "unknown";
  const observedSourceTree = detectSourceTree();
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
