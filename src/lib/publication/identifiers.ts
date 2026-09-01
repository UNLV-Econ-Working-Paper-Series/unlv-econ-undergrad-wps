const SERIES_IDENTIFIER = /^UNLV-Econ-WPS-(\d{4})-(?!000$)(\d{3})$/u;

export interface ParsedSeriesIdentifier {
  year: number;
  sequence: number;
}

export function isSeriesIdentifier(value: string): boolean {
  return SERIES_IDENTIFIER.test(value.trim());
}

export function parseSeriesIdentifier(value: string): ParsedSeriesIdentifier {
  const normalized = value.trim();
  const match = normalized.match(SERIES_IDENTIFIER);
  if (!match) {
    throw new Error(`Invalid Series identifier: ${JSON.stringify(value)}.`);
  }
  return {
    year: Number.parseInt(match[1], 10),
    sequence: Number.parseInt(match[2], 10),
  };
}

export function formatSeriesIdentifier(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error("Series identifier year must be a four-digit integer.");
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new Error("Series identifier sequence must be between 1 and 999.");
  }
  return `UNLV-Econ-WPS-${year}-${String(sequence).padStart(3, "0")}`;
}

export function assertUniqueSeriesIdentifiers(values: readonly string[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    parseSeriesIdentifier(value);
    const normalized = value.trim();
    if (seen.has(normalized)) duplicates.add(normalized);
    seen.add(normalized);
  }
  if (duplicates.size > 0) {
    throw new Error(`Duplicate Series identifier${duplicates.size === 1 ? "" : "s"}: ${[...duplicates].sort().join(", ")}.`);
  }
}
