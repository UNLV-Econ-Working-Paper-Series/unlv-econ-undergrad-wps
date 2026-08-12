import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

declare global {
  interface Window {
    __siteMotionBound?: boolean;
  }
}

gsap.registerPlugin(ScrollTrigger);

const activeTweens: Array<gsap.core.Tween | gsap.core.Timeline> = [];
const activeTriggers: ScrollTrigger[] = [];
const CLEAR_PROPS = "opacity,visibility,transform,filter,willChange";

function markManaged(targets: Array<Element | null | undefined>): HTMLElement[] {
  const nodes = Array.from(new Set(targets.filter((target): target is HTMLElement => target instanceof HTMLElement)));
  for (const node of nodes) {
    node.dataset.gsapMotion = "true";
  }
  return nodes;
}

function cleanupMotion(): void {
  activeTriggers.splice(0).forEach((trigger) => trigger.kill());
  activeTweens.splice(0).forEach((animation) => animation.kill());

  document.querySelectorAll<HTMLElement>("[data-gsap-motion]").forEach((node) => {
    gsap.set(node, { clearProps: "opacity,visibility,transform,filter,willChange" });
    delete node.dataset.gsapMotion;
  });
}

function trackTween<T extends gsap.core.Tween | gsap.core.Timeline>(animation: T): T {
  activeTweens.push(animation);
  return animation;
}

function trackTrigger(trigger: ScrollTrigger): ScrollTrigger {
  activeTriggers.push(trigger);
  return trigger;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface ScrollRevealConfig {
  trigger: Element;
  targets: Array<Element | null | undefined>;
  start?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
}

function initScrollReveal({
  trigger,
  targets,
  start = "top bottom-=110",
  from = { autoAlpha: 0, y: 18 },
  to = { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 },
}: ScrollRevealConfig): void {
  const nodes = markManaged(targets);
  if (nodes.length === 0) {
    return;
  }

  gsap.set(nodes, {
    ...from,
    willChange: "opacity,transform",
  });

  trackTrigger(
    ScrollTrigger.create({
      trigger,
      start,
      once: true,
      onEnter: () => {
        trackTween(
          gsap.to(nodes, {
            ...to,
            clearProps: CLEAR_PROPS,
          })
        );
      },
    })
  );
}

function initHomeHeroMotion(): void {
  if (!document.body.classList.contains("page-home")) {
    return;
  }

  const heroPanel = document.querySelector<HTMLElement>(".page-home .hero-panel");
  const kicker = document.querySelector<HTMLElement>(".page-home .hero-kicker");
  const title = document.querySelector<HTMLElement>(".page-home .home-hero h1");
  const subtitle = document.querySelector<HTMLElement>(".page-home .hero-subtitle");
  const actionItems = gsap.utils.toArray<HTMLElement>(".page-home .hero-actions > *");
  const credit = document.querySelector<HTMLElement>(".page-home .hero-credit");

  const managedHeroPanel = markManaged([heroPanel]);
  const managedText = markManaged([kicker, title, subtitle]);
  const managedActions = markManaged(actionItems);
  const managedCredit = markManaged([credit]);

  if (
    managedHeroPanel.length === 0 &&
    managedText.length === 0 &&
    managedActions.length === 0 &&
    managedCredit.length === 0
  ) {
    return;
  }

  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (managedHeroPanel.length > 0) {
    timeline.fromTo(
      managedHeroPanel,
      { autoAlpha: 0, y: 24, filter: "blur(8px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, clearProps: CLEAR_PROPS },
      0.04
    );
  }

  if (managedText.length > 0) {
    timeline.fromTo(
      managedText,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.07, clearProps: CLEAR_PROPS },
      managedHeroPanel.length > 0 ? 0.18 : 0
    );
  }

  if (managedActions.length > 0) {
    timeline.fromTo(
      managedActions,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.07, clearProps: CLEAR_PROPS },
      managedText.length > 0 || managedHeroPanel.length > 0 ? 0.36 : 0
    );
  }

  if (managedCredit.length > 0) {
    timeline.fromTo(
      managedCredit,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.3, clearProps: CLEAR_PROPS },
      managedActions.length > 0 || managedText.length > 0 || managedHeroPanel.length > 0 ? 0.5 : 0
    );
  }

  trackTween(timeline);
}

function initHomeSectionMotion(): void {
  const sections = gsap.utils.toArray<HTMLElement>(".page-home .home-section");

  for (const section of sections) {
    initScrollReveal({
      trigger: section,
      targets: [section.querySelector(".section-head"), ...section.querySelectorAll('[data-motion="gsap"]')],
      start: "top bottom-=90",
      from: { autoAlpha: 0, y: 20 },
      to: { autoAlpha: 1, y: 0, duration: 0.52, ease: "power2.out", stagger: 0.1 },
    });
  }
}

function initInteriorBannerMotion(): void {
  if (document.body.classList.contains("page-home")) {
    return;
  }

  const bannerNodes = markManaged(
    gsap.utils.toArray<HTMLElement>(".page-banner__kicker, .page-banner h1, .page-banner__subtitle, .page-banner__note")
  );

  if (bannerNodes.length === 0) {
    return;
  }

  trackTween(
    gsap.fromTo(
      bannerNodes,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.44, ease: "power3.out", stagger: 0.05, clearProps: CLEAR_PROPS }
    )
  );
}

function initIssuesPageMotion(): void {
  const explorer = document.querySelector<HTMLElement>(".page-issues .issues-explorer");
  if (!explorer) {
    return;
  }

  initScrollReveal({
    trigger: explorer,
    targets: [
      explorer.querySelector(".issues-controls"),
      explorer.querySelector(".issues-latest-line"),
      ...explorer.querySelectorAll('[data-issue-card][data-motion="gsap"]'),
      explorer.querySelector(".issue-archive-link"),
      explorer.querySelector(".empty-state-card"),
    ],
    start: "top bottom-=110",
    from: { autoAlpha: 0, y: 18 },
    to: { autoAlpha: 1, y: 0, duration: 0.48, ease: "power2.out", stagger: 0.07 },
  });
}

function initArchivePageMotion(): void {
  const explorer = document.querySelector<HTMLElement>(".page-archive .issues-explorer");
  if (!explorer) {
    return;
  }

  initScrollReveal({
    trigger: explorer,
    targets: [
      explorer.querySelector(".issues-controls"),
      ...explorer.querySelectorAll('[data-archive-issue-card][data-motion="gsap"]'),
      explorer.querySelector(".empty-state-card"),
    ],
    start: "top bottom-=110",
    from: { autoAlpha: 0, y: 18 },
    to: { autoAlpha: 1, y: 0, duration: 0.48, ease: "power2.out", stagger: 0.07 },
  });
}

function initCategoriesPageMotion(): void {
  const shell = document.querySelector<HTMLElement>(".page-categories .categories-shell");
  if (!shell) {
    return;
  }

  initScrollReveal({
    trigger: shell,
    targets: [shell.querySelector(".categories-controls"), ...shell.querySelectorAll('[data-category-item][data-motion="gsap"]')],
    start: "top bottom-=110",
    from: { autoAlpha: 0, y: 16 },
    to: { autoAlpha: 1, y: 0, duration: 0.46, ease: "power2.out", stagger: 0.05 },
  });
}

function initPolicyIndexMotion(): void {
  const shell = document.querySelector<HTMLElement>(".page-policy-index .policy-shell");
  if (!shell) {
    return;
  }

  initScrollReveal({
    trigger: shell,
    targets: [shell.querySelector("h2"), shell.querySelector(".policy-article > p"), ...shell.querySelectorAll('[data-motion="gsap"]')],
    start: "top bottom-=110",
    from: { autoAlpha: 0, y: 16 },
    to: { autoAlpha: 1, y: 0, duration: 0.46, ease: "power2.out", stagger: 0.05 },
  });
}

function initOurPageMotion(): void {
  const sections = gsap.utils.toArray<HTMLElement>(".page-our-modern .content-section");

  for (const section of sections) {
    initScrollReveal({
      trigger: section,
      targets: [
        section.querySelector(".our-section-head"),
        section.querySelector(".our-connection-intro"),
        ...section.querySelectorAll('[data-motion="gsap"]'),
        section.querySelector(".our-section-actions"),
        section.querySelector(".our-accordion"),
      ],
      start: "top bottom-=110",
      from: { autoAlpha: 0, y: 18 },
      to: { autoAlpha: 1, y: 0, duration: 0.48, ease: "power2.out", stagger: 0.07 },
    });
  }
}

function initIssueDetailMotion(): void {
  if (!document.body.classList.contains("page-issue-detail")) {
    return;
  }

  const breadcrumb = document.querySelector<HTMLElement>(".issue-breadcrumb");
  const overview = document.querySelector<HTMLElement>(".issue-overview");
  const contents = document.querySelector<HTMLElement>(".issue-contents");

  const introNodes = markManaged([breadcrumb]);
  if (introNodes.length > 0) {
    trackTween(
      gsap.fromTo(
        introNodes,
        { autoAlpha: 0, x: -10 },
        { autoAlpha: 1, x: 0, duration: 0.38, ease: "power2.out", clearProps: CLEAR_PROPS }
      )
    );
  }

  if (overview) {
    initScrollReveal({
      trigger: overview,
      targets: [overview.querySelector(".issue-overview-copy"), overview.querySelector(".issue-facts")],
      start: "top bottom-=45",
      from: { autoAlpha: 0, y: 20 },
      to: { autoAlpha: 1, y: 0, duration: 0.58, ease: "power3.out", stagger: 0.11 },
    });
  }

  if (contents) {
    initScrollReveal({
      trigger: contents,
      targets: [contents.querySelector(".issue-contents-head")],
      start: "top bottom-=60",
      from: { autoAlpha: 0, y: 16 },
      to: { autoAlpha: 1, y: 0, duration: 0.46, ease: "power2.out" },
    });

    contents.querySelectorAll<HTMLElement>(".issue-paper-entry").forEach((entry) => {
      initScrollReveal({
        trigger: entry,
        targets: [entry.querySelector(".issue-paper-number"), entry.querySelector(".issue-paper-copy"), entry.querySelector(".issue-paper-record")],
        start: "top bottom-=55",
        from: { autoAlpha: 0, y: 18 },
        to: { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.07 },
      });
    });
  }
}

function initPaperDetailMotion(): void {
  if (!document.body.classList.contains("page-paper-detail")) {
    return;
  }

  const breadcrumb = document.querySelector<HTMLElement>(".paper-breadcrumb");
  const toolbar = document.querySelector<HTMLElement>(".paper-detail-toolbar");
  const abstract = document.querySelector<HTMLElement>(".paper-abstract-card");
  const citation = document.querySelector<HTMLElement>(".paper-citation-card");
  const record = document.querySelector<HTMLElement>(".paper-record-card");
  const repository = document.querySelector<HTMLElement>(".paper-repository-card");

  const introNodes = markManaged([breadcrumb, toolbar]);
  if (introNodes.length > 0) {
    trackTween(
      gsap.fromTo(
        introNodes,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out", stagger: 0.08, clearProps: CLEAR_PROPS }
      )
    );
  }

  for (const [trigger, targets] of [
    [abstract, [abstract?.querySelector(".paper-library-eyebrow"), abstract?.querySelector("h2"), abstract?.querySelector(".paper-detail-abstract")]],
    [citation, [citation?.querySelector(".paper-citation-disclosure")]],
    [record, [record?.querySelector(".paper-library-eyebrow"), record?.querySelector("h2"), record?.querySelector(".paper-detail-list"), record?.querySelector(".paper-record-topics")]],
    [repository, [repository?.querySelector(".paper-repository-card__status"), repository?.querySelector("h2"), repository?.querySelector("p:not(.paper-repository-card__status)"), repository?.querySelector(".paper-repository-card__actions")]],
  ] as const) {
    if (!trigger) {
      continue;
    }
    initScrollReveal({
      trigger,
      targets,
      start: "top bottom-=55",
      from: { autoAlpha: 0, y: 16 },
      to: { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 },
    });
  }
}

function initCitationDisclosureMotion(): void {
  const details = document.querySelector<HTMLDetailsElement>(".paper-citation-disclosure");
  const summary = details?.querySelector<HTMLElement>("summary");
  const panel = details?.querySelector<HTMLElement>(".paper-citation-panel");
  if (!details || !summary || !panel || details.dataset.motionInit === "true") {
    return;
  }

  details.dataset.motionInit = "true";
  markManaged([panel]);

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    if (details.dataset.animating === "true") {
      return;
    }

    if (prefersReducedMotion()) {
      details.open = !details.open;
      return;
    }

    details.dataset.animating = "true";

    if (!details.open) {
      details.open = true;
      trackTween(
        gsap.fromTo(
          panel,
          { height: 0, autoAlpha: 0, y: -8 },
          {
            height: "auto",
            autoAlpha: 1,
            y: 0,
            duration: 0.34,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(panel, { clearProps: `height,${CLEAR_PROPS}` });
              delete details.dataset.animating;
            },
          }
        )
      );
      return;
    }

    trackTween(
      gsap.fromTo(
        panel,
        { height: panel.offsetHeight, autoAlpha: 1, y: 0 },
        {
          height: 0,
          autoAlpha: 0,
          y: -6,
          duration: 0.24,
          ease: "power2.in",
          onComplete: () => {
            details.open = false;
            gsap.set(panel, { clearProps: `height,${CLEAR_PROPS}` });
            delete details.dataset.animating;
          },
        }
      )
    );
  });
}

function initSiteMotion(): void {
  cleanupMotion();
  ScrollTrigger.refresh();

  initCitationDisclosureMotion();

  if (prefersReducedMotion()) {
    return;
  }

  initHomeHeroMotion();
  initHomeSectionMotion();
  initInteriorBannerMotion();
  initIssuesPageMotion();
  initArchivePageMotion();
  initCategoriesPageMotion();
  initPolicyIndexMotion();
  initOurPageMotion();
  initIssueDetailMotion();
  initPaperDetailMotion();
}

export function bootSiteMotion(): void {
  const run = () => window.requestAnimationFrame(() => initSiteMotion());

  if (!window.__siteMotionBound) {
    window.__siteMotionBound = true;
    document.addEventListener("astro:page-load", run);
  }

  run();
}
