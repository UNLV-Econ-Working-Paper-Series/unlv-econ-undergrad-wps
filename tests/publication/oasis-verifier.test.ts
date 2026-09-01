import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRecordOutcome,
  parseOasisMetadata,
  requestWithRetry,
  validateDoiSyntax,
} from "../../scripts/verify-oasis-records";

test("parses the selected public OAsis metadata without treating disciplines as a local field", () => {
  const html = `
    <meta name="description" content="A verified abstract &amp; result.">
    <meta name="keywords" content="Labor; Wages">
    <meta name="bepress_citation_author" content="Lopez Ibarra, Hannah">
    <meta name="bepress_citation_author" content="Rozbitskyy, Roman">
    <meta name="bepress_citation_title" content="A Paper">
    <meta name="bepress_citation_firstpage" content="1">
    <meta name="bepress_citation_volume" content="3">
    <meta name="bepress_citation_issue" content="2">
    <meta name="bepress_citation_pdf_url" content="https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1012&amp;context=econ_ug_papers">
    <meta name="bepress_citation_abstract_html_url" content="https://oasis.library.unlv.edu/econ_ug_papers/13">
    <meta name="bepress_citation_doi" content="10.34917/40601202">
    <meta name="bepress_citation_online_date" content="2026/8/5">
    <div id="publication_date"><h2>Publication Date</h2><p>5-21-2026</p></div>
    <div id="lpage"><h2>Last page number</h2><p>8</p></div>
    <div id="bp_categories"><h2>Disciplines</h2><p>Decision Science | Economics</p></div>
    <div id="rights"><h2>Rights</h2><p>IN COPYRIGHT. More information follows.</p></div>
  `;

  assert.deepEqual(parseOasisMetadata(html), {
    title: "A Paper",
    authors: ["Hannah Lopez Ibarra", "Roman Rozbitskyy"],
    abstract: "A verified abstract & result.",
    keywords: ["Labor", "Wages"],
    disciplines: ["Decision Science", "Economics"],
    doi: "10.34917/40601202",
    item_url: "https://oasis.library.unlv.edu/econ_ug_papers/13",
    pdf_url: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1012&context=econ_ug_papers",
    online_date: "2026-08-05",
    citable_date: "2026-05-21",
    volume: 3,
    issue_number: 2,
    pages: "1-8",
    rights_statement: "IN COPYRIGHT. More information follows.",
    repository_citation: undefined,
  });
});

test("DOI validation is deterministic", () => {
  assert.equal(validateDoiSyntax("10.34917/40601202"), true);
  assert.equal(validateDoiSyntax("https://doi.org/10.34917%2F40601202"), true);
  assert.equal(validateDoiSyntax("40601202"), false);
});

test("bounded transport retries a transient HTTP response and then succeeds", async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    return calls === 1
      ? new Response("retry", { status: 503 })
      : new Response("ok", { status: 200 });
  };

  const result = await requestWithRetry("https://oasis.library.unlv.edu/econ_ug_papers/1", {
    timeoutMs: 1_000,
    maxAttempts: 2,
    fetchImpl,
    waitImpl: async () => undefined,
    readBody: "text",
  });

  assert.equal(calls, 2);
  assert.equal(result.transport.status, "verified");
  assert.equal(result.transport.attempts, 2);
  assert.equal(result.body, "ok");
});

test("network failure remains distinct from metadata mismatch", async () => {
  const result = await requestWithRetry("https://oasis.library.unlv.edu/econ_ug_papers/1", {
    timeoutMs: 1_000,
    maxAttempts: 2,
    fetchImpl: async () => {
      throw new TypeError("DNS unavailable");
    },
    waitImpl: async () => undefined,
  });

  assert.equal(result.transport.status, "network_failure");
  assert.equal(result.transport.attempts, 2);
  assert.equal(classifyRecordOutcome({
    doiSyntaxValid: true,
    comparisons: [],
    transports: [result.transport],
  }), "network_failure");
  assert.equal(classifyRecordOutcome({
    doiSyntaxValid: true,
    comparisons: [{ field: "title", status: "mismatch", local: "A", remote: "B" }],
    transports: [],
  }), "mismatch");
});
