import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type PageContract = {
  file: string;
  texts: string[];
};

const pageContracts: PageContract[] = [
  {
    file: "dist/index.html",
    texts: [
      "UNLV Undergraduate Economics Working Paper Series",
      "Official archive for undergraduate economics working papers at UNLV",
      "Published by semester issue",
      "Latest Issue",
      "Latest Semester Release",
      "View all issues",
      "News and Events",
      "Browse by Category",
      "Explore Topic Areas",
      "What This Series Is",
      "Read full about",
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
    file: "dist/contact/index.html",
    texts: [
      "Contact",
      "Who are you trying to reach?",
      "Series Team",
      "Department of Economics",
      "Email Series Team",
      "Call Office",
      "Common Requests",
      "Directions",
      "Open in Google Maps",
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
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}

try {
  verifyContracts();
  console.log("OK: verified Homepage/About/Contact text contracts in built HTML.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
