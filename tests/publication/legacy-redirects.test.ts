import assert from "node:assert/strict";
import test from "node:test";
import { FIXED_LEGACY_REDIRECTS, legacyRedirectTarget } from "../../src/lib/legacy-redirects";

test("fixed legacy routes resolve to the canonical public information architecture", () => {
  assert.deepEqual(FIXED_LEGACY_REDIRECTS, {
    "/categories/": "/fields/",
    "/categories/economic-growth/": "/fields/",
    "/categories/io-and-strategy/": "/fields/industrial-organization/",
    "/categories/public-and-policy/": "/fields/public-economics/",
    "/graduate-assistants/": "/editorial-board/#junior-editors",
    "/our/": "/for-authors/",
  });
});

test("controlled legacy category slugs resolve directly to research fields", () => {
  assert.equal(
    legacyRedirectTarget("/categories/labor-and-demography/"),
    "/fields/labor-economics-and-demography/",
  );
  assert.equal(legacyRedirectTarget("/categories/finance"), "/fields/financial-economics/");
  assert.equal(
    legacyRedirectTarget("/categories/macroeconomics/", new Set(["/fields/financial-economics/"])),
    "/fields/",
  );
});

test("unknown or URL-like input never becomes an open redirect", () => {
  assert.equal(legacyRedirectTarget("/categories/not-a-field/"), null);
  assert.equal(legacyRedirectTarget("https://example.com/categories/finance/"), null);
  assert.equal(legacyRedirectTarget("/our/?next=https://example.com"), null);
});
