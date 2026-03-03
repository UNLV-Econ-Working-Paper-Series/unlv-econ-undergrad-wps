export interface CategoryDefinition {
  name: string;
  slug: string;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { name: "Applied Microeconomics", slug: "applied-microeconomics" },
  { name: "Macroeconomics", slug: "macroeconomics" },
  { name: "Public Economics & Policy", slug: "public-economics-and-policy" },
  { name: "Labor and Demography", slug: "labor-and-demography" },
  { name: "Health", slug: "health" },
  { name: "Education", slug: "education" },
  { name: "International", slug: "international" },
  { name: "Finance", slug: "finance" },
  { name: "Industrial Organization (IO) & Strategy", slug: "industrial-organization-io-and-strategy" },
  { name: "Environmental and Resource", slug: "environmental-and-resource" },
  { name: "Economic History and Institutions", slug: "economic-history-and-institutions" },
  { name: "Methods and Econometrics", slug: "methods-and-econometrics" },
  { name: "Development Economics", slug: "development-economics" },
  { name: "Behavioral & Experimental Economics", slug: "behavioral-and-experimental-economics" },
  { name: "Urban, Regional, & Real Estate Economics", slug: "urban-regional-and-real-estate-economics" },
  { name: "Political Economy", slug: "political-economy" },
  { name: "Economic Theory / Game Theory", slug: "economic-theory-and-game-theory" },
];

export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  "io-and-strategy": "/categories/industrial-organization-io-and-strategy/",
  "public-and-policy": "/categories/public-economics-and-policy/",
  "economic-growth": "/categories/",
};

const slugByName = new Map(CATEGORY_DEFINITIONS.map((item) => [item.name, item.slug]));
const nameBySlug = new Map(CATEGORY_DEFINITIONS.map((item) => [item.slug, item.name]));

export function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[(),]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categorySlugForName(name: string): string {
  return slugByName.get(name) ?? slugifyCategoryName(name);
}

export function categoryNameForSlug(slug: string): string | undefined {
  return nameBySlug.get(slug);
}
