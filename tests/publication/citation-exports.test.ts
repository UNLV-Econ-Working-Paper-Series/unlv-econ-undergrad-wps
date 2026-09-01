import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCitationOptions,
  escapeBibTeX,
  escapeRis,
  generateBibTeX,
  generateRis,
} from "../../src/lib/publication/index";
import { minimalPublicationFixture, publicationFixture } from "./fixtures";

test("generates repository, APA, MLA, and Chicago citations for multiple Unicode authors", () => {
  const citations = buildCitationOptions(publicationFixture());
  assert.deepEqual(citations.map((item) => item.id), ["repository", "apa", "mla", "chicago"]);
  for (const option of citations) {
    assert.match(option.citation, /María|M\./u);
    assert.match(option.citation, /Assané/u);
    assert.match(option.citation, /10\.9741\/2578-3170\.1004/u);
    assert.match(option.citation, /UNLV-Econ-WPS-2025-004/u);
  }
  assert.match(citations.find((item) => item.id === "apa")?.citation ?? "", /O'Connor, M\., & Assané, D\./u);
  assert.match(citations.find((item) => item.id === "mla")?.citation ?? "", /O'Connor, María, and Djeto Assané/u);
});

test("escapes BibTeX special characters once while retaining Unicode and apostrophes", () => {
  const bibtex = generateBibTeX(publicationFixture());
  assert.match(bibtex, /^@techreport\{UNLVEconWPS2025004,/u);
  assert.match(bibtex, /title = \{\{María's Wages \\& AI\\_Models: Evidence from a 50\\% Sample\}\}/u);
  assert.match(bibtex, /author = \{María O'Connor and Djeto Assané\}/u);
  assert.match(bibtex, /doi = \{10\.9741\/2578-3170\.1004\}/u);
  assert.match(bibtex, /year = \{2025\}/u);
  assert.match(bibtex, /date = \{2025-12-15\}/u);
  assert.equal(escapeBibTeX("A&B_50%"), "A\\&B\\_50\\%");
});

test("RIS remains line-safe and emits repeated authors", () => {
  const record = publicationFixture();
  record.title = "A study\nER  - injected";
  const ris = generateRis(record);
  assert.equal(ris.match(/^AU  - /gmu)?.length, 2);
  assert.equal(ris.match(/^ER  -$/gmu)?.length, 1);
  assert.doesNotMatch(ris, /\nER  - injected/u);
  assert.match(ris, /TI  - A study ER - injected/u);
  assert.match(ris, /^PY  - 2025$/mu);
  assert.match(ris, /^DA  - 2025\/12\/15$/mu);
  assert.equal(escapeRis("one\r\ntwo"), "one two");
});

test("citation exports omit missing optional DOI, pages, and version notes", () => {
  const record = minimalPublicationFixture();
  const bibtex = generateBibTeX(record);
  const ris = generateRis(record);
  assert.doesNotMatch(bibtex, /\n  doi =/u);
  assert.doesNotMatch(bibtex, /\n  pages =/u);
  assert.doesNotMatch(bibtex, /\n  note =/u);
  assert.doesNotMatch(ris, /^DO  -/gmu);
  assert.doesNotMatch(ris, /^SP  -/gmu);
  assert.doesNotMatch(ris, /^N1  -/gmu);
  assert.match(ris, /UR  - https:\/\/oasis\.library\.unlv\.edu\/econ_ug_papers\/4\//u);
});
