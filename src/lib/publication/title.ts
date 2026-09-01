const LEGACY_NUMBER_PREFIX = /^paper\s*\d+\s*:\s*/iu;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function normalizePaperTitle(value: string): string {
  const title = normalizeWhitespace(value).replace(LEGACY_NUMBER_PREFIX, "").trim();
  if (!title) {
    throw new Error("Paper title must not be empty.");
  }
  return title;
}

export function withTerminalPunctuation(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";
  return /[.!?…]$/u.test(normalized) ? normalized : `${normalized}.`;
}

export function quoteTitle(value: string): string {
  return `“${normalizePaperTitle(value)}”`;
}
