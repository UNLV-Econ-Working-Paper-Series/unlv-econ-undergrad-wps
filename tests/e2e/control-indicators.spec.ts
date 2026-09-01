import { expect, test, type Locator, type Page } from "@playwright/test";

const paperPath = "/papers/hedonics-used-car-attributes/";

type IndicatorGeometry = {
  appearance: string;
  centerDelta: number;
  controlHeight: number;
  endGap: number;
  iconHeight: number;
  iconWidth: number;
  paddingEnd: number;
  pointerEvents: string;
};

async function selectIndicatorGeometry(wrapper: Locator): Promise<IndicatorGeometry> {
  return wrapper.evaluate((element) => {
    const select = element.querySelector("select");
    const icon = element.querySelector(".select-control__icon");
    if (!(select instanceof HTMLSelectElement) || !(icon instanceof SVGElement)) {
      throw new Error("Select control is missing its native select or decorative chevron.");
    }

    const controlRect = select.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const controlStyle = getComputedStyle(select);
    const iconStyle = getComputedStyle(icon);

    return {
      appearance: controlStyle.appearance,
      centerDelta: Math.abs(controlRect.top + controlRect.height / 2 - (iconRect.top + iconRect.height / 2)),
      controlHeight: controlRect.height,
      endGap: controlRect.right - iconRect.right,
      iconHeight: iconRect.height,
      iconWidth: iconRect.width,
      paddingEnd: Number.parseFloat(controlStyle.paddingInlineEnd),
      pointerEvents: iconStyle.pointerEvents,
    };
  });
}

function expectAlignedSelectIndicator(geometry: IndicatorGeometry) {
  expect(geometry.appearance).toBe("none");
  expect(geometry.controlHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.iconWidth).toBeGreaterThan(0);
  expect(geometry.iconHeight).toBeGreaterThan(0);
  expect(geometry.centerDelta).toBeLessThanOrEqual(1);
  expect(geometry.endGap).toBeGreaterThanOrEqual(8);
  expect(geometry.paddingEnd).toBeGreaterThanOrEqual(geometry.iconWidth + geometry.endGap);
  expect(geometry.pointerEvents).toBe("none");
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
}

test("every catalog select uses one centered cross-browser chevron", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/papers/");

  const wrappers = page.locator(".wps-catalog-filters .select-control");
  await expect(wrappers).toHaveCount(3);

  for (const wrapper of await wrappers.all()) {
    await expect(wrapper.locator("select")).toBeVisible();
    await expect(wrapper.locator(".select-control__icon")).toHaveAttribute("aria-hidden", "true");
    await expect(wrapper.locator(".select-control__icon")).toHaveAttribute("focusable", "false");
    expectAlignedSelectIndicator(await selectIndicatorGeometry(wrapper));
  }

  await page.getByLabel("Research Field").selectOption("financial-economics");
  await expect(page.getByLabel("Research Field")).toHaveValue("financial-economics");
});

test("select chevrons stay centered and contained at 200 percent text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/papers/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const wrappers = page.locator(".wps-catalog-filters .select-control");
  await expect(wrappers).toHaveCount(3);
  for (const wrapper of await wrappers.all()) {
    expectAlignedSelectIndicator(await selectIndicatorGeometry(wrapper));
  }
  await expectNoHorizontalOverflow(page);
});

test("citation select and paper accordions share stable accessible indicators", async ({ page }) => {
  await page.goto(paperPath);

  const disclosures = page.locator("main .paper-record-details");
  expect(await disclosures.count()).toBeGreaterThanOrEqual(2);

  for (const disclosure of await disclosures.all()) {
    const summary = disclosure.locator(":scope > summary");
    const icon = summary.locator(".paper-record-details__icon");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("focusable", "false");

    const closed = await summary.evaluate((element) => {
      const summaryRect = element.getBoundingClientRect();
      const indicator = element.querySelector(".paper-record-details__icon");
      if (!(indicator instanceof SVGElement)) throw new Error("Missing disclosure chevron.");
      const iconRect = indicator.getBoundingClientRect();
      return {
        centerDelta: Math.abs(
          summaryRect.top + summaryRect.height / 2 - (iconRect.top + iconRect.height / 2),
        ),
        summaryHeight: summaryRect.height,
        transform: getComputedStyle(indicator).transform,
      };
    });
    expect(closed.summaryHeight).toBeGreaterThanOrEqual(44);
    expect(closed.centerDelta).toBeLessThanOrEqual(1);

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    await expect
      .poll(() => icon.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(closed.transform);

    const opened = await icon.evaluate((element) => {
      const summary = element.closest("summary");
      if (!(summary instanceof HTMLElement)) throw new Error("Chevron is outside its summary.");
      const summaryRect = summary.getBoundingClientRect();
      const iconRect = element.getBoundingClientRect();
      return {
        centerDelta: Math.abs(
          summaryRect.top + summaryRect.height / 2 - (iconRect.top + iconRect.height / 2),
        ),
        transform: getComputedStyle(element).transform,
      };
    });
    expect(opened.transform).not.toBe(closed.transform);
    expect(opened.centerDelta).toBeLessThanOrEqual(1);
  }

  const citationSelect = page.locator(".paper-record-citation .select-control");
  await expect(citationSelect).toBeVisible();
  expectAlignedSelectIndicator(await selectIndicatorGeometry(citationSelect));
  await page.getByLabel("Citation style").selectOption("mla");
  await expect(page.getByLabel("Citation style")).toHaveValue("mla");
});

test("every published paper route renders the complete indicator system", async ({ page }) => {
  await page.goto("/papers/");
  const paperPaths = await page
    .locator(".wps-paper-entry h3 > a")
    .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname));
  expect(paperPaths).toHaveLength(15);

  for (const pathname of paperPaths) {
    await page.goto(pathname);
    const disclosures = page.locator("main .paper-record-details");
    expect(await disclosures.count(), `${pathname} disclosure count`).toBeGreaterThanOrEqual(2);

    for (const disclosure of await disclosures.all()) {
      const summary = disclosure.locator(":scope > summary");
      const icon = summary.locator(".paper-record-details__icon");
      await expect(icon, `${pathname} disclosure chevron`).toHaveCount(1);
      const centerDelta = await summary.evaluate((element) => {
        const indicator = element.querySelector(".paper-record-details__icon");
        if (!(indicator instanceof SVGElement)) throw new Error("Missing disclosure chevron.");
        const summaryRect = element.getBoundingClientRect();
        const iconRect = indicator.getBoundingClientRect();
        return Math.abs(summaryRect.top + summaryRect.height / 2 - (iconRect.top + iconRect.height / 2));
      });
      expect(centerDelta, `${pathname} disclosure alignment`).toBeLessThanOrEqual(1);
    }

    await page.getByText("Cite this paper", { exact: true }).click();
    const citationSelect = page.locator(".paper-record-citation .select-control");
    await expect(citationSelect, `${pathname} citation selector`).toBeVisible();
    expectAlignedSelectIndicator(await selectIndicatorGeometry(citationSelect));
  }
});

test("mobile navigation chevron rotates without shifting and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/papers/");

  const disclosure = page.locator("[data-site-nav]");
  const summary = disclosure.locator(":scope > summary");
  const icon = summary.locator(".site-nav-disclosure__icon");
  await expect(summary).toBeVisible();
  await expect(icon).toHaveAttribute("aria-hidden", "true");

  const closed = await icon.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      transform: getComputedStyle(element).transform,
    };
  });

  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect
    .poll(() => icon.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(closed.transform);
  const opened = await icon.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      transform: getComputedStyle(element).transform,
    };
  });

  expect(opened.transform).not.toBe(closed.transform);
  expect(Math.abs(opened.centerX - closed.centerX)).toBeLessThanOrEqual(1);
  expect(Math.abs(opened.centerY - closed.centerY)).toBeLessThanOrEqual(1);

  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test("forced colors restores native select indicators without duplication", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/papers/");

  const wrapper = page.locator(".wps-catalog-filters .select-control").first();
  await expect(wrapper.locator(".select-control__icon")).toBeHidden();
  expect(
    await wrapper.locator("select").evaluate((element) => getComputedStyle(element).appearance),
  ).not.toBe("none");
  expect(
    await wrapper.locator("select").evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);
});
