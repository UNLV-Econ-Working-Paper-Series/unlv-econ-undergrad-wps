import { expect, test } from "@playwright/test";

const paperPath = "/papers/hedonics-used-car-attributes/";

test("homepage foregrounds the Series and performs a catalog search", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Working Paper Series/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Latest Issue" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Research Fields" })).toBeVisible();
  await page.getByLabel("Search by title, author, keyword, or topic").fill("bank");
  await page.getByRole("button", { name: "Search Working Papers" }).click();
  await expect(page).toHaveURL(/\/papers\/\?q=bank$/u);
  await expect(page.locator("#paper-result-count")).toHaveText("Showing 1 paper");
});

test("catalog URL state, history, counts, and clear controls remain synchronized", async ({ page }) => {
  await page.goto("/papers/?q=bank");
  const catalogSearch = page.getByRole("searchbox", { name: "Search", exact: true });
  await expect(catalogSearch).toHaveValue("bank");
  await expect(page.locator("#paper-result-count")).toHaveText("Showing 1 paper");

  await page.getByLabel("Research Field").selectOption("financial-economics");
  await expect(page).toHaveURL(/field=financial-economics/u);
  await page.getByLabel("Issue").selectOption("2026-spring");
  await expect(page).toHaveURL(/issue=2026-spring/u);

  await page.goBack();
  await expect(page.getByLabel("Issue")).toHaveValue("");
  await page.goBack();
  await expect(page.getByLabel("Research Field")).toHaveValue("");

  await catalogSearch.fill("no result phrase xyz");
  await expect(page.getByText("No working papers match these filters")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("#paper-result-count")).toHaveText("Showing 15 papers");
  await expect(page).toHaveURL(/\/papers\/?$/u);
});

test("paper detail exposes permanent records, citations, and closed secondary disclosure", async ({
  page,
}) => {
  await page.goto(paperPath);
  await expect(
    page.getByRole("heading", { level: 1, name: "Hedonics of Used Car Attributes on Market Price" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Permanent OAsis record" })).toHaveAttribute(
    "href",
    "https://oasis.library.unlv.edu/econ_ug_papers/4",
  );
  await expect(page.getByRole("link", { name: "DOI" })).toHaveAttribute(
    "href",
    "https://doi.org/10.34917/40601193",
  );
  await expect(page.locator("main details[open]")).toHaveCount(0);

  for (const [name, filenamePattern, bodyPattern] of [
    ["BibTeX", /hedonics-used-car-attributes\.bib$/u, /@techreport\{/u],
    ["RIS", /hedonics-used-car-attributes\.ris$/u, /TY  - RPRT/u],
  ] as const) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name, exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(filenamePattern);
    const stream = await download.createReadStream();
    let body = "";
    for await (const chunk of stream) body += chunk.toString();
    expect(body).toMatch(bodyPattern);
  }

  const copyButton = page.getByRole("button", { name: "Copy citation" }).first();
  await copyButton.click();
  await expect(page.locator("[data-copy-status]")).toContainText("Citation copied");
});

test("issue, fields, author guidance, governance, policies, and contact routes are reachable", async ({
  page,
}) => {
  const expectations = [
    ["/issues/", "Issues"],
    ["/issues/2026-spring/", "Spring 2026"],
    ["/fields/", "Research Fields"],
    ["/fields/applied-microeconomics/", "Applied Microeconomics"],
    ["/for-authors/", "For Student Authors"],
    ["/about/", "About the Series"],
    ["/editorial-board/", "Editorial Board"],
    ["/history/", "History and Acknowledgments"],
    ["/policies/", "Policies"],
    ["/contact/", "Contact"],
  ] as const;

  for (const [pathname, heading] of expectations) {
    await page.goto(pathname);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
  await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  await page.goto("/issues/");
  await expect(page.getByText("7 working papers", { exact: true }).first()).toBeVisible();
});

test("legacy public aliases redirect to canonical information architecture", async ({ page }) => {
  for (const [legacy, canonical] of [
    ["/categories/", "/fields/"],
    ["/our/", "/for-authors/"],
    ["/graduate-assistants/", "/editorial-board/#junior-editors"],
  ] as const) {
    await page.goto(legacy);
    await expect(page).toHaveURL(new RegExp(`${canonical.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "u"));
  }
});

test("mobile navigation is closed by default, reachable, and dismissible", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const disclosure = page.locator("[data-site-nav]");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await page.getByText("Menu", { exact: true }).click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(page.locator(".site-nav--mobile").getByRole("link", { name: "About" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("custom 404 and print citation remain available", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { level: 1, name: "Page Not Found" })).toBeVisible();

  await page.goto(paperPath);
  await page.locator(".paper-record-citation summary").click();
  await page.locator("#paper-citation-style").selectOption("mla");
  const selectedCitation = (await page.locator("#paper-citation-output").textContent())?.trim();
  expect(selectedCitation).toBeTruthy();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#paper-citation-print-output")).toBeVisible();
  await expect(page.locator("#paper-citation-print-output")).toHaveText(selectedCitation ?? "");
  await expect(page.locator(".paper-record-citation")).toBeHidden();
  await expect(page.locator(".paper-record-actions")).toBeHidden();
});
