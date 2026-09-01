import { expect, test } from "@playwright/test";

test("homepage hero retains its full editorial scale while supporting sections stay restrained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const hero = page.locator(".scholar-home-hero");
  const heroHeading = hero.getByRole("heading", { level: 1 });
  const sectionHeading = page.locator(".scholar-home-section h2").first();

  expect(await hero.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
    600,
  );
  expect(
    Number.parseFloat(await heroHeading.evaluate((element) => getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(80);
  expect(
    Number.parseFloat(await sectionHeading.evaluate((element) => getComputedStyle(element).fontSize)),
  ).toBeLessThanOrEqual(40);
});

test("catalog and paper-record headings preserve hierarchy without display-sized body titles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/papers/");

  expect(
    Number.parseFloat(
      await page
        .locator(".wps-paper-entry h3")
        .first()
        .evaluate((element) => getComputedStyle(element).fontSize),
    ),
  ).toBeLessThanOrEqual(31);

  await page.goto("/papers/march-madness-tournament-advancement/");
  expect(
    Number.parseFloat(
      await page.locator(".paper-record-header h1").evaluate((element) => getComputedStyle(element).fontSize),
    ),
  ).toBeLessThanOrEqual(56);
});
