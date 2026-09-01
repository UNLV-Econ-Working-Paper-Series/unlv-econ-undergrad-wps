import { expect, test } from "@playwright/test";

type Rectangle = {
  bottom: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

const rectanglesOverlap = (first: Rectangle, second: Rectangle) =>
  first.left < second.right &&
  first.right > second.left &&
  first.top < second.bottom &&
  first.bottom > second.top;

test("working-paper filters form one aligned control row on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/papers/");

  const form = page.locator(".wps-catalog-filters");
  await expect(form).toHaveCSS("display", "grid");

  for (const accessibleName of ["Search", "Research Field", "Issue", "Sort"]) {
    await expect(page.getByLabel(accessibleName, { exact: true })).toBeVisible();
  }

  const geometry = await page.evaluate(() => {
    const rectangle = (element: Element) => {
      const { bottom, left, right, top, width } = element.getBoundingClientRect();
      return { bottom, left, right, top, width };
    };
    const controls = [
      document.querySelector("#paper-search"),
      document.querySelector("#paper-field"),
      document.querySelector("#paper-issue"),
      document.querySelector("#paper-sort"),
      document.querySelector(".wps-catalog-filter-actions"),
    ];

    return {
      controls: controls.map((control) => rectangle(control!)),
      form: rectangle(document.querySelector(".wps-catalog-filters")!),
    };
  });

  const controlTops = geometry.controls.map(({ top }) => top);
  const controlBottoms = geometry.controls.map(({ bottom }) => bottom);
  expect(Math.max(...controlTops) - Math.min(...controlTops)).toBeLessThanOrEqual(1);
  expect(Math.max(...controlBottoms) - Math.min(...controlBottoms)).toBeLessThanOrEqual(1);
  expect(geometry.controls[0].width).toBeGreaterThan(geometry.controls[2].width * 1.8);
  expect(geometry.controls[1].width).toBeGreaterThan(geometry.controls[2].width * 1.8);

  for (const control of geometry.controls) {
    expect(control.left).toBeGreaterThanOrEqual(geometry.form.left);
    expect(control.right).toBeLessThanOrEqual(geometry.form.right + 1);
  }
});

test("working-paper filters stack deliberately on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/papers/");

  const geometry = await page.locator(".wps-catalog-filters").evaluate((form) => {
    const rectangle = (element: Element) => {
      const { bottom, left, right, top, width } = element.getBoundingClientRect();
      return { bottom, left, right, top, width };
    };
    const filters = Array.from(form.querySelectorAll(":scope > .wps-catalog-filter"));
    const actions = form.querySelector(":scope > .wps-catalog-filter-actions")!;
    return {
      actions: rectangle(actions),
      filters: filters.map(rectangle),
      form: rectangle(form),
    };
  });

  expect(geometry.filters).toHaveLength(4);
  for (let index = 1; index < geometry.filters.length; index += 1) {
    expect(geometry.filters[index].top).toBeGreaterThan(geometry.filters[index - 1].bottom);
    expect(Math.abs(geometry.filters[index].left - geometry.filters[0].left)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.filters[index].width - geometry.filters[0].width)).toBeLessThanOrEqual(1);
  }
  expect(geometry.actions.top).toBeGreaterThan(geometry.filters.at(-1)!.bottom);
  expect(geometry.actions.left).toBeGreaterThanOrEqual(geometry.form.left);
  expect(geometry.actions.right).toBeLessThanOrEqual(geometry.form.right + 1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test("working-paper filters reflow without collision at 200 percent text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/papers/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const geometry = await page.locator(".wps-catalog-filters").evaluate((form) => {
    const rectangle = (element: Element) => {
      const { bottom, left, right, top, width } = element.getBoundingClientRect();
      return { bottom, left, right, top, width };
    };
    const items = Array.from(
      form.querySelectorAll(":scope > .wps-catalog-filter, :scope > .wps-catalog-filter-actions"),
    );
    return {
      form: rectangle(form),
      items: items.map(rectangle),
      rowTops: [...new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)))],
    };
  });

  expect(geometry.rowTops.length).toBeGreaterThan(1);
  for (const item of geometry.items) {
    expect(item.width).toBeGreaterThan(0);
    expect(item.left).toBeGreaterThanOrEqual(geometry.form.left);
    expect(item.right).toBeLessThanOrEqual(geometry.form.right + 1);
  }
  for (let first = 0; first < geometry.items.length; first += 1) {
    for (let second = first + 1; second < geometry.items.length; second += 1) {
      expect(rectanglesOverlap(geometry.items[first], geometry.items[second])).toBe(false);
    }
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});
