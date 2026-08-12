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
      "Spring 2026",
      "7 papers",
      "Browse Issue",
      "View all issues",
      "News and Events",
      "The working paper series is live",
      "Four semester issues released",
      "The first 15 papers are available across Spring 2024, Spring 2025, Fall 2025, and Spring 2026.",
      "Browse by Category",
      "Explore Topic Areas",
      "Applied Microeconomics",
      "What This Series Is",
      "Read full about",
    ],
    absentTexts: [
      '<ol class="home-featured-list"> <li class="muted">Papers for this issue will be posted soon.</li> </ol>',
      '<p class="home-issue-meta">0 papers</p>',
      "Upcoming Issue, Spring 2026",
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
    absentTexts: [
      "Coming soon",
      "Papers for this issue will be posted soon.",
      "No papers available yet",
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
      "Junior Editors",
      "View all Junior Editors",
      "Get Involved",
      "Professor Djeto Assané, Ph.D.",
      "Professor Eric Chiang, Ph.D.",
      "Mark Jayson Farol, M.A.",
      "Brandon Penticoff",
    ],
    absentTexts: [
      "Graduate Assistants",
      "View all Graduate Assistants",
    ],
  },
  {
    file: "dist/graduate-assistants/index.html",
    texts: [
      "Junior Editors",
      "Junior editors help prepare papers",
      "Brandon Penticoff",
      "Spring 2026",
    ],
    absentTexts: [
      "Graduate Assistants",
      "Graduate Assistant",
    ],
  },
  {
    file: "dist/issues/index.html",
    texts: [
      "Issues",
      "Search papers",
      "Latest issue:",
      "Spring 2026",
      "Fall 2025",
      "All years",
      "All categories",
      "7 papers",
      "Legacy Archive",
    ],
    absentTexts: [
      "Coming soon",
      "Issue listings will be posted soon.",
      "0 papers • 0 categories",
      "Uncategorized",
    ],
  },
  {
    file: "dist/papers/index.html",
    texts: [
      '<link rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu/papers/">',
      "Working Papers",
      "Search open-access undergraduate economics research",
      "15",
      "Open-access papers",
      "9",
      "Research categories",
      "Browse all working papers",
      "All categories",
      "All semesters",
      "Fall 2025",
      "Hedonics of Used Car Attributes on Market Price",
      "View the OASIS collection",
    ],
    absentTexts: [
      "No current-series papers are available yet",
      "Date not provided",
    ],
  },
  {
    file: "dist/papers/hedonics-used-car-attributes/index.html",
    texts: [
      "Hedonics of Used Car Attributes on Market Price",
      "Alexander Bent, Jason Gutierrez",
      "Fall 2025",
      "Abstract",
      "Publication details",
      "Applied Microeconomics",
      "Volume 3, Issue 1",
      "May 21, 2026",
      "10.34917/40601193",
      "Cite this paper",
      "OASIS repository",
      "APA 7th",
      "MLA 9th",
      "Chicago 17th (author-date)",
      "Preserved by UNLV Libraries",
      "Official OASIS record",
    ],
    absentTexts: [
      "Advisor</dt><dd>Not provided",
      "PDF Preview",
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
      "<loc>https://econ-undergrad-wps.sites.unlv.edu/issues/2025-fall/</loc>",
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
  console.log("OK: verified Homepage/Issues/Papers/About/Contact/SEO text contracts in built output.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
