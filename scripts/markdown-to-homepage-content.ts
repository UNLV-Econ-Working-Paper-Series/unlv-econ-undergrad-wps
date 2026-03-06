import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import type { HomeLink, HomePageEditableContent } from "../src/data/homepage-content.types";

type FrontmatterMap = Record<string, string>;

const DEFAULT_INPUT_PATH = path.resolve(process.cwd(), "scripts/homepage-content.md");
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), "src/data/homepage-content.ts");

const HELP_TEXT = `
Usage:
  npm run generate:homepage-content -- --input <markdown-file> [--output <ts-file>]
  cat homepage-content.md | npm run generate:homepage-content -- --stdin [--output <ts-file>]

Options:
  --input <path>   Markdown file path (default: scripts/homepage-content.md)
  --stdin          Read markdown blob from stdin instead of file
  --output <path>  Output TS file (default: src/data/homepage-content.ts)
  --help           Show this message

Expected markdown format:
  Frontmatter keys (optional):
    latest_issue_title
    latest_issue_url
    issue_meta_text
    featured_empty_state_text
    latest_issue_primary_cta_text
    latest_issue_primary_cta_url
    latest_issue_secondary_cta_text
    latest_issue_secondary_cta_url
    news_eyebrow
    news_title
    news_empty_state_text

  Body sections (optional):
    ## Featured Items
    - [Label](/url) or - Plain text

    ## News and Events
    - Bullet item
`.trim();

function parseArgs(argv: string[]): { inputPath: string; outputPath: string; useStdin: boolean; help: boolean } {
  let inputPath = DEFAULT_INPUT_PATH;
  let outputPath = DEFAULT_OUTPUT_PATH;
  let useStdin = false;
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg === "--stdin") {
      useStdin = true;
      continue;
    }
    if (arg === "--input") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--input requires a file path");
      }
      inputPath = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    if (arg === "--output") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--output requires a file path");
      }
      outputPath = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { inputPath, outputPath, useStdin, help };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function splitFrontmatter(markdown: string): { frontmatterRaw: string; body: string } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) {
    return { frontmatterRaw: "", body: normalized };
  }

  const frontmatterRaw = (match[1] ?? "").trim();
  const body = normalized.slice(match[0].length);
  return { frontmatterRaw, body };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const startsWithQuote = trimmed.startsWith("\"") || trimmed.startsWith("'");
    const endsWithQuote = trimmed.endsWith("\"") || trimmed.endsWith("'");
    if (startsWithQuote && endsWithQuote) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

function parseSimpleFrontmatter(raw: string): FrontmatterMap {
  const out: FrontmatterMap = {};
  if (!raw.trim()) {
    return out;
  }

  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/);
    if (!match) {
      continue;
    }
    const key = match[1].trim();
    const value = unquote(match[2] ?? "");
    out[key] = value;
  }
  return out;
}

function normalizeHeading(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLinkBullet(raw: string): HomeLink | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) {
    return null;
  }
  const label = match[1].trim();
  const href = match[2].trim();
  if (!label || !href) {
    return null;
  }
  return { label, href };
}

function parseBodySections(body: string): { featuredItems: HomeLink[]; newsItems: string[] } {
  const featuredItems: HomeLink[] = [];
  const newsItems: string[] = [];
  let currentSection: "featured" | "news" | null = null;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const normalizedHeading = normalizeHeading(heading[1] ?? "");
      if (normalizedHeading.includes("featured items")) {
        currentSection = "featured";
      } else if (normalizedHeading.includes("news and events") || normalizedHeading === "news" || normalizedHeading === "events") {
        currentSection = "news";
      } else {
        currentSection = null;
      }
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (!bullet || !currentSection) {
      continue;
    }

    const bulletText = bullet[1].trim();
    if (!bulletText) {
      continue;
    }

    if (currentSection === "featured") {
      const link = parseLinkBullet(bulletText);
      if (link) {
        featuredItems.push(link);
      } else {
        featuredItems.push({ label: bulletText, href: "" });
      }
      continue;
    }

    if (currentSection === "news") {
      // Preserve plain text output in the existing UI list.
      const link = parseLinkBullet(bulletText);
      newsItems.push(link ? link.label : bulletText);
    }
  }

  return { featuredItems, newsItems };
}

function maybeText(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function maybeLink(label: string | undefined, href: string | undefined): HomeLink | undefined {
  const normalizedLabel = maybeText(label);
  const normalizedHref = maybeText(href);
  if (!normalizedLabel && !normalizedHref) {
    return undefined;
  }
  return {
    label: normalizedLabel ?? "",
    href: normalizedHref ?? "",
  };
}

function withoutEmpty<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => withoutEmpty(item))
      .filter((item) => {
        if (item === undefined || item === null) {
          return false;
        }
        if (typeof item === "string") {
          return item.trim().length > 0;
        }
        if (Array.isArray(item)) {
          return item.length > 0;
        }
        if (typeof item === "object") {
          return Object.keys(item).length > 0;
        }
        return true;
      });
    return cleanedArray as T;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => [key, withoutEmpty(nested)] as const)
      .filter(([, nested]) => {
        if (nested === undefined || nested === null) {
          return false;
        }
        if (typeof nested === "string") {
          return nested.trim().length > 0;
        }
        if (Array.isArray(nested)) {
          return nested.length > 0;
        }
        if (typeof nested === "object") {
          return Object.keys(nested as Record<string, unknown>).length > 0;
        }
        return true;
      });
    return Object.fromEntries(entries) as T;
  }

  return value;
}

function buildContent(markdown: string): HomePageEditableContent {
  const { frontmatterRaw, body } = splitFrontmatter(markdown);
  const fm = parseSimpleFrontmatter(frontmatterRaw);
  const { featuredItems, newsItems } = parseBodySections(body);

  const latestIssue = withoutEmpty({
    title: maybeText(fm.latest_issue_title),
    href: maybeText(fm.latest_issue_url),
    metaText: maybeText(fm.issue_meta_text),
    emptyStateText: maybeText(fm.featured_empty_state_text),
    primaryCta: maybeLink(fm.latest_issue_primary_cta_text, fm.latest_issue_primary_cta_url),
    secondaryCta: maybeLink(fm.latest_issue_secondary_cta_text, fm.latest_issue_secondary_cta_url),
    featuredItems: featuredItems.length > 0 ? featuredItems : undefined,
  });

  const newsAndEvents = withoutEmpty({
    eyebrow: maybeText(fm.news_eyebrow),
    title: maybeText(fm.news_title),
    emptyStateText: maybeText(fm.news_empty_state_text),
    items: newsItems.length > 0 ? newsItems : undefined,
  });

  return withoutEmpty({
    latestIssue,
    newsAndEvents,
  });
}

function toGeneratedTypeScript(content: HomePageEditableContent): string {
  const payload = JSON.stringify(content, null, 2);
  return [
    'import type { HomePageEditableContent } from "./homepage-content.types";',
    "",
    "// This file is generated by scripts/markdown-to-homepage-content.ts.",
    "// Do not edit this file manually.",
    `export const HOMEPAGE_EDITABLE_CONTENT: HomePageEditableContent = ${payload};`,
    "",
  ].join("\n");
}

function ensureParentDir(targetPath: string): void {
  const parent = path.dirname(targetPath);
  fs.mkdirSync(parent, { recursive: true });
}

async function main(): Promise<void> {
  const { inputPath, outputPath, useStdin, help } = parseArgs(process.argv.slice(2));
  if (help) {
    console.log(HELP_TEXT);
    return;
  }

  const markdown = useStdin ? await readStdin() : fs.readFileSync(inputPath, "utf8");
  const content = buildContent(markdown);
  const generatedTs = toGeneratedTypeScript(content);

  ensureParentDir(outputPath);
  fs.writeFileSync(outputPath, generatedTs, "utf8");
  console.log(`OK: generated ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
});
