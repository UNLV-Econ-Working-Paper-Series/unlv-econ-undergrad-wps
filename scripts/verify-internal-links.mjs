import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), "dist");
const canonicalOrigin = "https://econ-undergrad-wps.sites.unlv.edu";

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Symbolic link is not allowed in dist: ${path.relative(root, absolute)}`);
    if (entry.isDirectory()) files.push(...(await filesBelow(absolute)));
    if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function htmlIds(html) {
  return new Set([...html.matchAll(/\s(?:id|name)=["']([^"']+)["']/giu)].map((match) => match[1]));
}

function references(html) {
  const values = [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/giu)].map((match) => match[1]);
  for (const match of html.matchAll(/\ssrcset=["']([^"']+)["']/giu)) {
    values.push(
      ...match[1]
        .split(",")
        .map((candidate) => candidate.trim().split(/\s+/u)[0])
        .filter(Boolean),
    );
  }
  return values;
}

function candidatePaths(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return [];
  }
  const relative = decoded.replace(/^\/+/, "");
  if (!relative || decoded.endsWith("/")) return [path.join(root, relative, "index.html")];
  if (path.extname(relative)) return [path.join(root, relative)];
  return [path.join(root, relative), path.join(root, relative, "index.html")];
}

function insideRoot(candidate) {
  const relative = path.relative(root, candidate);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function resolveReference(sourceFile, rawReference) {
  if (!rawReference || /^(?:mailto:|tel:|data:|blob:|javascript:)/iu.test(rawReference)) return null;

  let parsed;
  try {
    parsed = new URL(
      rawReference,
      `${canonicalOrigin}/${path.relative(root, sourceFile).replaceAll(path.sep, "/")}`,
    );
  } catch {
    return { problem: `invalid URL ${JSON.stringify(rawReference)}` };
  }

  if (parsed.protocol === "http:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    return { problem: `mixed-content URL ${parsed.toString()}` };
  }
  if (parsed.origin !== canonicalOrigin) return null;

  const candidates = candidatePaths(parsed.pathname).filter(insideRoot);
  let target = null;
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) {
        target = candidate;
        break;
      }
    } catch {
      // Continue through the deterministic candidate list.
    }
  }
  if (!target) return { problem: `missing target ${parsed.pathname}` };

  if (parsed.hash && target.endsWith(".html")) {
    const fragment = decodeURIComponent(parsed.hash.slice(1));
    const targetHtml = await readFile(target, "utf8");
    if (!htmlIds(targetHtml).has(fragment)) {
      return { problem: `missing fragment #${fragment} in ${parsed.pathname}` };
    }
  }
  return null;
}

let distStat;
try {
  distStat = await stat(root);
} catch {
  console.error("ERROR: dist does not exist; run the production build first.");
  process.exit(1);
}
if (!distStat.isDirectory()) throw new Error("dist is not a directory.");

const files = await filesBelow(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const failures = [];
let checkedReferences = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const reference of references(html)) {
    checkedReferences += 1;
    const result = await resolveReference(file, reference);
    if (result) failures.push(`${path.relative(root, file)}: ${result.problem}`);
  }
}

if (failures.length > 0) {
  console.error(
    `ERROR: internal-link verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `OK: verified ${checkedReferences} built href/src references across ${htmlFiles.length} HTML files.`,
);
