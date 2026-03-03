import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface RawPaperRecord {
  slug: unknown;
  title: unknown;
  authors: unknown;
  semester: unknown;
  category: unknown;
  advisor: unknown;
  keywords: unknown;
  abstract: unknown;
  pdf: unknown;
  published_at?: unknown;
  issue_slug?: unknown;
}

interface PaperRecord {
  slug: string;
  title: string;
  authors: string[];
  semester: string;
  category: string;
  advisor: string;
  keywords: string[];
  abstract: string;
  pdf: string;
  issue_slug: string;
  published_at?: string;
}

interface CliArgs {
  source: string;
  out: string;
}

function parseArgs(argv: string[]): CliArgs {
  let source = "";
  let out = "src/content/papers";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") {
      source = argv[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (arg === "--out") {
      out = argv[i + 1] ?? out;
      i += 1;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!source) {
    throw new Error("Missing required --source argument.");
  }

  return { source, out };
}

function printUsage(): void {
  console.log(
    "Usage: tsx scripts/import-papers-from-jekyll.ts --source <papers.json> [--out <content-dir>]",
  );
}

function assertNonEmptyString(value: unknown, field: string, index: number): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Record ${index}: '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

function assertStringArray(value: unknown, field: string, index: number): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Record ${index}: '${field}' must be a non-empty array of strings.`);
  }

  const out: string[] = [];
  value.forEach((item, itemIndex) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Record ${index}: '${field}[${itemIndex}]' must be a non-empty string.`);
    }
    out.push(item.trim());
  });

  return out;
}

function semesterToIssueSlug(semester: string, index: number): string {
  const match = semester.match(/^(spring|summer|fall|winter)\s+(\d{4})$/i);
  if (!match) {
    throw new Error(
      `Record ${index}: semester '${semester}' must match '<Term> <YYYY>' (e.g., 'Spring 2026').`,
    );
  }

  const term = match[1].toLowerCase();
  const year = match[2];
  return `${year}-${term}`;
}

function toYamlString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/\"/g, '\\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

function toYamlList(values: string[], indent = ""): string {
  return values.map((value) => `${indent}- ${toYamlString(value)}`).join("\n");
}

function toYamlBlock(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  return `|\n${lines.map((line) => `  ${line}`).join("\n")}`;
}

function renderMarkdown(record: PaperRecord): string {
  const frontMatter = [
    "---",
    `title: ${toYamlString(record.title)}`,
    "authors:",
    toYamlList(record.authors, "  "),
    `semester: ${toYamlString(record.semester)}`,
    `category: ${toYamlString(record.category)}`,
    `advisor: ${toYamlString(record.advisor)}`,
    "keywords:",
    toYamlList(record.keywords, "  "),
    `abstract: ${toYamlBlock(record.abstract)}`,
    `pdf: ${toYamlString(record.pdf)}`,
    `issue_slug: ${toYamlString(record.issue_slug)}`,
    record.published_at ? `published_at: ${toYamlString(record.published_at)}` : null,
    "---",
    "",
    "## Abstract",
    "",
    record.abstract,
    "",
    "## Keywords",
    "",
    record.keywords.join(", "),
    "",
    `[Download PDF](${record.pdf})`,
    "",
  ].filter((line): line is string => line !== null);

  return frontMatter.join("\n");
}

function validateAndNormalize(records: unknown): PaperRecord[] {
  if (!Array.isArray(records)) {
    throw new Error("Input JSON must be an array of paper records.");
  }

  if (records.length === 0) {
    throw new Error("Input JSON array is empty. Strict import requires at least one record.");
  }

  const seenSlugs = new Set<string>();

  return records.map((raw, index) => {
    if (raw === null || typeof raw !== "object") {
      throw new Error(`Record ${index}: must be an object.`);
    }

    const item = raw as RawPaperRecord;
    const slug = assertNonEmptyString(item.slug, "slug", index);
    const title = assertNonEmptyString(item.title, "title", index);
    const authors = assertStringArray(item.authors, "authors", index);
    const semester = assertNonEmptyString(item.semester, "semester", index);
    const category = assertNonEmptyString(item.category, "category", index);
    const advisor = assertNonEmptyString(item.advisor, "advisor", index);
    const keywords = assertStringArray(item.keywords, "keywords", index);
    const abstract = assertNonEmptyString(item.abstract, "abstract", index);
    const pdf = assertNonEmptyString(item.pdf, "pdf", index);

    if (!pdf.startsWith("/")) {
      throw new Error(`Record ${index}: 'pdf' must be a site-relative path starting with '/'.`);
    }

    if (seenSlugs.has(slug)) {
      throw new Error(`Record ${index}: duplicate slug '${slug}'.`);
    }
    seenSlugs.add(slug);

    let issue_slug = semesterToIssueSlug(semester, index);
    if (item.issue_slug !== undefined && item.issue_slug !== null) {
      issue_slug = assertNonEmptyString(item.issue_slug, "issue_slug", index);
    }

    let publishedAt: string | undefined;
    if (item.published_at !== undefined && item.published_at !== null) {
      publishedAt = assertNonEmptyString(item.published_at, "published_at", index);
    }

    return {
      slug,
      title,
      authors,
      semester,
      category,
      advisor,
      keywords,
      abstract,
      pdf,
      issue_slug,
      published_at: publishedAt,
    };
  });
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2));
    const sourcePath = path.resolve(process.cwd(), args.source);
    const outDir = path.resolve(process.cwd(), args.out);

    const json = await readFile(sourcePath, "utf8");
    const parsed = JSON.parse(json) as unknown;
    const papers = validateAndNormalize(parsed);

    await mkdir(outDir, { recursive: true });

    for (const paper of papers) {
      const targetPath = path.join(outDir, `${paper.slug}.md`);
      const content = renderMarkdown(paper);
      await writeFile(targetPath, content, "utf8");
    }

    console.log(`Imported ${papers.length} paper record(s) into ${outDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ERROR: ${message}`);
    process.exit(1);
  }
}

await main();
