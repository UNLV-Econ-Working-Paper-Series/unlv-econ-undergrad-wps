import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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
      "Archive for undergraduate economics working papers at UNLV",
      "Published by semester issue",
      "Latest Issue",
      "Latest Semester Release",
      "Upcoming Issue, Spring 2026",
      "Papers for this issue will be posted soon.",
      "View all issues",
      "News and Events",
      "Updates about the series will be posted here.",
      "Browse by Category",
      "Explore Topic Areas",
      "Topic pages will populate as papers are added to the series.",
      "What This Series Is",
      "Read full about",
    ],
    absentTexts: [
      '<ol class="home-featured-list"> <li class="muted">Papers for this issue will be posted soon.</li> </ol>',
      '<p class="home-issue-meta">0 papers</p>',
    ],
  },
  {
    file: "dist/issues/2026-spring/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/issues/2026-spring/">',
      "Spring 2026",
      "Coming soon",
      "Papers for this issue will be posted soon.",
    ],
    absentTexts: [
      "No papers available yet",
      "paper records have not been posted yet",
    ],
  },
  {
    file: "dist/about/index.html",
    texts: [
      "About",
      "At a Glance",
      "Series Scope",
      "How Publication Works",
      "Policies",
      "Editorial Board",
      "Graduate Assistants",
      "View all Graduate Assistants",
      "Get Involved",
      "Professor Djeto Assané, Ph.D.",
      "Professor Eric Chiang, Ph.D.",
      "Mark Jayson Farol, M.A.",
      "Brandon Penticoff",
    ],
  },
  {
    file: "dist/issues/index.html",
    texts: [
      "Issues",
      "Coming soon",
      "Issue listings will be posted soon.",
      "Legacy Archive",
    ],
    absentTexts: [
      "Latest issue:",
      "All years",
      "All categories",
      "0 papers • 0 categories",
      "Uncategorized",
    ],
  },
  {
    file: "dist/contact/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/contact/">',
      "Contact",
      "Who are you trying to reach?",
      "Series Team",
      "Department of Economics",
      "contact@econ-undergrad-wps.sites.unlv.edu",
      "Email Series Team",
      "Call Office",
      "Common Requests",
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
    texts: [
      "User-agent: *",
      "Allow: /",
      "Sitemap: https://econ-undergrad-wps.sites.unlv.edu/sitemap.xml",
    ],
  },
  {
    file: "dist/sitemap.xml",
    texts: [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/about/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/2026-spring/</loc>",
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/contact/</loc>",
    ],
    absentTexts: [
      "localhost",
      "127.0.0.1",
    ],
  },
];

function readBuiltPage(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing built page: ${relativePath}. Run npm run build first.`);
  }
  return fs.readFileSync(absolutePath, "utf8");
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

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

try {
  verifyContracts();
  console.log("OK: verified Homepage/Issues/About/Contact/SEO text contracts in built output.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
