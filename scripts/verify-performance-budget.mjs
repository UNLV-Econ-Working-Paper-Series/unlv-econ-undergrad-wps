import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const distRoot = path.resolve(process.cwd(), "dist");

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(absolute)));
    if (entry.isFile()) files.push(absolute);
  }
  return files;
}

try {
  if (!(await stat(distRoot)).isDirectory()) throw new Error();
} catch {
  console.error("ERROR: dist is missing; run the production build first.");
  process.exit(1);
}

const files = await collect(distRoot);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const cssFiles = files.filter((file) => file.endsWith(".css"));
const jsFiles = files.filter((file) => file.endsWith(".js"));
const imageFiles = files.filter((file) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu.test(file));
const zipFiles = files.filter((file) => file.endsWith(".zip"));

const sizes = new Map(await Promise.all(files.map(async (file) => [file, (await stat(file)).size])));
const sum = (group) => group.reduce((total, file) => total + (sizes.get(file) ?? 0), 0);
const largest = (group) => [...group].sort((a, b) => (sizes.get(b) ?? 0) - (sizes.get(a) ?? 0))[0];
const failures = [];

const cssBytes = sum(cssFiles);
const jsBytes = sum(jsFiles);
const largestHtml = largest(htmlFiles);
const largestImage = largest(imageFiles);

if (cssBytes > 150_000) failures.push(`CSS budget exceeded: ${cssBytes} bytes > 150000`);
if (jsBytes > 120_000) failures.push(`JavaScript budget exceeded: ${jsBytes} bytes > 120000`);
if (largestHtml && (sizes.get(largestHtml) ?? 0) > 160_000) {
  failures.push(
    `HTML budget exceeded: ${path.relative(distRoot, largestHtml)} is ${sizes.get(largestHtml)} bytes`,
  );
}
if (largestImage && (sizes.get(largestImage) ?? 0) > 1_000_000) {
  failures.push(
    `Image budget exceeded: ${path.relative(distRoot, largestImage)} is ${sizes.get(largestImage)} bytes`,
  );
}
if (zipFiles.length > 0)
  failures.push(
    `ZIP files must not be publicly served: ${zipFiles.map((file) => path.relative(distRoot, file)).join(", ")}`,
  );

const searchableText = (
  await Promise.all([...htmlFiles, ...cssFiles, ...jsFiles].map((file) => readFile(file, "utf8")))
).join("\n");
for (const prohibited of ["fonts.googleapis.com", "fonts.gstatic.com", "gsap", "ClientRouter"]) {
  if (searchableText.includes(prohibited))
    failures.push(`Prohibited runtime dependency or remote resource found: ${prohibited}`);
}

const homepage = await readFile(path.join(distRoot, "index.html"), "utf8");
if (
  !homepage.includes("lee-business-school-960.webp") ||
  !homepage.includes("lee-business-school-1600.webp")
) {
  failures.push("Homepage does not expose the responsive WebP hero sources.");
}
if (/<style(?:\s|>)/iu.test(homepage))
  failures.push("Homepage contains inline CSS instead of a cacheable stylesheet.");

if (failures.length > 0) {
  console.error(`ERROR: performance budget failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log(
  [
    "OK: production performance budget passed.",
    `CSS: ${cssFiles.length} file(s), ${cssBytes} bytes total.`,
    `JavaScript: ${jsFiles.length} file(s), ${jsBytes} bytes total.`,
    `Largest HTML: ${largestHtml ? `${path.relative(distRoot, largestHtml)} (${sizes.get(largestHtml)} bytes)` : "none"}.`,
    `Largest image: ${largestImage ? `${path.relative(distRoot, largestImage)} (${sizes.get(largestImage)} bytes)` : "none"}.`,
  ].join("\n"),
);
