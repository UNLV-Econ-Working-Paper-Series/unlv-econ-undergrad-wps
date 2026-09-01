import { RESEARCH_FIELDS, type ResearchField } from "../config/publication";
import {
  mapResearchField,
  researchFieldSlug as controlledResearchFieldSlug,
  tryMapResearchField,
} from "./publication/fields";

export function normalizeResearchField(value: string): ResearchField | undefined {
  return tryMapResearchField(value) ?? undefined;
}

export function requireResearchField(value: string): ResearchField {
  return mapResearchField(value);
}

export function researchFieldSlug(field: ResearchField): string {
  return controlledResearchFieldSlug(field);
}

export function researchFieldHref(value: string): string {
  const field = requireResearchField(value);
  return `/fields/${researchFieldSlug(field)}/`;
}

export function researchFieldFromSlug(slug: string): ResearchField | undefined {
  return RESEARCH_FIELDS.find((field) => researchFieldSlug(field) === slug);
}
