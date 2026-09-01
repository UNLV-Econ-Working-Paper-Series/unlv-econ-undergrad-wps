import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/papers/",
  "/papers/march-madness-tournament-advancement/",
  "/editorial-board/",
  "/contact/",
] as const;

const brandedSectionRoutes = [
  "/papers/",
  "/issues/",
  "/fields/",
  "/for-authors/",
  "/about/",
  "/editorial-board/",
  "/history/",
  "/policies/",
  "/contact/",
] as const;

for (const viewport of [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`representative routes reflow without horizontal overflow at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const pathname of routes) {
      await page.goto(pathname);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${pathname} overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
  });
}

test("shared content rails align with the masthead on wide and narrow screens", async ({ page }) => {
  const pagesAndRails = [
    ["/", ".scholar-home-hero__content"],
    ["/papers/", ".wps-catalog-shell"],
    ["/papers/march-madness-tournament-advancement/", ".paper-record-shell"],
    ["/issues/2026-spring/", ".publication-breadcrumb"],
    ["/fields/applied-microeconomics/", ".field-breadcrumb"],
    ["/contact/", ".contact-modern-shell"],
    ["/editorial-board/djeto-assane/", ".profile-shell"],
  ] as const;

  for (const viewport of [
    { width: 320, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const [pathname, selector] of pagesAndRails) {
      await page.goto(pathname);
      const measurements = await page.evaluate((railSelector) => {
        const header = document.querySelector<HTMLElement>(".site-header__inner")?.getBoundingClientRect();
        const rail = document.querySelector<HTMLElement>(railSelector)?.getBoundingClientRect();
        if (!header || !rail) return null;
        return {
          headerLeft: header.left,
          headerWidth: header.width,
          railLeft: rail.left,
          railWidth: rail.width,
        };
      }, selector);

      expect(measurements, `${pathname} is missing a measured rail`).not.toBeNull();
      expect(Math.abs(measurements!.railLeft - measurements!.headerLeft), pathname).toBeLessThanOrEqual(1);
      expect(Math.abs(measurements!.railWidth - measurements!.headerWidth), pathname).toBeLessThanOrEqual(1);
    }
  }
});

test("primary publication sections use an aligned, high-contrast red hero", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);

    for (const pathname of brandedSectionRoutes) {
      await page.goto(pathname);
      const banner = page.locator(".page-banner--brand");
      await expect(banner, pathname).toBeVisible();
      await expect(banner, pathname).toHaveCSS("background-color", "rgb(163, 11, 21)");
      await expect(banner.locator("h1"), pathname).toHaveCSS("color", "rgb(255, 255, 255)");

      const rails = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>(".site-header__inner")!.getBoundingClientRect();
        const bannerInner = document
          .querySelector<HTMLElement>(".page-banner__inner")!
          .getBoundingClientRect();
        return {
          headerLeft: header.left,
          headerWidth: header.width,
          bannerLeft: bannerInner.left,
          bannerWidth: bannerInner.width,
        };
      });
      expect(Math.abs(rails.bannerLeft - rails.headerLeft), pathname).toBeLessThanOrEqual(1);
      expect(Math.abs(rails.bannerWidth - rails.headerWidth), pathname).toBeLessThanOrEqual(1);
    }
  }

  for (const pathname of [
    "/",
    "/papers/march-madness-tournament-advancement/",
    "/issues/2026-spring/",
    "/fields/applied-microeconomics/",
  ] as const) {
    await page.goto(pathname);
    await expect(page.locator(".page-banner--brand"), pathname).toHaveCount(0);
  }
});

test("homepage hero retains its scale, search begins in the first viewport, and footer stays compact", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720, heroMinimum: 511, footerLimit: 360 },
    { width: 1440, height: 900, heroMinimum: 611, footerLimit: 360 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const search = document.querySelector<HTMLElement>(".scholar-home-search")!.getBoundingClientRect();
      const hero = document.querySelector<HTMLElement>(".scholar-home-hero")!.getBoundingClientRect();
      const footer = document.querySelector<HTMLElement>(".site-footer")!.getBoundingClientRect();
      return { searchTop: search.top, heroHeight: hero.height, footerHeight: footer.height };
    });

    expect(geometry.searchTop).toBeLessThanOrEqual(viewport.height + 1);
    expect(geometry.heroHeight).toBeGreaterThanOrEqual(viewport.heroMinimum);
    expect(geometry.footerHeight).toBeLessThanOrEqual(viewport.footerLimit);
  }
});

test("campus photograph credit stays in the hero's lower-right corner", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(".scholar-home-hero")!.getBoundingClientRect();
      const credit = document
        .querySelector<HTMLElement>(".scholar-home-photo-credit")!
        .getBoundingClientRect();
      const actions = document
        .querySelector<HTMLElement>(".scholar-home-hero__actions")!
        .getBoundingClientRect();
      return {
        heroBottom: hero.bottom,
        heroLeft: hero.left,
        heroRight: hero.right,
        creditBottom: credit.bottom,
        creditLeft: credit.left,
        creditRight: credit.right,
        creditTop: credit.top,
        actionsBottom: actions.bottom,
      };
    });

    expect(geometry.heroBottom - geometry.creditBottom).toBeGreaterThanOrEqual(8);
    expect(geometry.heroBottom - geometry.creditBottom).toBeLessThanOrEqual(24);
    expect(geometry.heroRight - geometry.creditRight).toBeGreaterThanOrEqual(12);
    expect(geometry.heroRight - geometry.creditRight).toBeLessThanOrEqual(32);
    expect(geometry.creditLeft).toBeGreaterThanOrEqual(geometry.heroLeft);
    expect(geometry.creditTop).toBeGreaterThanOrEqual(geometry.actionsBottom);
    await expect(page.getByRole("link", { name: "UNLV News (Lee Business School)" })).toBeVisible();
  }
});

test("campus photograph credit reflows clear of actions at 200 percent text", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 667, height: 375 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1200, height: 800 },
    { width: 1280, height: 800 },
    { width: 1281, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(".scholar-home-hero")!.getBoundingClientRect();
      const content = document
        .querySelector<HTMLElement>(".scholar-home-hero__content")!
        .getBoundingClientRect();
      const actions = document
        .querySelector<HTMLElement>(".scholar-home-hero__actions")!
        .getBoundingClientRect();
      const creditElement = document.querySelector<HTMLElement>(".scholar-home-photo-credit")!;
      const credit = creditElement.getBoundingClientRect();
      return {
        actionBottom: actions.bottom,
        creditTop: credit.top,
        creditRight: credit.right,
        contentRight: content.right,
        heroRight: hero.right,
        creditBottom: credit.bottom,
        heroBottom: hero.bottom,
        creditPosition: getComputedStyle(creditElement).position,
      };
    });

    expect(geometry.creditTop, `${viewport.width}px action clearance`).toBeGreaterThanOrEqual(
      geometry.actionBottom,
    );
    if (geometry.creditPosition === "static") {
      expect(
        Math.abs(geometry.creditRight - geometry.contentRight),
        `${viewport.width}px content-rail alignment`,
      ).toBeLessThanOrEqual(1);
    } else {
      const photographEdgeInset = geometry.heroRight - geometry.creditRight;
      expect(photographEdgeInset, `${viewport.width}px photograph-edge inset`).toBeGreaterThanOrEqual(8);
      expect(photographEdgeInset, `${viewport.width}px photograph-edge inset`).toBeLessThanOrEqual(48);
    }
    expect(geometry.creditBottom, `${viewport.width}px hero containment`).toBeLessThan(geometry.heroBottom);
  }
});

test("mobile footer remains compact and retains usable link targets", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 800, footerLimit: 900 },
    { width: 390, height: 844, footerLimit: 800 },
    { width: 768, height: 1024, footerLimit: 650 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/about/");
    const footerHeight = await page
      .locator(".site-footer")
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(footerHeight).toBeLessThanOrEqual(viewport.footerLimit);

    const undersizedLinks = await page.locator(".site-footer a").evaluateAll((links) =>
      links.flatMap((link) => {
        const box = link.getBoundingClientRect();
        return box.width < 24 || box.height < 24
          ? [{ text: link.textContent?.trim(), width: box.width, height: box.height }]
          : [];
      }),
    );
    expect(undersizedLinks).toEqual([]);
  }
});

test("desktop navigation has one active indicator and a guarded breakpoint", async ({ page }) => {
  for (const [width, desktop] of [
    [1279, false],
    [1280, true],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/papers/");

    await expect(page.locator(".site-nav--desktop")).toHaveCSS("display", desktop ? "flex" : "none");
    if (desktop) await expect(page.locator("[data-site-nav]")).toBeHidden();
    else await expect(page.locator("[data-site-nav] > summary")).toBeVisible();
    const headerHeight = await page
      .locator(".site-header")
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(headerHeight).toBeLessThanOrEqual(90);
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/papers/");
  const active = page.locator('.site-nav--desktop a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  expect(await active.evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe("none");
  expect(await active.evaluate((element) => getComputedStyle(element, "::after").backgroundColor)).not.toBe(
    "rgba(0, 0, 0, 0)",
  );

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });
  await expect(page.locator(".site-header")).toHaveAttribute("data-compact-navigation", "");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
  await expect(page.locator("[data-site-nav] > summary")).toBeVisible();
  await expect(page.locator('.site-nav--mobile a[aria-current="page"]')).toBeAttached();
});

test("About-family pages retain one clear primary-navigation location", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const pathname of ["/about/", "/editorial-board/", "/history/", "/policies/", "/contact/"] as const) {
    await page.goto(pathname);
    const active = page.locator('.site-nav--desktop a[aria-current="page"]');
    await expect(active, pathname).toHaveCount(1);
    await expect(active, pathname).toHaveText("About");
  }
});

test("200 percent text sizing does not reinstate a root-width overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const pathname of ["/", "/papers/", "/editorial-board/"] as const) {
    await page.goto(pathname);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      pathname,
    ).toBeLessThanOrEqual(1);
  }
});

test("extreme narrow-screen text reflow keeps the collapsed navigation usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/papers/");

  const header = page.locator(".site-header");
  const disclosure = page.locator("[data-site-nav]");
  const menuButton = disclosure.locator("summary");
  const masthead = page.locator(".site-masthead");

  await expect(header).not.toHaveAttribute("data-condensed-masthead", "");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  await expect(header).toHaveAttribute("data-condensed-masthead", "");
  await expect(masthead).toHaveAccessibleName("UNLV Undergraduate Economics Working Paper Series home");
  await expect(menuButton).toBeVisible();

  const collapsedGeometry = await page.evaluate(() => ({
    headerHeight: document.querySelector<HTMLElement>(".site-header")!.getBoundingClientRect().height,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(collapsedGeometry.headerHeight).toBeLessThanOrEqual(225);
  expect(collapsedGeometry.overflow).toBeLessThanOrEqual(1);

  await menuButton.click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("link", { name: "Home" })).toBeVisible();
  await menuButton.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(menuButton).toBeFocused();
});

test("extreme text reflow lets an over-limit short-landscape header scroll away", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/papers/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const header = page.locator(".site-header");
  await expect(header).toHaveAttribute("data-condensed-masthead", "");
  await expect(header).toHaveAttribute("data-static-header", "");
  await expect(header).toHaveCSS("position", "relative");
  await expect(page.locator("[data-site-nav] > summary")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-offset")),
    ),
  ).toBe(0);
});

test("sticky offsets track a wrapped header and keep hash targets exposed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/editorial-board/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  await page.waitForFunction(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return false;
    const offset = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-offset"),
    );
    return Math.abs(offset - header.getBoundingClientRect().height) <= 1;
  });

  await expect(page.locator(".site-header")).toHaveAttribute("data-compact-navigation", "");
  await expect(page.locator(".site-nav--desktop")).toBeHidden();
  await expect(page.locator("[data-site-nav] > summary")).toBeVisible();

  const collapsedHeader = await page.locator(".site-header").evaluate((header) => ({
    height: header.getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
  }));
  expect(collapsedHeader.height).toBeLessThanOrEqual(
    Math.min(224, collapsedHeader.viewportHeight * 0.32) + 1,
  );

  await page.locator('.toc__link[href="#junior-editors"]').click();
  await expect(page).toHaveURL(/#junior-editors$/);

  // WebKit applies the hash update before its native anchor scroll settles.
  // Wait for the same strict exposed-target geometry asserted below instead
  // of sampling the old document position immediately after the URL changes.
  await page.waitForFunction(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const target = document.getElementById("junior-editors");
    if (!header || !target) return false;
    const headerBottom = header.getBoundingClientRect().bottom;
    const targetTop = target.getBoundingClientRect().top;
    return targetTop >= headerBottom - 1 && targetTop <= headerBottom + 4;
  });

  const geometry = await page.evaluate(() => ({
    headerBottom: document.querySelector<HTMLElement>(".site-header")!.getBoundingClientRect().bottom,
    targetTop: document.getElementById("junior-editors")!.getBoundingClientRect().top,
    targetHeadingBottom: document
      .getElementById("junior-editors")!
      .querySelector<HTMLElement>("h2, h3")!
      .getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
  }));
  expect(geometry.targetTop).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
  expect(geometry.targetTop).toBeLessThanOrEqual(geometry.headerBottom + 4);
  expect(geometry.targetHeadingBottom).toBeLessThanOrEqual(geometry.viewportHeight);
});
