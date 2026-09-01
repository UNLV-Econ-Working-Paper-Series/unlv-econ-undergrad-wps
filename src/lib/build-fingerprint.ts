import { execFileSync } from "node:child_process";

export type SourceTreeState = "clean" | "dirty" | "unknown";

export function readGitOutput(args: string[], cwd = process.cwd()): string | null {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export function detectSourceTree(cwd = process.cwd()): SourceTreeState {
  const status = readGitOutput(["status", "--porcelain"], cwd);
  if (status === null) return "unknown";
  return status === "" ? "clean" : "dirty";
}
