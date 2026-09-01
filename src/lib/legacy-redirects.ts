import { CATEGORY_DEFINITIONS } from "../data/categories";
import { researchFieldHref } from "./research-fields";

export const FIXED_LEGACY_REDIRECTS = Object.freeze({
  "/categories/": "/fields/",
  "/categories/economic-growth/": "/fields/",
  "/categories/io-and-strategy/": "/fields/industrial-organization/",
  "/categories/public-and-policy/": "/fields/public-economics/",
  "/graduate-assistants/": "/editorial-board/#junior-editors",
  "/our/": "/for-authors/",
} as const);

function canonicalLegacyPath(pathname: string): string | null {
  if (!pathname.startsWith("/") || pathname.includes("?") || pathname.includes("#")) return null;
  const collapsed = pathname.replace(/\/{2,}/gu, "/");
  return collapsed.endsWith("/") ? collapsed : `${collapsed}/`;
}

export function legacyRedirectTarget(
  pathname: string,
  availableFieldPaths?: ReadonlySet<string>,
): string | null {
  const canonical = canonicalLegacyPath(pathname);
  if (!canonical) return null;

  const fixed = FIXED_LEGACY_REDIRECTS[canonical as keyof typeof FIXED_LEGACY_REDIRECTS];
  if (fixed) return fixed;

  const match = canonical.match(/^\/categories\/([a-z0-9-]+)\/$/u);
  if (!match) return null;
  const category = CATEGORY_DEFINITIONS.find((candidate) => candidate.slug === match[1]);
  if (!category) return null;
  const fieldPath = researchFieldHref(category.name);
  return availableFieldPaths && !availableFieldPaths.has(fieldPath) ? "/fields/" : fieldPath;
}
