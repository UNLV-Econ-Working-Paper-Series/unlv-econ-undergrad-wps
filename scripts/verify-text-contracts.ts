import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { verifyScholarlyOutput } from "./verify-scholarly-output";

type PageContract = {
  file: string;
  texts: string[];
  absentTexts?: string[];
};

const pageContracts: PageContract[] = [
  {
    file: "dist/index.html",
    texts: [
      "UNLV Undergraduate Economics Working Paper Series",
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/">',
      "Original economics-related research by UNLV undergraduates",
      "Preliminary working papers. Editorially screened, not peer reviewed, and subject to revision.",
      "Find a working paper",
      "Search Working Papers",
      "Latest Issue",
      "Spring 2026",
      "Volume 3, Issue 2",
      "View the complete Spring 2026 issue",
      "New Working Papers",
      "View all working papers",
      "Determinants of March Madness Tournament Advancement",
      "Las Vegas Casino Revenue in an Expanding Gambling Market",
      "Research Fields",
      "Applied Microeconomics",
      "Permanent Records in OAsis",
      "About the Series",
    ],
    absentTexts: [
      '<ol class="home-featured-list"> <li class="muted">Papers for this issue will be posted soon.</li> </ol>',
      '<p class="home-issue-meta">0 papers</p>',
      "Upcoming Issue, Spring 2026",
      "News and Events",
      "The working paper series is live",
      "Four semester issues released",
    ],
  },
  {
    file: "dist/issues/2026-spring/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/issues/2026-spring/">',
      "Spring 2026",
      "Papers in This Issue",
      "Determinants of March Madness Tournament Advancement",
      "Volume 3, Issue 2",
      "Issue overview",
      "Full text PDF",
    ],
    absentTexts: [
      "Coming soon",
      "Papers for this issue will be posted soon.",
      "No papers available yet",
      "paper records have not been posted yet",
    ],
  },
  {
    file: "dist/issues/2025-fall/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/issues/2025-fall/">',
      "Fall 2025",
      "Papers in This Issue",
      "Hedonics of Used Car Attributes on Market Price",
      "Volume 3, Issue 1",
      "Issue overview",
      "Full text PDF",
    ],
    absentTexts: ["Coming soon", "Papers for this issue will be posted soon.", "No papers available yet"],
  },
  {
    file: "dist/about/index.html",
    texts: [
      "About the Series",
      "Purpose and institutional home",
      "Molasky Family Department of Economics and Real Estate",
      "Scope and eligibility",
      "Working-paper status and semester issues",
      "A five-stage publication process",
      "The OAsis repository record",
      "Editorial Board",
      "For Student Authors",
      "Publication Policies",
    ],
    absentTexts: [
      "Graduate Assistants",
      "View all Graduate Assistants",
      "At a Glance",
      "View all Junior Editors",
    ],
  },
  {
    file: "dist/graduate-assistants/index.html",
    texts: [
      "Junior Editors",
      "This team page has moved to Junior Editors",
      "Continue to Junior Editors",
      '<meta name="robots" content="noindex, follow">',
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/editorial-board/">',
    ],
    absentTexts: ["Graduate Assistants", "Graduate Assistant"],
  },
  {
    file: "dist/issues/index.html",
    texts: [
      "Issues",
      "Published issues",
      "Latest Issue",
      "Spring 2026",
      "Fall 2025",
      "7 working papers",
      "1 working paper",
      "Historical archive",
    ],
    absentTexts: [
      "Coming soon",
      "Issue listings will be posted soon.",
      "0 papers • 0 categories",
      "Uncategorized",
      "Search papers",
      "All years",
      "All research fields",
    ],
  },
  {
    file: "dist/papers/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/papers/">',
      "Working Papers",
      "Published collection",
      "Showing 15 papers",
      "Search",
      "Research Field",
      "Issue",
      "Sort",
      "All research fields",
      "All issues",
      "Fall 2025",
      "Hedonics of Used Car Attributes on Market Price",
      "Citable publication date",
      "OAsis online date",
      "Series number",
      "Abstract and details",
      "BibTeX",
      "RIS",
    ],
    absentTexts: [
      "No current-series papers are available yet",
      "Date not provided",
      "All semesters",
      "All years",
      "Card view",
    ],
  },
  {
    file: "dist/papers/hedonics-used-car-attributes/index.html",
    texts: [
      "Hedonics of Used Car Attributes on Market Price",
      "Alexander Bent and Jason Gutierrez",
      "Fall 2025",
      "Abstract",
      "Paper record",
      "Applied Microeconomics",
      "Volume 3, Issue 1",
      "May 21, 2026",
      "August 5, 2026",
      "UNLV-Econ-WPS-2026-004",
      "10.34917/40601193",
      "Cite this paper",
      "Working paper notice:",
      "Read full paper (PDF)",
      "OAsis repository",
      "APA 7th",
      "MLA 9th",
      "Chicago 17th (author-date)",
      "Permanent OAsis record",
      "Permanent repository record",
      "Version history",
    ],
    absentTexts: ["Advisor</dt><dd>Not provided", "PDF Preview"],
  },
  {
    file: "dist/contact/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/contact/">',
      "Contact",
      "Who are you trying to reach?",
      "Series Editorial Office",
      "Molasky Family Department of Economics and Real Estate",
      "contact@econ-undergrad-wps.sites.unlv.edu",
      "Email the Series",
      "Call Office",
      "Common Requests",
      "OAsis record or DOI questions",
      "records-retention requirements",
      "Directions",
      "Open in Google Maps",
    ],
    absentTexts: [
      "series-team@unlv.edu",
      "Placeholder address until the department assigns a permanent series inbox",
    ],
  },
  {
    file: "dist/robots.txt",
    texts: ["User-agent: *", "Allow: /", "Sitemap: https://econ-undergrad-wps.sites.unlv.edu/sitemap.xml"],
  },
  {
    file: "dist/sitemap.xml",
    texts: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/about/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/editorial-board/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/history/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/for-authors/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/fields/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/2026-spring/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/2025-fall/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/contact/</loc>",
    ],
    absentTexts: ["localhost", "127.0.0.1"],
  },
];

function readBuiltPage(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing built page: ${relativePath}. Run npm run build first.`);
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function listBuiltHtmlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listBuiltHtmlFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolutePath] : [];
  });
}

function visibleText(fragment: string): string {
  return fragment
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function verifyBuiltHtmlInvariants(failures: string[]): void {
  const distDirectory = path.resolve(process.cwd(), "dist");
  for (const absolutePath of listBuiltHtmlFiles(distDirectory)) {
    if (/\/google[^/]*\.html$/i.test(absolutePath)) continue;
    const relativePath = path.relative(process.cwd(), absolutePath);
    const html = fs.readFileSync(absolutePath, "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number.parseInt(match[1], 10));

    if (!visibleText(title) || /undefined/i.test(title)) {
      failures.push(`${relativePath} has an empty or undefined document title.`);
    }
    if (headings.length !== 1) {
      failures.push(`${relativePath} must contain exactly one h1; found ${headings.length}.`);
    } else if (!visibleText(headings[0][1])) {
      failures.push(`${relativePath} has an empty h1.`);
    }
    if (/>\s*undefined\s*</i.test(html)) {
      failures.push(`${relativePath} renders undefined as visible content.`);
    }
    for (let index = 1; index < headingLevels.length; index += 1) {
      if (headingLevels[index] > headingLevels[index - 1] + 1) {
        failures.push(
          `${relativePath} skips a heading level from h${headingLevels[index - 1]} to h${headingLevels[index]}.`,
        );
        break;
      }
    }
  }
}

function verifyContracts(): void {
  const failures: string[] = [];

  for (const contract of pageContracts) {
    const html = readBuiltPage(contract.file);
    for (const text of contract.texts) {
      if (!html.includes(text)) {
        failures.push(`${contract.file} is missing required text: ${JSON.stringify(text)}`);
      }
    }
    for (const text of contract.absentTexts ?? []) {
      if (html.includes(text)) {
        failures.push(`${contract.file} includes disallowed text: ${JSON.stringify(text)}`);
      }
    }
  }

  verifyBuiltHtmlInvariants(failures);
  verifyScholarlyOutput(failures);

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

try {
  verifyContracts();
  console.log("OK: verified page text contracts and built HTML title/heading invariants.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
