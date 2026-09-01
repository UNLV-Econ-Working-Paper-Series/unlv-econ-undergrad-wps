import { expect, test } from "@playwright/test";

test("branded banner content remains visible and clears the sticky header cleanly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/papers/");

  const banner = page.locator(".page-banner--brand");
  const title = banner.getByRole("heading", { level: 1, name: "Working Papers" });
  const subtitle = banner.locator(".page-banner__subtitle");

  await expect(title).toBeVisible();
  await expect(subtitle).toBeVisible();
  await expect(title).toHaveCSS("opacity", "1");
  await expect(subtitle).toHaveCSS("opacity", "1");

  const initialHeight = await banner.evaluate((element) => element.getBoundingClientRect().height);
  expect(initialHeight).toBeLessThan(240);

  await page.evaluate(() => window.scrollTo(0, 200));

  const geometry = await page.evaluate(() => ({
    bannerBottom: document.querySelector(".page-banner--brand")!.getBoundingClientRect().bottom,
    headerBottom: document.querySelector(".site-header")!.getBoundingClientRect().bottom,
  }));

  expect(geometry.bannerBottom).toBeLessThanOrEqual(geometry.headerBottom + 1);
});

test("mobile branded banner clears a restored scroll position without clipped copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/papers/");

  const banner = page.locator(".page-banner--brand");
  const initialHeight = await banner.evaluate((element) => element.getBoundingClientRect().height);
  expect(initialHeight).toBeLessThanOrEqual(200);

  await page.evaluate(() => window.scrollTo(0, 200));

  const geometry = await page.evaluate(() => ({
    bannerBottom: document.querySelector(".page-banner--brand")!.getBoundingClientRect().bottom,
    headerBottom: document.querySelector(".site-header")!.getBoundingClientRect().bottom,
  }));

  expect(geometry.bannerBottom).toBeLessThanOrEqual(geometry.headerBottom + 1);
});
