import { expect, test } from "@playwright/test";

const tocEntries = [
  ["Authority and approval", "#board-authority"],
  ["Voting Editorial Board", "#voting-board"],
  ["Junior Editors", "#junior-editors"],
  ["Governance and contact", "#governance-and-contact"],
] as const;

test("editorial board has a complete, stateful on-page navigator", async ({ page }) => {
  await page.goto("/editorial-board/");
  const toc = page.getByRole("navigation", { name: "On this page" });

  for (const [label, hash] of tocEntries) {
    const link = toc.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", hash);
    await expect(page.locator(hash)).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`, "u"));
    await expect(link).toHaveAttribute("aria-current", "location");

    const offsets = await page.evaluate((selector) => {
      const headerBottom = document
        .querySelector<HTMLElement>(".site-header")!
        .getBoundingClientRect().bottom;
      const targetTop = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect().top;
      return { headerBottom, targetTop };
    }, hash);
    expect(offsets.targetTop).toBeGreaterThanOrEqual(offsets.headerBottom - 1);
  }
});

test("editorial on-page navigation follows browser history", async ({ page }) => {
  await page.goto("/editorial-board/");
  const toc = page.getByRole("navigation", { name: "On this page" });
  const authority = toc.getByRole("link", { name: "Authority and approval", exact: true });
  const votingBoard = toc.getByRole("link", { name: "Voting Editorial Board", exact: true });
  const juniorEditors = toc.getByRole("link", { name: "Junior Editors", exact: true });

  await votingBoard.click();
  await juniorEditors.click();
  await expect(page).toHaveURL(/#junior-editors$/u);

  await page.goBack();
  await expect(page).toHaveURL(/#voting-board$/u);
  await expect(votingBoard).toHaveAttribute("aria-current", "location");

  await page.goBack();
  await expect(page).toHaveURL(/\/editorial-board\/$/u);
  await expect(authority).toHaveAttribute("aria-current", "location");
  await expect(votingBoard).not.toHaveAttribute("aria-current", "location");
});

test("editor profiles use concise narratives and owner-labelled icon links", async ({ page }) => {
  await page.goto("/editorial-board/");
  await expect(page.locator("#voting-board .about-person-card")).toHaveCount(3);
  await expect(page.locator("#junior-editors .about-person-card")).toHaveCount(1);
  await expect(page.locator("#junior-editors .about-person-thumb")).toHaveCount(0);
  await expect(page.locator("#junior-editors .profile-links")).toHaveCount(0);

  for (const name of ["Mark Jayson Martinez Farol", "Djeto Assané", "Eric Chiang"] as const) {
    const card = page.locator("#voting-board .about-person-card").filter({ hasText: name });
    await expect(card.getByRole("list", { name: `External profiles for ${name}` })).toBeVisible();
    const links = card.locator(".profile-links__link");
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute(
        "aria-label",
        new RegExp(`for ${name} \\(opens in a new tab\\)$`, "u"),
      );
      const box = await link.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  }
});

test("deprecated role and biography labels do not return on editorial profile routes", async ({ page }) => {
  for (const pathname of [
    "/editorial-board/",
    "/editorial-board/mark-jayson-farol/",
    "/editorial-board/djeto-assane/",
    "/editorial-board/eric-chiang/",
    "/graduate-assistants/brandon-penticoff/",
  ] as const) {
    await page.goto(pathname);
    await expect(
      page.getByRole("heading", { name: /Role in the Series|Professional biography/iu }),
      pathname,
    ).toHaveCount(0);
    await expect(page.locator("body"), pathname).not.toContainText("Non-voting");
  }
});

test("editorial page hash entry, keyboard focus, and 320px reflow remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/editorial-board/#junior-editors");
  await expect(page).toHaveURL(/#junior-editors$/u);
  await expect(page.locator("#junior-editors")).toBeVisible();

  const firstProfileLink = page.locator(".profile-links__link").first();
  await firstProfileLink.focus();
  await expect(firstProfileLink).toBeFocused();
  const focus = await firstProfileLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineWidth).not.toBe("0px");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});
