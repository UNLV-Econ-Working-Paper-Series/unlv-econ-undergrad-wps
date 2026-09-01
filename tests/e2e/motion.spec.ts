import { expect, test } from "@playwright/test";

interface CapturedMotion {
  frames: Array<Record<string, unknown>>;
  options: KeyframeAnimationOptions;
}

test("normal motion uses subtle transform-only reveals without dimming content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const motionWindow = window as typeof window & { __capturedSiteMotion?: CapturedMotion[] };
    const nativeAnimate = Element.prototype.animate;
    motionWindow.__capturedSiteMotion = [];

    Element.prototype.animate = function (
      keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions,
    ): Animation {
      const normalizedOptions = typeof options === "number" ? { duration: options } : (options ?? {});
      const normalizedFrames = Array.isArray(keyframes)
        ? keyframes.map((frame) => ({ ...frame }))
        : [{ ...(keyframes ?? {}) }];
      motionWindow.__capturedSiteMotion?.push({
        frames: normalizedFrames,
        options: normalizedOptions,
      });
      return nativeAnimate.call(this, keyframes, options);
    };
  });

  await page.goto("/editorial-board/");
  await expect(page.getByRole("heading", { level: 1, name: "Editorial Board" })).toBeVisible();
  await expect.poll(() => page.locator("[data-site-motion]").count()).toBeGreaterThan(0);

  const audit = await page.evaluate(() => {
    const motionWindow = window as typeof window & { __capturedSiteMotion?: CapturedMotion[] };
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-site-motion]"));
    return {
      captured: motionWindow.__capturedSiteMotion ?? [],
      computedOpacities: targets.map((target) => Number.parseFloat(getComputedStyle(target).opacity)),
    };
  });

  expect(audit.captured.length).toBeGreaterThan(0);
  expect(audit.computedOpacities.every((opacity) => opacity === 1)).toBe(true);

  const permittedProperties = new Set(["composite", "easing", "offset", "transform"]);
  for (const animation of audit.captured) {
    expect(Number(animation.options.duration)).toBeGreaterThan(0);
    for (const frame of animation.frames) {
      expect(Object.keys(frame).every((property) => permittedProperties.has(property))).toBe(true);
    }
  }

  const profileLink = page.locator(".profile-links__link").first();
  await expect(profileLink).toBeVisible();
  const transitionDuration = await profileLink.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(transitionDuration).not.toBe("0s");
});

test("reduced motion skips reveals and collapses transition durations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/editorial-board/");

  await expect(page.getByRole("heading", { level: 1, name: "Editorial Board" })).toBeVisible();
  await expect(page.locator("[data-site-motion]")).toHaveCount(0);

  const longRunning = await page.locator("body *").evaluateAll((elements) =>
    elements.flatMap((element) => {
      const style = getComputedStyle(element);
      return `${style.animationDuration},${style.transitionDuration}`
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => (value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1_000))
        .filter((value) => Number.isFinite(value) && value > 1);
    }),
  );
  expect(longRunning).toEqual([]);
});

test("switching to reduced motion cancels active reveals without leaving inline styles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/editorial-board/");
  await expect.poll(() => page.locator("[data-site-motion]").count()).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-site-motion]")).toHaveCount(0);

  const contentState = await page
    .getByRole("heading", { level: 1, name: "Editorial Board" })
    .evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      transform: getComputedStyle(element).transform,
      inlineStyle: element.getAttribute("style"),
    }));
  expect(contentState).toEqual({ opacity: "1", transform: "none", inlineStyle: null });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("publication content remains visible in its final layout", async ({ page }) => {
    await page.goto("/editorial-board/");

    const title = page.getByRole("heading", { level: 1, name: "Editorial Board" });
    await expect(title).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Voting Editorial Board" })).toBeVisible();
    await expect(page.locator(".about-person-card").first()).toBeVisible();
    await expect(page.locator("[data-site-motion]")).toHaveCount(0);
    await expect(title).toHaveCSS("opacity", "1");
    await expect(title).toHaveCSS("transform", "none");
  });
});
