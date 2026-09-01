import assert from "node:assert/strict";
import test from "node:test";
import { paperSchema } from "../../src/content/paper-schema";
import { historicalPublicationFixture, publicationFixture } from "./fixtures";

function validRecord() {
  const record = publicationFixture();
  record.oasis_url = record.current_version.oasis_url;
  record.pdf_url = record.current_version.pdf_url;
  record.doi = "10.9741/2578-3170.1004";
  return record;
}

test("accepts a structured current paper without fabricated optional metadata", () => {
  const record = validRecord();
  record.faculty_sponsor = undefined;
  record.issue_published_at = undefined;
  record.previous_versions = [];
  assert.equal(paperSchema.safeParse(record).success, true);
});

test("accepts bounded historical provenance and structured version history", () => {
  const record = historicalPublicationFixture();
  record.oasis_url = record.current_version.oasis_url;
  record.pdf_url = record.current_version.pdf_url;
  assert.equal(paperSchema.safeParse(record).success, true);
});

test("rejects the deprecated flat paper schema", () => {
  const record = validRecord();
  const legacy = {
    ...record,
    authors: record.authors.map((author) => author.name),
    semester: record.issue_term,
    category: record.field,
    issue: record.issue_number,
    published_at: record.citable_published_at,
    pdf: record.pdf_url,
  };
  assert.equal(paperSchema.safeParse(legacy).success, false);
});

test("rejects private consent evidence from the public paper record", () => {
  const record = {
    ...validRecord(),
    consent_evidence: {
      student_email: "student@example.edu",
      approved_at: "2026-05-21",
    },
  };

  assert.equal(paperSchema.safeParse(record).success, false);
});

test("rejects uncontrolled fields, invalid dates, and mismatched Series years", () => {
  const uncontrolled = { ...validRecord(), field: "Sports and Vibes" };
  assert.equal(paperSchema.safeParse(uncontrolled).success, false);

  const fabricatedIssueDate = { ...validRecord(), issue_published_at: "Fall 2025" };
  assert.equal(paperSchema.safeParse(fabricatedIssueDate).success, false);

  const wrongYear = { ...validRecord(), series_number: "UNLV-Econ-WPS-2026-004" };
  assert.equal(paperSchema.safeParse(wrongYear).success, false);
});

test("rejects current-version URL drift and future-dated previous versions", () => {
  const oasisDrift = validRecord();
  oasisDrift.current_version.oasis_url = "https://oasis.library.unlv.edu/econ_ug_papers/999";
  assert.equal(paperSchema.safeParse(oasisDrift).success, false);

  const versionDrift = validRecord();
  versionDrift.previous_versions[0].published_at = "2027-01-01";
  assert.equal(paperSchema.safeParse(versionDrift).success, false);
});
