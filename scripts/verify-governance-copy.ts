import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { EDITORIAL_BOARD, JUNIOR_EDITORS, PUBLICATION_APPROVAL_RULE } from "../src/config/editorial";
import { INSTITUTION, INSTITUTIONAL_HIERARCHY } from "../src/config/institution";
import { OASIS, PRIMARY_NAVIGATION, PUBLIC_ROUTES, RESEARCH_FIELDS, SERIES } from "../src/config/publication";

type ProhibitedPattern = {
  pattern: RegExp;
  reason: string;
};

const prohibitedVisibleCopy: ProhibitedPattern[] = [
  { pattern: /UNLV Department of Economics/i, reason: "stale former department naming" },
  { pattern: /\bOASIS\b/, reason: "incorrect OAsis styling" },
  { pattern: /Platform built by/i, reason: "unapproved platform attribution in public copy" },
  { pattern: /Founding Technical Editor/i, reason: "obsolete public role" },
  { pattern: /sponsors the site/i, reason: "unsupported site-sponsorship claim" },
  { pattern: /the department sponsors the Series/i, reason: "unsupported department-sponsorship claim" },
  {
    pattern:
      /students?\s+from\s+any\s+(?:college|institution|university).{0,50}(?:submit|eligible|considered)/i,
    reason: "unsupported external-student eligibility",
  },
  {
    pattern: /(?:the\s+Series|working\s+paper\s+series)\s+(?:is|are|uses?)\s+peer[- ]review/i,
    reason: "unsupported peer-review claim for the Series",
  },
  {
    pattern: /(?:papers?|projects?).{0,80}(?:can|may|will).{0,30}(?:submitted?|submission).{0,30}Spectra/i,
    reason: "unsupported Spectra pathway claim",
  },
  { pattern: /OAsis\s+is\s+the\s+publisher/i, reason: "unsupported OAsis publisher claim" },
  { pattern: /Latest Semester Release/i, reason: "obsolete launch-interface copy" },
  { pattern: /One catalog, two ways to explore/i, reason: "obsolete product-interface copy" },
  { pattern: /The working paper series is live/i, reason: "obsolete launch announcement" },
  { pattern: /Four semester issues released/i, reason: "obsolete launch announcement" },
  { pattern: /Read full about/i, reason: "low-quality interface copy" },
  { pattern: /pre-2024 Hub working papers/i, reason: "unexplained legacy-system language" },
  { pattern: /\b1 papers\b/i, reason: "incorrect singular/plural rendering" },
  { pattern: /\b1 categories\b/i, reason: "incorrect singular/plural rendering" },
  { pattern: /\bundefined\b/i, reason: "undefined visible value" },
  { pattern: /\b(?:TODO|TBD)\b/, reason: "unfinished visible placeholder" },
  { pattern: /\bplaceholder\b/i, reason: "visible placeholder text" },
];

function listFiles(directory: string, extensions: ReadonlySet<string>): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(absolutePath, extensions);
    return entry.isFile() && extensions.has(path.extname(entry.name)) ? [absolutePath] : [];
  });
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(?:x27|39);|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function verifyConfiguration(failures: string[]): void {
  if (SERIES.name !== "UNLV Undergraduate Economics Working Paper Series") {
    failures.push("Canonical Series name changed.");
  }
  if (INSTITUTION.department.name !== "Molasky Family Department of Economics and Real Estate") {
    failures.push("Canonical department name changed.");
  }
  if (OASIS.name !== "OAsis") {
    failures.push("Canonical OAsis styling changed.");
  }
  if (INSTITUTIONAL_HIERARCHY.length !== 4 || INSTITUTIONAL_HIERARCHY[3] !== SERIES.name) {
    failures.push("Institutional hierarchy is incomplete or out of order.");
  }
  if (
    PRIMARY_NAVIGATION.map((item) => item.label).join("|") !==
    "Home|Working Papers|Issues|Research Fields|For Student Authors|About"
  ) {
    failures.push("Primary navigation labels no longer match the publication contract.");
  }
  if (!PUBLIC_ROUTES.fields.startsWith("/fields/") || !PUBLIC_ROUTES.authors.startsWith("/for-authors/")) {
    failures.push("Required publication routes are missing from public configuration.");
  }
  if (new Set(RESEARCH_FIELDS).size !== 17 || RESEARCH_FIELDS.length !== 17) {
    failures.push("Controlled research-field taxonomy must contain 17 unique fields.");
  }
  if (EDITORIAL_BOARD.length !== 3 || EDITORIAL_BOARD.some((member) => !member.voting)) {
    failures.push("The intended Editorial Board must contain three voting members.");
  }
  const djeto = EDITORIAL_BOARD.find((member) => member.id === "djeto-assane");
  if (!djeto || djeto.publicTitle !== "Faculty Editor") {
    failures.push("Djeto Assané must remain Faculty Editor until the expanded title is confirmed.");
  }
  if (JUNIOR_EDITORS.some((member) => member.voting)) {
    failures.push("Junior Editors must not have voting authority.");
  }
  if (
    !PUBLICATION_APPROVAL_RULE.includes("two non-conflicted voting editors") ||
    !PUBLICATION_APPROVAL_RULE.includes("Faculty Editor")
  ) {
    failures.push("Publication approval rule no longer contains the required voting threshold.");
  }
}

function verifyBuiltCopy(failures: string[]): void {
  const distDirectory = path.resolve(process.cwd(), "dist");
  const htmlFiles = listFiles(distDirectory, new Set([".html"]));
  if (htmlFiles.length === 0) {
    failures.push("No built HTML found. Run the Astro build before governance-copy verification.");
    return;
  }

  for (const file of htmlFiles) {
    const text = visibleText(fs.readFileSync(file, "utf8"));
    const relativePath = path.relative(process.cwd(), file);
    for (const { pattern, reason } of prohibitedVisibleCopy) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        failures.push(`${relativePath}: ${reason}: ${JSON.stringify(match[0])}`);
      }
    }
  }

  const manifestPath = path.join(distDirectory, "site.webmanifest");
  if (fs.existsSync(manifestPath)) {
    const manifestText = fs.readFileSync(manifestPath, "utf8");
    for (const { pattern, reason } of prohibitedVisibleCopy) {
      pattern.lastIndex = 0;
      const match = pattern.exec(manifestText);
      if (match) failures.push(`dist/site.webmanifest: ${reason}: ${JSON.stringify(match[0])}`);
    }
  }
}

const failures: string[] = [];
verifyConfiguration(failures);
verifyBuiltCopy(failures);

if (failures.length > 0) {
  console.error(
    `ERROR: governance-copy verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log("OK: verified canonical publication configuration and prohibited public-copy contracts.");
