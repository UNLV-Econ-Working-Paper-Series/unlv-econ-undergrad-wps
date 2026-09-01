const MOTION_TARGET_SELECTOR = [
  ".page-banner__inner > :is(.page-banner__kicker, h1, .page-banner__subtitle, .page-banner__note, .page-banner__supplement)",
  ".scholar-home-hero__content > :is(.scholar-home-department, h1, .scholar-home-hero__lead, .scholar-home-hero__notice, .scholar-home-hero__actions)",
  ".scholar-home-section__header",
  ".scholar-home-paper-list > li",
  ".scholar-home-field-list > li",
  ".about-modern-shell > .about-block",
  ".about-team-grid > .about-person-card",
  ".contact-grid > .contact-card",
  ".contact-requests",
  ".contact-map",
  ".profile-shell > :is(.profile-thumb, .profile-bio, .profile-back-link)",
  ".policy-directory > .policy-directory-item",
  ".field-directory > li",
  ".field-paper-list > li",
  ".issue-publication-list > li",
  ".issue-paper-list > li",
  ".archive-issue-list > li",
  ".wps-paper-list > li",
].join(",");

const activeAnimations = new Set<Animation>();
let observer: IntersectionObserver | null = null;

function parseTime(value: string, fallback: number): number {
  const normalized = value.trim();
  if (!normalized) return fallback;

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) return fallback;
  return normalized.endsWith("s") && !normalized.endsWith("ms") ? amount * 1_000 : amount;
}

function clearMotionState(): void {
  observer?.disconnect();
  observer = null;

  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations.clear();

  document.querySelectorAll<HTMLElement>("[data-site-motion]").forEach((element) => {
    delete element.dataset.siteMotion;
    delete element.dataset.siteMotionState;
  });
}

function animateEntry(element: HTMLElement, staggerIndex: number): void {
  if (element.dataset.siteMotionState || typeof element.animate !== "function") return;

  const styles = getComputedStyle(document.documentElement);
  const duration = parseTime(styles.getPropertyValue("--duration-reveal"), 300);
  const stagger = parseTime(styles.getPropertyValue("--duration-stagger"), 45);
  const easing = styles.getPropertyValue("--ease-emphasized").trim() || "cubic-bezier(0.22, 1, 0.36, 1)";
  const distance = styles.getPropertyValue("--motion-reveal-distance").trim() || "0.5rem";

  element.dataset.siteMotion = "reveal";
  element.dataset.siteMotionState = "running";

  const animation = element.animate(
    [{ transform: `translate3d(0, ${distance}, 0)` }, { transform: "translate3d(0, 0, 0)" }],
    {
      duration,
      delay: Math.min(staggerIndex, 4) * stagger,
      easing,
      fill: "backwards",
    },
  );

  activeAnimations.add(animation);
  animation.addEventListener(
    "finish",
    () => {
      activeAnimations.delete(animation);
      element.dataset.siteMotionState = "complete";
    },
    { once: true },
  );
  animation.addEventListener(
    "cancel",
    () => {
      activeAnimations.delete(animation);
    },
    { once: true },
  );
}

function initializeMotion(): void {
  clearMotionState();

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window) ||
    !("animate" in Element.prototype)
  ) {
    return;
  }

  const targets = Array.from(document.querySelectorAll<HTMLElement>(MOTION_TARGET_SELECTOR));
  if (targets.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => {
          if (left.target === right.target) return 0;
          return left.target.compareDocumentPosition(right.target) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1;
        });

      visibleEntries.forEach((entry, index) => {
        const element = entry.target as HTMLElement;
        observer?.unobserve(element);
        animateEntry(element, index);
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.02 },
  );

  targets.forEach((target) => observer?.observe(target));
}

export function bootSiteMotion(): void {
  const root = document.documentElement;
  if (root.dataset.siteMotionController === "true") return;
  root.dataset.siteMotionController = "true";

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) {
      clearMotionState();
      return;
    }
    window.requestAnimationFrame(initializeMotion);
  });

  initializeMotion();
}
