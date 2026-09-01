import assert from "node:assert/strict";
import test from "node:test";
import {
  assertUniqueSeriesIdentifiers,
  authorMachineMetadata,
  citationYear,
  formatAuthorDisplay,
  formatIsoDate,
  formatSeriesIdentifier,
  isOasisUrl,
  isSeriesIdentifier,
  issueLabel,
  issuePublicationDate,
  mapResearchField,
  normalizeDoi,
  normalizeIsoDate,
  normalizeOasisUrl,
  normalizePaperTitle,
  parsePersonName,
  researchFieldSlug,
  volumeIssueLabel,
} from "../../src/lib/publication/index";
import { publicationFixture } from "./fixtures";

test("normalizes legacy titles without damaging apostrophes or Unicode", () => {
  assert.equal(normalizePaperTitle("  Paper 7:  María's  Wage Study  "), "María's Wage Study");
  assert.equal(normalizePaperTitle("Paper Trails: Evidence"), "Paper Trails: Evidence");
  assert.throws(() => normalizePaperTitle("   "), /must not be empty/u);
});

test("formats and exposes structured author metadata", () => {
  const record = publicationFixture();
  assert.equal(formatAuthorDisplay(record.authors), "María O'Connor and Djeto Assané");
  assert.deepEqual(parsePersonName("María O'Connor"), {
    given: "María",
    family: "O'Connor",
  });
  assert.deepEqual(parsePersonName("Ludwig van Beethoven"), {
    given: "Ludwig",
    family: "van Beethoven",
  });
  assert.deepEqual(authorMachineMetadata(record.authors)[1], { name: "Djeto Assané" });
  assert.throws(() => formatAuthorDisplay([]), /At least one author/u);
});

test("maps only controlled research fields and explicit aliases", () => {
  assert.equal(mapResearchField("Finance"), "Financial Economics");
  assert.equal(mapResearchField("industrial organization (IO) & strategy"), "Industrial Organization");
  assert.equal(mapResearchField("Environmental and Resource"), "Environmental and Resource Economics");
  assert.equal(researchFieldSlug("Labor Economics and Demography"), "labor-economics-and-demography");
  assert.throws(() => mapResearchField("Sports and Vibes"), /Unknown research field/u);
});

test("formats issue labels without treating a term as a release date", () => {
  const record = publicationFixture();
  assert.equal(issueLabel(record.issue_term, record.issue_slug), "Fall 2025");
  assert.equal(issueLabel("", "2025-fall"), "Fall 2025");
  assert.equal(issuePublicationDate(record), null);
  assert.equal(volumeIssueLabel(2, 2), "Volume 2, Issue 2");
  assert.throws(() => volumeIssueLabel(0, 2), /positive integer/u);
});

test("validates real ISO dates and uses an explicit fallback only for missing values", () => {
  assert.equal(normalizeIsoDate("2024-02-29"), "2024-02-29");
  assert.equal(formatIsoDate("2026-05-21"), "May 21, 2026");
  assert.equal(formatIsoDate(undefined), "Date not available");
  assert.equal(citationYear(publicationFixture()), "2025");
  assert.throws(() => normalizeIsoDate("2025-02-29"), /valid calendar date/u);
  assert.throws(() => normalizeIsoDate("Fall 2025"), /YYYY-MM-DD/u);
});

test("validates stable Series numbers and rejects collisions", () => {
  assert.equal(formatSeriesIdentifier(2026, 4), "UNLV-Econ-WPS-2026-004");
  assert.equal(isSeriesIdentifier("UNLV-Econ-WPS-2026-004"), true);
  assert.equal(isSeriesIdentifier("UNLV-Econ-WPS-2026-000"), false);
  assert.doesNotThrow(() =>
    assertUniqueSeriesIdentifiers(["UNLV-Econ-WPS-2026-004", "UNLV-Econ-WPS-2026-005"]),
  );
  assert.throws(
    () => assertUniqueSeriesIdentifiers(["UNLV-Econ-WPS-2026-004", "UNLV-Econ-WPS-2026-004"]),
    /Duplicate Series identifier/u,
  );
  assert.throws(() => formatSeriesIdentifier(2026, 1000), /between 1 and 999/u);
});

test("normalizes DOI values and canonical OAsis casing", () => {
  assert.equal(normalizeDoi("HTTPS://DOI.ORG/10.9741%2F2578-3170.1004"), "10.9741/2578-3170.1004");
  assert.equal(
    normalizeOasisUrl("HTTP://OASIS.LIBRARY.UNLV.EDU/ECON_UG_PAPERS/4?source=x#record"),
    "https://oasis.library.unlv.edu/econ_ug_papers/4/",
  );
  assert.equal(isOasisUrl("https://oasis.library.unlv.edu/econ_ug_papers/4/"), true);
  assert.equal(isOasisUrl("https://example.com/econ_ug_papers/4/"), false);
  assert.throws(() => normalizeDoi("not a DOI"), /Invalid DOI/u);
  assert.throws(() => normalizeOasisUrl("https://example.com/4/"), /must use oasis.library.unlv.edu/u);
});
