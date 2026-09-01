import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const representativeRoutes = [
  "/",
  "/papers/",
  "/papers/hedonics-used-car-attributes/",
  "/issues/",
  "/issues/2025-fall/",
  "/fields/",
  "/for-authors/",
  "/about/",
  "/editorial-board/",
  "/history/",
  "/policies/",
  "/contact/",
  "/issues/archive/",
  "/404.html",
];

for (const pathname of representativeRoutes) {
  test(`has no serious or critical axe violations: ${pathname}`, async ({ page }) => {
    await page.goto(pathname);
    await expect(page.locator("h1")).toHaveCount(1);
    const headingLevels = await page
      .locator("h1,h2,h3,h4,h5,h6")
      .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index]).toBeLessThanOrEqual(headingLevels[index - 1] + 1);
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const material = result.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(material, JSON.stringify(material, null, 2)).toEqual([]);
  });
}

test("heading order, focus entry, live result status, and 320px reflow remain usable", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/papers/");

  const headingLevels = await page
    .locator("h1,h2,h3,h4,h5,h6")
    .evaluateAll((headings) => headings.map((heading) => Number(heading.tagName.slice(1))));
  for (let index = 1; index < headingLevels.length; index += 1) {
    expect(headingLevels[index]).toBeLessThanOrEqual(headingLevels[index - 1] + 1);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);

  if (browserName !== "webkit") {
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  }

  await page.getByRole("searchbox", { name: "Search", exact: true }).fill("bank");
  await expect(page.locator("#paper-result-count")).toHaveText("Showing 1 paper");
});

test("forced colors keep navigation and paper actions visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/papers/hedonics-used-car-attributes/");
  await expect(page.getByRole("link", { name: "Read full paper (PDF)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Working Papers", exact: true }).first()).toBeVisible();
});

test("keyboard focus, mobile disclosure, and landscape reflow remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/");

  const menu = page.locator("[data-site-nav]");
  const summary = menu.locator("summary");
  await summary.focus();
  await expect(summary).toBeFocused();
  const focusStyle = await summary.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).not.toBe("0px");

  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);
});

test("reduced-motion preference collapses material animation durations", async ({ page }) => {
  await page.goto("/papers/");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const longRunning = await page.locator("body *").evaluateAll((elements) =>
    elements.flatMap((element) => {
      const style = getComputedStyle(element);
      const durations = `${style.animationDuration},${style.transitionDuration}`
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => (value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1_000))
        .filter((value) => Number.isFinite(value) && value > 1);
      return durations.length > 0 ? [{ tag: element.tagName, durations }] : [];
    }),
  );
  expect(longRunning).toEqual([]);
});

test("normal-motion transitions never gate access to publication content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(false);
  await expect(page.getByRole("heading", { level: 1, name: /Working Paper Series/i })).toBeVisible();
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Latest Issue" })).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();

  const transitionDuration = await page
    .getByRole("button", { name: "Search Working Papers" })
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration).not.toBe("0s");
});
