const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/iu;
const OASIS_HOST = "oasis.library.unlv.edu";

function stripTerminalPunctuation(value: string): string {
  return value.replace(/[.,;]+$/u, "");
}

export function normalizeDoi(value: string): string {
  let normalized = value.trim();
  normalized = normalized.replace(/^doi\s*:\s*/iu, "");
  normalized = normalized.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "");
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    throw new Error(`DOI contains invalid percent encoding: ${JSON.stringify(value)}.`);
  }
  normalized = stripTerminalPunctuation(normalized.trim()).toLocaleLowerCase("en-US");
  if (!DOI_PATTERN.test(normalized) || /\s/u.test(normalized)) {
    throw new Error(`Invalid DOI: ${JSON.stringify(value)}.`);
  }
  return normalized;
}

export function doiUrl(value: string): string {
  return `https://doi.org/${normalizeDoi(value)}`;
}

export const OASIS_DISPLAY_NAME = "OAsis";

export function normalizeOasisUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`Invalid OAsis URL: ${JSON.stringify(value)}.`);
  }
  if (url.hostname.toLocaleLowerCase("en-US") !== OASIS_HOST) {
    throw new Error(`OAsis URL must use ${OASIS_HOST}.`);
  }
  url.protocol = "https:";
  url.username = "";
  url.password = "";
  url.port = "";
  url.search = "";
  url.hash = "";

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0]?.toLocaleLowerCase("en-US") === "econ_ug_papers") {
    segments[0] = "econ_ug_papers";
  }
  url.pathname = `/${segments.join("/")}${segments.length > 0 ? "/" : ""}`;
  return url.toString();
}

export function isOasisUrl(value: string): boolean {
  try {
    normalizeOasisUrl(value);
    return true;
  } catch {
    return false;
  }
}
