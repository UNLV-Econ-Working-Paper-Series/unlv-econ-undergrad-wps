import assert from "node:assert/strict";
import test from "node:test";
import {
  buildScholarlyJsonLd,
  buildScholarlyMetaTags,
  buildSearchIndexText,
  normalizeSearchText,
  serializeJsonLd,
  versionTimeline,
} from "../../src/lib/publication/index";
import { historicalPublicationFixture, minimalPublicationFixture, publicationFixture } from "./fixtures";

const CANONICAL_URL = "https://econ-undergrad-wps.sites.unlv.edu/papers/wage-study/";
const ISSUE_URL = "https://econ-undergrad-wps.sites.unlv.edu/issues/2025-fall/";

test("JSON-LD exposes structured scholarly data without a fabricated publisher", () => {
  const json = buildScholarlyJsonLd(publicationFixture(), {
    canonicalUrl: CANONICAL_URL,
    issueUrl: ISSUE_URL,
  });
  assert.equal(json["@type"], "ScholarlyArticle");
  assert.equal(json.datePublished, "2025-12-15");
  assert.equal(json.dateModified, "2026-08-05");
  assert.equal(json.publisher, undefined);
  assert.equal(json.name, "María's Wages & ML_Models: Evidence from a 50% Sample");
  assert.equal(json.abstract, "This paper estimates wage differences using a transparent specification.");
  assert.deepEqual(json.mainEntityOfPage, { "@type": "WebPage", "@id": CANONICAL_URL });
  assert.equal((json.isPartOf as Record<string, unknown>)["@id"], ISSUE_URL);
  assert.deepEqual(json.encoding, {
    "@type": "MediaObject",
    contentUrl: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1004&context=econ_ug_papers",
    encodingFormat: "application/pdf",
  });
  assert.equal(json.copyrightHolder, "María O'Connor and Djeto Assané");
  assert.equal((json.author as Array<Record<string, unknown>>).length, 2);
  assert.deepEqual(json.sameAs, [
    "https://oasis.library.unlv.edu/econ_ug_papers/4/",
    "https://doi.org/10.9741/2578-3170.1004",
  ]);
});

test("scholarly meta repeats authors and omits unapproved cross-domain PDF tags", () => {
  const record = publicationFixture();
  const defaultTags = buildScholarlyMetaTags(record, {
    canonicalUrl: CANONICAL_URL,
    citationPdfUrl: record.pdf_url,
  });
  assert.equal(defaultTags.filter((tag) => tag.name === "citation_author").length, 2);
  assert.equal(
    defaultTags.some((tag) => tag.name === "citation_pdf_url"),
    false,
  );
  assert.equal(defaultTags.find((tag) => tag.name === "citation_doi")?.content, "10.9741/2578-3170.1004");
  assert.equal(defaultTags.find((tag) => tag.name === "citation_publication_date")?.content, "2025/12/15");
  assert.equal(defaultTags.find((tag) => tag.name === "citation_online_date")?.content, "2026/08/05");
  assert.equal(
    defaultTags.find((tag) => tag.name === "citation_technical_report_institution")?.content,
    "Molasky Family Department of Economics and Real Estate, University of Nevada, Las Vegas",
  );

  const sameOriginTags = buildScholarlyMetaTags(record, {
    canonicalUrl: CANONICAL_URL,
    citationPdfUrl: "https://econ-undergrad-wps.sites.unlv.edu/assets/wage-study.pdf",
  });
  assert.equal(
    sameOriginTags.find((tag) => tag.name === "citation_pdf_url")?.content,
    "https://econ-undergrad-wps.sites.unlv.edu/assets/wage-study.pdf",
  );

  const approvedCrossDomain = buildScholarlyMetaTags(record, {
    canonicalUrl: CANONICAL_URL,
    citationPdfUrl: record.pdf_url,
    allowCrossDomainPdf: true,
  });
  assert.equal(
    approvedCrossDomain.some((tag) => tag.name === "citation_pdf_url"),
    true,
  );
});

test("missing optional values are absent from JSON-LD and scholarly tags", () => {
  const record = minimalPublicationFixture();
  const json = buildScholarlyJsonLd(record, { canonicalUrl: CANONICAL_URL, issueUrl: ISSUE_URL });
  const tags = buildScholarlyMetaTags(record, { canonicalUrl: CANONICAL_URL });
  assert.equal(json.license, undefined);
  assert.equal(json.copyrightNotice, undefined);
  assert.equal((json.identifier as Array<Record<string, string>>).length, 1);
  assert.equal(
    tags.some((tag) => tag.name === "citation_doi"),
    false,
  );
  assert.equal(
    tags.some((tag) => tag.name === "citation_firstpage"),
    false,
  );
});

test("historical provenance is machine-readable and searchable without replacing current dates", () => {
  const record = historicalPublicationFixture();
  const json = buildScholarlyJsonLd(record, { canonicalUrl: CANONICAL_URL, issueUrl: ISSUE_URL });
  const search = buildSearchIndexText(record);
  assert.equal(json.datePublished, "2017-05-15");
  assert.equal(json.dateModified, "2026-08-31");
  assert.equal(json.dateCreated, "2017-05-15");
  assert.equal(json.isBasedOn, "https://economics-hub.example.edu/papers/employment-patterns/");
  assert.match(search, /unlv economics hub/u);
  assert.match(search, /spring 2017/u);
  assert.equal(normalizeSearchText("Assané O'Connor"), "assane o connor");
});

test("version timeline distinguishes current and previous versions", () => {
  const timeline = versionTimeline(publicationFixture());
  assert.equal(timeline[0].label, "Version 2");
  assert.equal(timeline[0].status, "current");
  assert.equal(timeline[1].label, "Version 1");
  assert.equal(timeline[1].status, "corrected");
  assert.equal(versionTimeline(minimalPublicationFixture())[0].label, "Current version");
});

test("JSON-LD serialization prevents a closing-script injection", () => {
  const record = publicationFixture();
  record.abstract = "Evidence </script><script>alert('x')</script> remains text.";
  const serialized = serializeJsonLd(
    buildScholarlyJsonLd(record, {
      canonicalUrl: CANONICAL_URL,
      issueUrl: ISSUE_URL,
    }),
  );
  assert.doesNotMatch(serialized, /<\/script/iu);
  assert.match(serialized, /\\u003c\/script>/u);
  assert.equal(JSON.parse(serialized).abstract, record.abstract);
});

test("version validation rejects duplicate labels and a previous version after the current version", () => {
  const duplicate = publicationFixture();
  duplicate.current_version.label = "Version 1";
  assert.throws(() => versionTimeline(duplicate), /Duplicate version label/u);

  const future = publicationFixture();
  future.previous_versions[0].published_at = "2027-01-01";
  assert.throws(() => versionTimeline(future), /cannot postdate/u);
});
