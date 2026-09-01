import {
  RESEARCH_FIELD_ALIASES,
  RESEARCH_FIELDS,
  type ResearchField,
} from "../config/publication";

const controlledFieldSet = new Set<string>(RESEARCH_FIELDS);

export function normalizeResearchField(value: string): ResearchField | undefined {
  const candidate = value.trim();
  if (controlledFieldSet.has(candidate)) return candidate as ResearchField;
  return RESEARCH_FIELD_ALIASES[candidate];
}

export function requireResearchField(value: string): ResearchField {
  const field = normalizeResearchField(value);
  if (!field) throw new Error(`Unmapped research field: ${JSON.stringify(value)}`);
  return field;
}

export function researchFieldSlug(field: ResearchField): string {
  return field
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function researchFieldHref(value: string): string {
  const field = requireResearchField(value);
  return `/fields/${researchFieldSlug(field)}/`;
}

export function researchFieldFromSlug(slug: string): ResearchField | undefined {
  return RESEARCH_FIELDS.find((field) => researchFieldSlug(field) === slug);
}
