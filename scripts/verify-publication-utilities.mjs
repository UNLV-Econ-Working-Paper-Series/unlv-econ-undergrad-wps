import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testDirectories = ["publication", "release"];
const testFiles = testDirectories.flatMap((directoryName) => {
  const testDirectory = path.join(repositoryRoot, "tests", directoryName);
  return readdirSync(testDirectory)
    .filter((name) => /\.test\.(?:mjs|ts)$/u.test(name))
    .sort()
    .map((name) => path.join(testDirectory, name));
});

if (testFiles.length === 0) {
  console.error("ERROR: no publication or release tests were found.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
  cwd: repositoryRoot,
  stdio: "inherit",
});

if (result.error) {
  console.error(`ERROR: publication utility test runner failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`OK: ${testFiles.length} publication and release test files passed.`);
