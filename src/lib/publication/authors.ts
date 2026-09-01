import type { PublicationAuthor } from "./types";
import { normalizeWhitespace } from "./title";

const FAMILY_PARTICLES = new Set([
  "al",
  "bin",
  "da",
  "de",
  "del",
  "della",
  "der",
  "di",
  "dos",
  "du",
  "la",
  "le",
  "van",
  "von",
]);
const SUFFIX = /^(?:jr\.?|sr\.?|ii|iii|iv)$/iu;

export interface ParsedPersonName {
  given: string;
  family: string;
  suffix?: string;
}

export interface AuthorMachineMetadata {
  name: string;
  affiliation?: string;
  orcid?: string;
  institutionalProfile?: string;
  publicProfile?: string;
}

export function validateAuthors(authors: readonly PublicationAuthor[]): void {
  if (authors.length === 0) {
    throw new Error("At least one author is required.");
  }
  authors.forEach((author, index) => {
    if (!normalizeWhitespace(author.name)) {
      throw new Error(`Author ${index + 1} must have a name.`);
    }
  });
}

export function parsePersonName(value: string): ParsedPersonName {
  const name = normalizeWhitespace(value);
  if (!name) throw new Error("Author name must not be empty.");

  const commaParts = name.split(",").map(normalizeWhitespace).filter(Boolean);
  if (commaParts.length >= 2) {
    const family = commaParts[0];
    const givenAndSuffix = commaParts.slice(1).join(" ");
    const tokens = givenAndSuffix.split(" ");
    const last = tokens.at(-1) ?? "";
    const suffix = SUFFIX.test(last) ? tokens.pop() : undefined;
    return { family, given: tokens.join(" "), ...(suffix ? { suffix } : {}) };
  }

  const tokens = name.split(" ");
  const finalToken = tokens.at(-1) ?? "";
  const suffix = SUFFIX.test(finalToken) ? tokens.pop() : undefined;
  if (tokens.length === 1) {
    return { given: "", family: tokens[0], ...(suffix ? { suffix } : {}) };
  }

  let familyStart = tokens.length - 1;
  while (familyStart > 0 && FAMILY_PARTICLES.has(tokens[familyStart - 1].toLocaleLowerCase("en-US"))) {
    familyStart -= 1;
  }

  const given = tokens.slice(0, familyStart).join(" ");
  const family = tokens.slice(familyStart).join(" ");
  return { given, family, ...(suffix ? { suffix } : {}) };
}

export function authorInitials(given: string): string {
  return given
    .split(/[\s-]+/u)
    .filter(Boolean)
    .map((part) => `${Array.from(part)[0]?.toLocaleUpperCase() ?? ""}.`)
    .join(" ");
}

export function formatInvertedAuthor(author: PublicationAuthor, useInitials = false): string {
  const { given, family, suffix } = parsePersonName(author.name);
  const givenPart = useInitials ? authorInitials(given) : given;
  const main = givenPart ? `${family}, ${givenPart}` : family;
  return suffix ? `${main}, ${suffix}` : main;
}

export function joinHumanList(values: readonly string[], conjunction = "and"): string {
  const items = values.map(normalizeWhitespace).filter(Boolean);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items.at(-1)}`;
}

export function formatAuthorDisplay(authors: readonly PublicationAuthor[]): string {
  validateAuthors(authors);
  return joinHumanList(authors.map((author) => normalizeWhitespace(author.name)));
}

export function authorMachineMetadata(authors: readonly PublicationAuthor[]): AuthorMachineMetadata[] {
  validateAuthors(authors);
  return authors.map((author) => ({
    name: normalizeWhitespace(author.name),
    ...(author.affiliation ? { affiliation: normalizeWhitespace(author.affiliation) } : {}),
    ...(author.orcid ? { orcid: author.orcid.trim() } : {}),
    ...(author.institutional_profile ? { institutionalProfile: author.institutional_profile.trim() } : {}),
    ...(author.public_profile ? { publicProfile: author.public_profile.trim() } : {}),
  }));
}
