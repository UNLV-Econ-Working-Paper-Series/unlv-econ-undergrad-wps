import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type PageContract = {
  path: string;
  required: string[];
  absent?: string[];
};

const pageContracts: PageContract[] = [
  {
    path: "dist/fields/index.html",
    required: ["Research Fields", "Fields represented in the Series", "Applied Microeconomics"],
    absent: ["No current-series categories"],
  },
  {
    path: "dist/for-authors/index.html",
    required: [
      "For Student Authors",
      "Who may submit",
      "Faculty sponsorship",
      "does not currently accept unsupported direct submissions",
      "Submission packet",
      "Editorial screening",
      "Rights and permissions",
      "AI-use disclosure",
      "Data and code availability",
      "Accessibility requirements",
      "four to six weeks",
      "not a publication guarantee",
      "Spectra",
    ],
    absent: ["automatically permits"],
  },
  {
    path: "dist/editorial-board/index.html",
    required: [
      "Editorial Board",
      "Voting Editorial Board",
      "Managing Editor and Series Organizer",
      "Faculty Editor",
      "Mark Jayson Martinez Farol",
      "Djeto Assané",
      "Eric Chiang",
      "Junior Editors",
      "Brandon Penticoff",
      "Non-voting",
    ],
    absent: ["Editorial Lead", "Co-Editor", "Graduate Assistants"],
  },
  {
    path: "dist/history/index.html",
    required: [
      "History and Acknowledgments",
      "Economics Hub",
      "Mark Jayson Martinez Farol",
      "OAsis",
      "This bounded history is supported by",
    ],
    absent: ["Founding Technical Editor"],
  },
  {
    path: "dist/about/index.html",
    required: [
      "About the Series",
      "Molasky Family Department of Economics and Real Estate",
      "not peer reviewed",
      "Editorial Board",
      "For Student Authors",
      "OAsis",
    ],
    absent: ["At a Glance", "View all Junior Editors"],
  },
  {
    path: "dist/contact/index.html",
    required: [
      "Series submissions",
      "Corrections and revised files",
      "Rights and permissions",
      "Accessibility",
      "Takedown or privacy concerns",
      "Technical problems",
      "OAsis record or DOI questions",
      "records-retention requirements",
      "public records under Nevada law",
    ],
  },
  {
    path: "dist/policies/index.html",
    required: [
      "Editorial Governance",
      "Conflicts of Interest and Recusal",
      "AI-Assisted Work",
      "Human Subjects",
      "Data and Code Availability",
      "Expressions of Concern and Withdrawals",
      "Appeals",
    ],
  },
];

const redirectContracts = [
  { path: "dist/categories/index.html", target: "/fields/", canonical: "/fields/" },
  {
    path: "dist/categories/io-and-strategy/index.html",
    target: "/fields/industrial-organization/",
    canonical: "/fields/industrial-organization/",
  },
  {
    path: "dist/categories/public-and-policy/index.html",
    target: "/fields/public-economics/",
    canonical: "/fields/public-economics/",
  },
  { path: "dist/our/index.html", target: "/for-authors/", canonical: "/for-authors/" },
  {
    path: "dist/graduate-assistants/index.html",
    target: "/editorial-board/#junior-editors",
    canonical: "/editorial-board/",
  },
] as const;

function read(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing required public route output: ${relativePath}`);
  return fs.readFileSync(absolutePath, "utf8");
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(?:x27|39);|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const failures: string[] = [];

for (const contract of pageContracts) {
  try {
    const text = visibleText(read(contract.path));
    for (const required of contract.required) {
      if (!text.includes(required)) failures.push(`${contract.path} is missing ${JSON.stringify(required)}.`);
    }
    for (const absent of contract.absent ?? []) {
      if (text.includes(absent))
        failures.push(`${contract.path} contains obsolete copy ${JSON.stringify(absent)}.`);
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

for (const contract of redirectContracts) {
  try {
    const html = read(contract.path);
    if (!html.includes(`http-equiv="refresh" content="0;url=${contract.target}"`)) {
      failures.push(`${contract.path} does not refresh to ${contract.target}.`);
    }
    if (
      !html.includes(`rel="canonical" href="https://econ-undergrad-wps.sites.unlv.edu${contract.canonical}`)
    ) {
      failures.push(`${contract.path} does not canonicalize to ${contract.canonical}.`);
    }
    if (!html.includes('name="robots" content="noindex, follow"')) {
      failures.push(`${contract.path} must be noindex, follow.`);
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

try {
  const homeHtml = read("dist/index.html");
  const expected = [
    ["/", "Home"],
    ["/papers/", "Working Papers"],
    ["/issues/", "Issues"],
    ["/fields/", "Research Fields"],
    ["/for-authors/", "For Student Authors"],
    ["/about/", "About"],
  ];

  const primaryNavigations = [
    ...homeHtml.matchAll(
      /<nav class="[^"]*\bsite-nav\b[^"]*" aria-label="Primary navigation">([\s\S]*?)<\/nav>/gi,
    ),
  ];

  if (primaryNavigations.length !== 2) {
    failures.push(
      `Expected responsive desktop and mobile primary navigations; found ${primaryNavigations.length}.`,
    );
  }

  for (const [index, navigation] of primaryNavigations.entries()) {
    const navPairs = [...navigation[1].matchAll(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(
      (match) => [match[1], visibleText(match[2])],
    );
    if (JSON.stringify(navPairs) !== JSON.stringify(expected)) {
      failures.push(`Primary navigation ${index + 1} mismatch: ${JSON.stringify(navPairs)}.`);
    }
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

try {
  const sitemap = read("dist/sitemap.xml");
  for (const route of [
    "/fields/",
    "/for-authors/",
    "/editorial-board/",
    "/history/",
    "/policies/",
    "/contact/",
  ]) {
    if (!sitemap.includes(`https://econ-undergrad-wps.sites.unlv.edu${route}`)) {
      failures.push(`Sitemap is missing canonical route ${route}.`);
    }
  }
  for (const legacy of ["/categories/", "/our/", "/graduate-assistants/"]) {
    if (sitemap.includes(`<loc>https://econ-undergrad-wps.sites.unlv.edu${legacy}</loc>`)) {
      failures.push(`Sitemap includes redirect-only route ${legacy}.`);
    }
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  console.error(
    `ERROR: public IA verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  "OK: verified canonical public routes, navigation, content contracts, redirects, and sitemap membership.",
);
