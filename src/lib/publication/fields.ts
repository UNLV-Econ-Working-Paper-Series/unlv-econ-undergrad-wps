import {
  RESEARCH_FIELDS,
  RESEARCH_FIELD_ALIASES,
  type ResearchField,
} from "../../config/publication";

export { RESEARCH_FIELDS };
export type { ResearchField };

function lookupKey(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/&/gu, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

const FIELD_LOOKUP = new Map<string, ResearchField>();
for (const field of RESEARCH_FIELDS) FIELD_LOOKUP.set(lookupKey(field), field);
for (const [alias, field] of Object.entries(RESEARCH_FIELD_ALIASES)) {
  FIELD_LOOKUP.set(lookupKey(alias), field);
}

export function tryMapResearchField(value: string): ResearchField | null {
  return FIELD_LOOKUP.get(lookupKey(value)) ?? null;
}

export function mapResearchField(value: string): ResearchField {
  const field = tryMapResearchField(value);
  if (!field) {
    throw new Error(`Unknown research field: ${JSON.stringify(value)}.`);
  }
  return field;
}

export function isResearchField(value: string): value is ResearchField {
  return RESEARCH_FIELDS.includes(value as ResearchField);
}

export function researchFieldSlug(field: ResearchField): string {
  return field
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
