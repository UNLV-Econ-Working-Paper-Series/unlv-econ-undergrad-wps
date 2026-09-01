import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CATALOG_FILTER_STATE,
  MAX_CATALOG_QUERY_LENGTH,
  formatCatalogResultCount,
  formatPaperCount,
  parseCatalogFilterState,
  serializeCatalogFilterState,
} from "../../src/lib/publication/index";

const options = {
  fields: ["financial-economics", "labor-economics-and-demography"],
  issues: ["2026-spring", "2025-fall"],
} as const;

test("parses valid catalog filters and normalizes user-entered whitespace", () => {
  assert.deepEqual(
    parseCatalogFilterState(
      "?q=%20bank%20%20failures%20&field=FINANCIAL-ECONOMICS&issue=2026-SPRING&sort=TITLE",
      options,
    ),
    {
      q: "bank failures",
      field: "financial-economics",
      issue: "2026-spring",
      sort: "title",
    },
  );
});

test("ignores unknown, duplicate, generic term, and generic year parameters", () => {
  assert.deepEqual(
    parseCatalogFilterState(
      "q=bank&q=wages&field=not-a-field&issue=2024-winter&sort=random&term=fall&year=2025&extra=x",
      options,
    ),
    DEFAULT_CATALOG_FILTER_STATE,
  );
});

test("bounds free-text query state without splitting Unicode code points", () => {
  const query = `${"a".repeat(MAX_CATALOG_QUERY_LENGTH)}😀extra`;
  const state = parseCatalogFilterState(new URLSearchParams({ q: query }), options);

  assert.equal([...state.q].length, MAX_CATALOG_QUERY_LENGTH);
  assert.equal(state.q, "a".repeat(MAX_CATALOG_QUERY_LENGTH));
});

test("serializes only canonical state in a deterministic parameter order", () => {
  assert.equal(
    serializeCatalogFilterState(
      {
        sort: "oldest",
        issue: "2025-FALL",
        q: "  wage   gap ",
        field: "LABOR-ECONOMICS-AND-DEMOGRAPHY",
      },
      options,
    ),
    "q=wage+gap&field=labor-economics-and-demography&issue=2025-fall&sort=oldest",
  );
});

test("omits defaults and invalid state when serializing", () => {
  assert.equal(serializeCatalogFilterState(DEFAULT_CATALOG_FILTER_STATE, options), "");
  assert.equal(
    serializeCatalogFilterState(
      { q: "\u0000  ", field: "unknown", issue: "unknown", sort: "invalid" as "newest" },
      options,
    ),
    "",
  );
});

test("round-trips canonical catalog filter state", () => {
  const original = {
    q: "college costs",
    field: "financial-economics",
    issue: "2026-spring",
    sort: "oldest",
  } as const;
  const serialized = serializeCatalogFilterState(original, options);

  assert.deepEqual(parseCatalogFilterState(serialized, options), original);
});

test("formats paper counts with correct singular and plural grammar", () => {
  assert.equal(formatPaperCount(0), "0 papers");
  assert.equal(formatPaperCount(1), "1 paper");
  assert.equal(formatPaperCount(2), "2 papers");
  assert.equal(formatCatalogResultCount(1), "Showing 1 paper");
  assert.equal(formatCatalogResultCount(15), "Showing 15 papers");
  assert.throws(() => formatPaperCount(-1), /non-negative safe integer/u);
  assert.throws(() => formatPaperCount(1.5), /non-negative safe integer/u);
});
