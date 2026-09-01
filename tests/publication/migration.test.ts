import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { runPaperMetadataMigration } from "../../scripts/migrate-paper-metadata";

interface InitialRecord {
  slug: string;
  item: number;
  issueTerm: string;
  category: string;
  volume: number;
  issueNumber: number;
  citableDate: string;
  expectedSeriesNumber: string;
}

const INITIAL_RECORDS: InitialRecord[] = [
  {
    slug: "the-race-for-increasing-college-costs",
    item: 1,
    issueTerm: "Spring 2024",
    category: "Education",
    volume: 1,
    issueNumber: 1,
    citableDate: "2024-05-16",
    expectedSeriesNumber: "UNLV-Econ-WPS-2024-001",
  },
  {
    slug: "used-electric-vehicle-tax-credit",
    item: 2,
    issueTerm: "Spring 2024",
    category: "Public Economics & Policy",
    volume: 1,
    issueNumber: 1,
    citableDate: "2024-05-16",
    expectedSeriesNumber: "UNLV-Econ-WPS-2024-002",
  },
  {
    slug: "nba-real-team-value",
    item: 3,
    issueTerm: "Spring 2025",
    category: "Industrial Organization (IO) & Strategy",
    volume: 2,
    issueNumber: 1,
    citableDate: "2025-05-20",
    expectedSeriesNumber: "UNLV-Econ-WPS-2025-003",
  },
  {
    slug: "hedonics-used-car-attributes",
    item: 4,
    issueTerm: "Fall 2025",
    category: "Applied Microeconomics",
    volume: 3,
    issueNumber: 1,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-004",
  },
  {
    slug: "key-determinants-diamond-value",
    item: 5,
    issueTerm: "Fall 2025",
    category: "Applied Microeconomics",
    volume: 3,
    issueNumber: 1,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-005",
  },
  {
    slug: "rural-metropolitan-gender-wage-gap",
    item: 6,
    issueTerm: "Fall 2025",
    category: "Labor and Demography",
    volume: 3,
    issueNumber: 1,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-006",
  },
  {
    slug: "social-determinants-educational-attainment",
    item: 7,
    issueTerm: "Fall 2025",
    category: "Education",
    volume: 3,
    issueNumber: 1,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-007",
  },
  {
    slug: "ai-wage-effects-us-occupations",
    item: 8,
    issueTerm: "Fall 2025",
    category: "Labor and Demography",
    volume: 3,
    issueNumber: 1,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-008",
  },
  {
    slug: "residential-sale-prices-neighborhood-interior",
    item: 9,
    issueTerm: "Spring 2026",
    category: "Urban, Regional, & Real Estate Economics",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-009",
  },
  {
    slug: "mlb-speed-premium",
    item: 10,
    issueTerm: "Spring 2026",
    category: "Labor and Demography",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-010",
  },
  {
    slug: "nevada-mining-output-growth",
    item: 11,
    issueTerm: "Spring 2026",
    category: "Environmental and Resource",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-011",
  },
  {
    slug: "commercial-bank-failures",
    item: 12,
    issueTerm: "Spring 2026",
    category: "Finance",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-012",
  },
  {
    slug: "gambling-losses-future-wagers",
    item: 13,
    issueTerm: "Spring 2026",
    category: "Behavioral & Experimental Economics",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-013",
  },
  {
    slug: "las-vegas-casino-revenue",
    item: 14,
    issueTerm: "Spring 2026",
    category: "Industrial Organization (IO) & Strategy",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-014",
  },
  {
    slug: "march-madness-tournament-advancement",
    item: 15,
    issueTerm: "Spring 2026",
    category: "Applied Microeconomics",
    volume: 3,
    issueNumber: 2,
    citableDate: "2026-05-21",
    expectedSeriesNumber: "UNLV-Econ-WPS-2026-015",
  },
];

function issueSlug(issueTerm: string): string {
  const [term, year] = issueTerm.toLowerCase().split(" ");
  return `${year}-${term}`;
}

function legacyPaper(record: InitialRecord): string {
  const article = 999 + record.item;
  const doi = `10.34917/9000${String(record.item).padStart(4, "0")}`;
  return `---
title: ${JSON.stringify(`Migration fixture ${record.item}`)}
authors:
  - ${JSON.stringify(`Author ${record.item}`)}
semester: ${JSON.stringify(record.issueTerm)}
category: ${JSON.stringify(record.category)}
keywords:
  - "migration"
abstract: ${JSON.stringify(`Abstract preserved for record ${record.item}.`)}
pdf: ${JSON.stringify(`https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=${article}&context=econ_ug_papers`)}
issue_slug: ${JSON.stringify(issueSlug(record.issueTerm))}
oasis_url: ${JSON.stringify(`https://oasis.library.unlv.edu/econ_ug_papers/${record.item}`)}
doi: ${JSON.stringify(doi)}
volume: ${record.volume}
issue: ${record.issueNumber}
pages: "1-10"
published_at: ${JSON.stringify(record.citableDate)}
---
`;
}

async function fixtureWorkspace(t: TestContext): Promise<{
  root: string;
  paperDirectory: string;
  reportPath: string;
}> {
  const root = await mkdtemp(join(tmpdir(), "unlv-paper-migration-"));
  const paperDirectory = join(root, "papers");
  const reportPath = join(root, "migration-report.md");
  await mkdir(paperDirectory);
  await Promise.all(
    INITIAL_RECORDS.map((record) =>
      writeFile(join(paperDirectory, `${record.slug}.md`), legacyPaper(record), "utf8"),
    ),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, paperDirectory, reportPath };
}

async function snapshot(directory: string): Promise<Record<string, string>> {
  const names = (await readdir(directory)).sort();
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [name, await readFile(join(directory, name), "utf8")] as const),
    ),
  );
}

test("dry-run validates legacy conversion without mutating source or writing a report", async (t) => {
  const fixture = await fixtureWorkspace(t);
  const before = await snapshot(fixture.paperDirectory);
  const result = await runPaperMetadataMigration({
    paperDirectory: fixture.paperDirectory,
    reportPath: fixture.reportPath,
    write: false,
  });

  assert.equal(result.state, "legacy");
  assert.equal(result.recordCount, 15);
  assert.equal(result.changedFileCount, 15);
  assert.deepEqual(await snapshot(fixture.paperDirectory), before);
  assert.equal(existsSync(fixture.reportPath), false);
});

test("write converts legacy records in permanent global order and is idempotent", async (t) => {
  const fixture = await fixtureWorkspace(t);
  const first = await runPaperMetadataMigration({
    paperDirectory: fixture.paperDirectory,
    reportPath: fixture.reportPath,
    write: true,
  });
  assert.equal(first.state, "legacy");
  assert.equal(first.changedFileCount, 15);

  for (const record of INITIAL_RECORDS) {
    const source = await readFile(join(fixture.paperDirectory, `${record.slug}.md`), "utf8");
    const metadata = parseFrontmatter(source).frontmatter;
    assert.deepEqual(metadata.authors, [{ name: `Author ${record.item}` }]);
    assert.equal(metadata.series_number, record.expectedSeriesNumber);
    assert.equal(metadata.citable_published_at, record.citableDate);
    assert.equal(metadata.repository_published_at, "2026-08-05");
    assert.equal(metadata.current_version.published_at, "2026-08-05");
    assert.equal(metadata.issue_published_at, undefined);
    assert.equal(metadata.faculty_sponsor, undefined);
    for (const deprecated of ["semester", "category", "advisor", "pdf", "issue", "published_at"]) {
      assert.equal(Object.hasOwn(metadata, deprecated), false);
    }
  }

  assert.equal(
    parseFrontmatter(await readFile(join(fixture.paperDirectory, "nba-real-team-value.md"), "utf8"))
      .frontmatter.series_number,
    "UNLV-Econ-WPS-2025-003",
  );
  assert.equal(
    parseFrontmatter(await readFile(join(fixture.paperDirectory, "hedonics-used-car-attributes.md"), "utf8"))
      .frontmatter.series_number,
    "UNLV-Econ-WPS-2026-004",
  );

  const afterFirstWrite = await snapshot(fixture.paperDirectory);
  const reportAfterFirstWrite = await readFile(fixture.reportPath, "utf8");
  const second = await runPaperMetadataMigration({
    paperDirectory: fixture.paperDirectory,
    reportPath: fixture.reportPath,
    write: true,
  });
  assert.equal(second.state, "structured");
  assert.equal(second.changedFileCount, 0);
  assert.deepEqual(await snapshot(fixture.paperDirectory), afterFirstWrite);
  assert.equal(await readFile(fixture.reportPath, "utf8"), reportAfterFirstWrite);
});

test("structured validation rejects a reused global Series suffix across years", async (t) => {
  const fixture = await fixtureWorkspace(t);
  await runPaperMetadataMigration({
    paperDirectory: fixture.paperDirectory,
    reportPath: fixture.reportPath,
    write: true,
  });

  const initial = await readFile(
    join(fixture.paperDirectory, "the-race-for-increasing-college-costs.md"),
    "utf8",
  );
  const future = initial
    .replace('title: "Migration fixture 1"', 'title: "Future collision fixture"')
    .replaceAll("UNLV-Econ-WPS-2024-001", "UNLV-Econ-WPS-2027-001")
    .replaceAll("2024-05-16", "2027-05-16")
    .replaceAll('/econ_ug_papers/1"', '/econ_ug_papers/16"')
    .replaceAll("article=1000", "article=1015")
    .replaceAll("10.34917/90000001", "10.34917/90000016");
  await writeFile(join(fixture.paperDirectory, "future-collision-fixture.md"), future, "utf8");

  await assert.rejects(
    runPaperMetadataMigration({
      paperDirectory: fixture.paperDirectory,
      reportPath: fixture.reportPath,
      write: false,
    }),
    /series_number suffix collides/u,
  );
});

test("legacy conversion rejects a missing required field", async (t) => {
  const fixture = await fixtureWorkspace(t);
  const filePath = join(fixture.paperDirectory, "ai-wage-effects-us-occupations.md");
  const source = await readFile(filePath, "utf8");
  await writeFile(filePath, source.replace(/^abstract:.*\n/mu, ""), "utf8");

  await assert.rejects(
    runPaperMetadataMigration({
      paperDirectory: fixture.paperDirectory,
      reportPath: fixture.reportPath,
      write: false,
    }),
    /missing non-empty string field abstract/u,
  );
});
