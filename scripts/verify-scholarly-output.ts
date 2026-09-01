import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { paperSchema } from "../src/content/paper-schema";
import { SERIES } from "../src/config/publication";
import { PUBLIC_PROFILES } from "../src/data/public-profiles";
import { getArchiveIssueGroups } from "../src/lib/archive";
import {
  buildScholarlyJsonLd,
  buildScholarlyMetaTags,
  citationExportHref,
  generateBibTeXCollection,
  generateRisCollection,
  parseSeriesIdentifier,
  researchFieldSlug,
  type PublicationRecord,
} from "../src/lib/publication";

interface SourcePaper {
  slug: string;
  data: PublicationRecord;
}

const SITE_ORIGIN = new URL(SERIES.siteUrl).origin;
const DIST_DIRECTORY = path.resolve(process.cwd(), "dist");

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/gu, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&amp;/giu, "&");
}

function attributes(tag: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const match of tag.matchAll(/([^\s=]+)\s*=\s*"([^"]*)"/gu)) {
    result.set(match[1].toLocaleLowerCase("en-US"), decodeHtml(match[2]));
  }
  return result;
}

function tags(html: string, tagName: string): Array<Map<string, string>> {
  const expression = new RegExp(`<${tagName}\\b[^>]*>`, "giu");
  return [...html.matchAll(expression)].map((match) => attributes(match[0]));
}

function metaValues(html: string, name: string, attribute = "name"): string[] {
  return tags(html, "meta")
    .filter((tag) => tag.get(attribute)?.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"))
    .map((tag) => tag.get("content") ?? "");
}

function linkHrefs(html: string, relation: string, mediaType?: string): string[] {
  return tags(html, "link")
    .filter((tag) => tag.get("rel")?.split(/\s+/u).includes(relation))
    .filter((tag) => !mediaType || tag.get("type") === mediaType)
    .map((tag) => tag.get("href") ?? "");
}

function read(relativePath: string, failures: string[]): string | null {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing built publication artifact: ${relativePath}.`);
    return null;
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function sourcePapers(): SourcePaper[] {
  const directory = path.resolve(process.cwd(), "src", "content", "papers");
  return fs
    .readdirSync(directory)
    .filter((name) => /\.mdx?$/iu.test(name))
    .sort((a, b) => a.localeCompare(b, "en-US"))
    .map((name) => {
      const source = fs.readFileSync(path.join(directory, name), "utf8");
      const data = paperSchema.parse(parseFrontmatter(source).frontmatter) as PublicationRecord;
      return { slug: name.replace(/\.mdx?$/iu, ""), data };
    });
}

function expectEqual(actual: unknown, expected: unknown, message: string, failures: string[]): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${message} Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
  }
}

function normalizeRoutePath(value: string): string {
  const pathname = new URL(value, SITE_ORIGIN).pathname;
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function builtHtmlPath(routePath: string): string {
  if (routePath === "/") return path.join(DIST_DIRECTORY, "index.html");
  return path.join(DIST_DIRECTORY, routePath.replace(/^\//u, ""), "index.html");
}

function listHtmlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolutePath] : [];
  });
}

function routeForBuiltHtml(absolutePath: string): string | null {
  const relative = path.relative(DIST_DIRECTORY, absolutePath).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (!relative.endsWith("/index.html")) return null;
  return `/${relative.slice(0, -"index.html".length)}`;
}

function verifyPaperOutputs(papers: readonly SourcePaper[], failures: string[]): void {
  const catalog = read("dist/papers/index.html", failures);
  if (
    catalog?.includes("data:application/x-bibtex") ||
    catalog?.includes("data:application/x-research-info-systems")
  ) {
    failures.push("Paper catalog still embeds citation data URIs instead of static export routes.");
  }

  for (const paper of papers) {
    const pagePath = `/papers/${paper.slug}/`;
    const issuePath = `/issues/${paper.data.issue_slug}/`;
    const canonicalUrl = new URL(pagePath, SITE_ORIGIN).toString();
    const issueUrl = new URL(issuePath, SITE_ORIGIN).toString();
    const relativeHtmlPath = `dist/papers/${paper.slug}/index.html`;
    const html = read(relativeHtmlPath, failures);
    if (!html) continue;

    expectEqual(
      linkHrefs(html, "canonical"),
      [canonicalUrl],
      `${relativeHtmlPath} canonical mismatch.`,
      failures,
    );
    expectEqual(
      metaValues(html, "og:type", "property"),
      ["article"],
      `${relativeHtmlPath} Open Graph type mismatch.`,
      failures,
    );
    expectEqual(
      metaValues(html, "og:title", "property"),
      [paper.data.title],
      `${relativeHtmlPath} social title mismatch.`,
      failures,
    );
    expectEqual(
      metaValues(html, "article:published_time", "property"),
      [paper.data.citable_published_at],
      `${relativeHtmlPath} article publication date mismatch.`,
      failures,
    );
    expectEqual(
      metaValues(html, "article:modified_time", "property"),
      [paper.data.current_version.published_at],
      `${relativeHtmlPath} article modification date mismatch.`,
      failures,
    );

    const expectedMeta = buildScholarlyMetaTags(paper.data, { canonicalUrl });
    const metadataNames = [...new Set(expectedMeta.map((tag) => tag.name))];
    for (const name of metadataNames) {
      expectEqual(
        metaValues(html, name),
        expectedMeta.filter((tag) => tag.name === name).map((tag) => tag.content),
        `${relativeHtmlPath} ${name} mismatch.`,
        failures,
      );
    }
    if (metaValues(html, "citation_pdf_url").length > 0) {
      failures.push(`${relativeHtmlPath} emits the unapproved cross-domain citation_pdf_url tag.`);
    }

    const scripts = [
      ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/giu),
    ];
    if (scripts.length !== 1) {
      failures.push(`${relativeHtmlPath} must emit exactly one JSON-LD block; found ${scripts.length}.`);
    } else {
      if (scripts[0][1].includes("<")) {
        failures.push(`${relativeHtmlPath} JSON-LD contains an unescaped less-than character.`);
      }
      try {
        const actualJsonLd = JSON.parse(scripts[0][1]);
        const expectedJsonLd = buildScholarlyJsonLd(paper.data, { canonicalUrl, issueUrl });
        expectEqual(actualJsonLd, expectedJsonLd, `${relativeHtmlPath} JSON-LD mismatch.`, failures);
        if (Object.hasOwn(actualJsonLd, "publisher")) {
          failures.push(`${relativeHtmlPath} fabricates unresolved publisher metadata.`);
        }
      } catch (error) {
        failures.push(
          `${relativeHtmlPath} contains invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}.`,
        );
      }
    }

    const bibtexHref = citationExportHref("paper", paper.slug, "bibtex");
    const risHref = citationExportHref("paper", paper.slug, "ris");
    expectEqual(
      linkHrefs(html, "alternate", "application/x-bibtex"),
      [bibtexHref],
      `${relativeHtmlPath} BibTeX alternate link mismatch.`,
      failures,
    );
    expectEqual(
      linkHrefs(html, "alternate", "application/x-research-info-systems"),
      [risHref],
      `${relativeHtmlPath} RIS alternate link mismatch.`,
      failures,
    );
    if (!html.includes(`href="${bibtexHref}"`) || !html.includes(`href="${risHref}"`)) {
      failures.push(`${relativeHtmlPath} does not expose both static citation downloads.`);
    }

    const bibtex = read(`dist/papers/${paper.slug}/citation.bib`, failures);
    if (bibtex !== null) {
      expectEqual(
        bibtex,
        generateBibTeXCollection([paper.data]),
        `${paper.slug} BibTeX body mismatch.`,
        failures,
      );
    }
    const ris = read(`dist/papers/${paper.slug}/citation.ris`, failures);
    if (ris !== null) {
      expectEqual(ris, generateRisCollection([paper.data]), `${paper.slug} RIS body mismatch.`, failures);
    }
  }
}

function verifyIssueExports(papers: readonly SourcePaper[], failures: string[]): void {
  const byIssue = new Map<string, SourcePaper[]>();
  for (const paper of papers) {
    const group = byIssue.get(paper.data.issue_slug) ?? [];
    group.push(paper);
    byIssue.set(paper.data.issue_slug, group);
  }
  const issueIndex = read("dist/issues/index.html", failures);

  for (const [issueSlug, issuePapers] of byIssue) {
    issuePapers.sort(
      (a, b) =>
        parseSeriesIdentifier(a.data.series_number).sequence -
        parseSeriesIdentifier(b.data.series_number).sequence,
    );
    const records = issuePapers.map((paper) => paper.data);
    const bibtexHref = citationExportHref("issue", issueSlug, "bibtex");
    const risHref = citationExportHref("issue", issueSlug, "ris");
    const issueHtml = read(`dist/issues/${issueSlug}/index.html`, failures);
    for (const [label, html] of [
      ["issue index", issueIndex],
      [`${issueSlug} issue page`, issueHtml],
    ] as const) {
      if (html && (!html.includes(`href="${bibtexHref}"`) || !html.includes(`href="${risHref}"`))) {
        failures.push(`${label} does not link both issue citation exports.`);
      }
    }

    const bibtex = read(`dist/issues/${issueSlug}/citations.bib`, failures);
    if (bibtex !== null) {
      expectEqual(
        bibtex,
        generateBibTeXCollection(records),
        `${issueSlug} BibTeX collection mismatch.`,
        failures,
      );
    }
    const ris = read(`dist/issues/${issueSlug}/citations.ris`, failures);
    if (ris !== null) {
      expectEqual(ris, generateRisCollection(records), `${issueSlug} RIS collection mismatch.`, failures);
    }
  }
}

function expectedSitemapPaths(papers: readonly SourcePaper[]): string[] {
  const policyDirectory = path.resolve(process.cwd(), "src", "pages", "policies");
  const policyPaths = fs
    .readdirSync(policyDirectory)
    .filter((name) => /\.md$/u.test(name))
    .map((name) => `/policies/${name.replace(/\.md$/u, "")}/`);
  const issuePaths = [...new Set(papers.map((paper) => `/issues/${paper.data.issue_slug}/`))];
  const fieldPaths = [...new Set(papers.map((paper) => `/fields/${researchFieldSlug(paper.data.field)}/`))];
  const archivePaths = getArchiveIssueGroups()
    .filter((issue) => issue.papers.length > 0)
    .map((issue) => `/issues/archive/${issue.slug}/`);
  const profilePaths = PUBLIC_PROFILES.map((profile) => profile.profileHref)
    .filter((href): href is string => Boolean(href))
    .map(normalizeRoutePath);

  return [
    ...new Set([
      "/",
      "/about/",
      "/editorial-board/",
      "/history/",
      "/contact/",
      "/for-authors/",
      "/issues/",
      "/issues/archive/",
      "/papers/",
      "/fields/",
      "/policies/",
      ...issuePaths,
      ...archivePaths,
      ...fieldPaths,
      ...papers.map((paper) => `/papers/${paper.slug}/`),
      ...profilePaths,
      ...policyPaths,
    ]),
  ].sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b, "en-US")));
}

function verifySitemapAndRobots(papers: readonly SourcePaper[], failures: string[]): void {
  const sitemap = read("dist/sitemap.xml", failures);
  if (sitemap) {
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => decodeHtml(match[1]));
    const paths = locations.map((location) => normalizeRoutePath(location));
    expectEqual(paths, expectedSitemapPaths(papers), "Sitemap canonical route set mismatch.", failures);
    if (new Set(locations).size !== locations.length) failures.push("Sitemap contains duplicate URLs.");

    for (const location of locations) {
      const url = new URL(location);
      if (url.origin !== SITE_ORIGIN) failures.push(`Sitemap includes a noncanonical origin: ${location}.`);
      if (/localhost|127\.0\.0\.1|staging/iu.test(location))
        failures.push(`Sitemap includes a development or staging URL: ${location}.`);
      if (/\.(?:bib|ris)(?:\/)?$/iu.test(url.pathname))
        failures.push(`Sitemap includes a download artifact: ${location}.`);

      const routePath = normalizeRoutePath(location);
      const htmlPath = builtHtmlPath(routePath);
      if (!fs.existsSync(htmlPath)) {
        failures.push(`Sitemap URL has no built HTML output: ${location}.`);
        continue;
      }
      const html = fs.readFileSync(htmlPath, "utf8");
      expectEqual(
        linkHrefs(html, "canonical"),
        [location],
        `${routePath} canonical does not match sitemap URL.`,
        failures,
      );
      if (metaValues(html, "robots").some((value) => /\bnoindex\b/iu.test(value))) {
        failures.push(`Sitemap includes a noindex route: ${location}.`);
      }
      if (tags(html, "meta").some((tag) => tag.get("http-equiv")?.toLocaleLowerCase("en-US") === "refresh")) {
        failures.push(`Sitemap includes a redirect fallback route: ${location}.`);
      }
    }

    for (const legacy of [
      "/categories/",
      "/our/",
      "/graduate-assistants/",
      "/issues/page2/",
      "/issues/page3/",
    ]) {
      if (paths.includes(legacy)) failures.push(`Sitemap includes redirect-only legacy route ${legacy}.`);
    }
  }

  if (fs.existsSync(DIST_DIRECTORY)) {
    for (const htmlPath of listHtmlFiles(DIST_DIRECTORY)) {
      const routePath = routeForBuiltHtml(htmlPath);
      if (!routePath) continue;
      const html = fs.readFileSync(htmlPath, "utf8");
      const robotsValues = metaValues(html, "robots").map((value) => value.toLocaleLowerCase("en-US"));
      const isNoindex = robotsValues.some((value) => /\bnoindex\b/iu.test(value));
      const isRedirect = tags(html, "meta").some(
        (tag) => tag.get("http-equiv")?.toLocaleLowerCase("en-US") === "refresh",
      );
      if (isRedirect && !robotsValues.includes("noindex, follow")) {
        failures.push(`${routePath} is a redirect fallback without the exact noindex, follow directive.`);
      }
      if (isNoindex && sitemap?.includes(`<loc>${new URL(routePath, SITE_ORIGIN).toString()}</loc>`)) {
        failures.push(`${routePath} is noindex but still appears in the sitemap.`);
      }
    }
  }

  const robots = read("dist/robots.txt", failures);
  if (robots) {
    for (const required of [
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${new URL("/sitemap.xml", SITE_ORIGIN).toString()}`,
    ]) {
      if (!robots.includes(required)) failures.push(`robots.txt is missing ${JSON.stringify(required)}.`);
    }
    if (/^Disallow:\s*\/(?:papers|issues|fields|policies)/gimu.test(robots)) {
      failures.push("robots.txt blocks canonical scholarly content.");
    }
  }
}

function verifySocialCard(failures: string[]): void {
  const sourcePath = path.resolve(process.cwd(), "scripts", "assets", "og-image.svg");
  if (!fs.existsSync(sourcePath)) {
    failures.push("Missing programmatic Open Graph image source.");
  } else {
    const source = fs.readFileSync(sourcePath, "utf8");
    for (const required of [
      "Molasky Family Department of Economics and Real Estate",
      "Lee Business School",
      "University of Nevada, Las Vegas",
    ]) {
      if (!source.toLocaleLowerCase("en-US").includes(required.toLocaleLowerCase("en-US"))) {
        failures.push(
          `Open Graph image source is missing current institutional text ${JSON.stringify(required)}.`,
        );
      }
    }
    if (/UNLV Department of Economics/iu.test(source)) {
      failures.push("Open Graph image source contains stale department naming.");
    }
    if (/<image\b/iu.test(source)) {
      failures.push("Open Graph image source embeds an unapproved external image or logo asset.");
    }
  }

  const imagePath = path.resolve(process.cwd(), "public", "assets", "brand", "og-image.png");
  if (!fs.existsSync(imagePath)) {
    failures.push("Missing generated Open Graph image.");
    return;
  }
  const data = fs.readFileSync(imagePath);
  const pngSignature = "89504e470d0a1a0a";
  if (data.subarray(0, 8).toString("hex") !== pngSignature || data.length < 24) {
    failures.push("Open Graph image is not a valid PNG.");
    return;
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    failures.push(`Open Graph image must be 1200x630; received ${width}x${height}.`);
  }
}

export function verifyScholarlyOutput(failures: string[]): void {
  const papers = sourcePapers();
  verifyPaperOutputs(papers, failures);
  verifyIssueExports(papers, failures);
  verifySitemapAndRobots(papers, failures);
  verifySocialCard(failures);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const failures: string[] = [];
  verifyScholarlyOutput(failures);
  if (failures.length > 0) {
    console.error(
      `ERROR: scholarly output verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log("OK: verified scholarly metadata, citation exports, sitemap, robots, and social-card output.");
}
