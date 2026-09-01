import { normalizeWhitespace } from "./title";

export const CATALOG_SORT_VALUES = ["newest", "oldest", "title"] as const;
export const DEFAULT_CATALOG_SORT: CatalogSort = "newest";
export const MAX_CATALOG_QUERY_LENGTH = 200;

export type CatalogSort = (typeof CATALOG_SORT_VALUES)[number];

export interface CatalogFilterState {
  q: string;
  field: string;
  issue: string;
  sort: CatalogSort;
}

export interface CatalogFilterOptions {
  fields: readonly string[];
  issues: readonly string[];
}

export const DEFAULT_CATALOG_FILTER_STATE: Readonly<CatalogFilterState> = Object.freeze({
  q: "",
  field: "",
  issue: "",
  sort: DEFAULT_CATALOG_SORT,
});

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;
const SORT_VALUES = new Set<string>(CATALOG_SORT_VALUES);

function queryParameters(input: string | URLSearchParams): URLSearchParams {
  if (input instanceof URLSearchParams) return input;
  return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
}

function singleParameter(parameters: URLSearchParams, name: string): string {
  const values = parameters.getAll(name);
  return values.length === 1 ? values[0] : "";
}

function normalizedQuery(value: string): string {
  const normalized = normalizeWhitespace(value.replace(CONTROL_CHARACTERS, " "));
  return [...normalized].slice(0, MAX_CATALOG_QUERY_LENGTH).join("").trim();
}

function allowedSlug(value: string, allowedValues: readonly string[]): string {
  const requested = value.trim().toLocaleLowerCase("en-US");
  if (!requested) return "";

  const matchingValue = allowedValues.find(
    (allowedValue) => allowedValue.toLocaleLowerCase("en-US") === requested,
  );
  return matchingValue ?? "";
}

function allowedSort(value: string): CatalogSort {
  const requested = value.trim().toLocaleLowerCase("en-US");
  return SORT_VALUES.has(requested) ? (requested as CatalogSort) : DEFAULT_CATALOG_SORT;
}

/**
 * Parses the catalog's public query contract. Duplicate, unknown, and
 * out-of-domain values resolve to safe defaults instead of reaching the UI.
 */
export function parseCatalogFilterState(
  input: string | URLSearchParams,
  options: CatalogFilterOptions,
): CatalogFilterState {
  const parameters = queryParameters(input);
  return {
    q: normalizedQuery(singleParameter(parameters, "q")),
    field: allowedSlug(singleParameter(parameters, "field"), options.fields),
    issue: allowedSlug(singleParameter(parameters, "issue"), options.issues),
    sort: allowedSort(singleParameter(parameters, "sort")),
  };
}

/**
 * Serializes filters in one stable order and omits empty/default state.
 * Supplying the allowed values here prevents callers from emitting links that
 * the catalog cannot restore.
 */
export function serializeCatalogFilterState(
  state: Partial<CatalogFilterState>,
  options: CatalogFilterOptions,
): string {
  const parameters = new URLSearchParams();
  const query = normalizedQuery(state.q ?? "");
  const field = allowedSlug(state.field ?? "", options.fields);
  const issue = allowedSlug(state.issue ?? "", options.issues);
  const sort = allowedSort(state.sort ?? DEFAULT_CATALOG_SORT);

  if (query) parameters.set("q", query);
  if (field) parameters.set("field", field);
  if (issue) parameters.set("issue", issue);
  if (sort !== DEFAULT_CATALOG_SORT) parameters.set("sort", sort);

  return parameters.toString();
}

export function formatPaperCount(count: number): string {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Paper count must be a non-negative safe integer.");
  }
  return `${count} ${count === 1 ? "paper" : "papers"}`;
}

export function formatCatalogResultCount(count: number): string {
  return `Showing ${formatPaperCount(count)}`;
}
