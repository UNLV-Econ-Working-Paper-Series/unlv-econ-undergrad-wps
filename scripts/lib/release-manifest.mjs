export const RELEASE_MANIFEST_SCHEMA_VERSION = 1;
export const RELEASE_SITE = "https://econ-undergrad-wps.sites.unlv.edu/";
export const RELEASE_SOURCE_REPOSITORY =
  "https://github.com/UNLV-Econ-Working-Paper-Series/unlv-econ-undergrad-wps";

const REQUIRED_KEYS = [
  "schema_version",
  "site",
  "source_repository",
  "release_version",
  "commit",
  "source_tree",
  "built_at",
];

function isCanonicalUtcTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function validateReleaseManifest(
  value,
  { expectedVersion, expectedCommit, requireCleanSource = true } = {},
) {
  const issues = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["manifest must be a JSON object"];
  }

  const keys = Object.keys(value);
  for (const key of REQUIRED_KEYS) {
    if (!Object.hasOwn(value, key)) issues.push(`missing required field ${key}`);
  }
  for (const key of keys) {
    if (!REQUIRED_KEYS.includes(key)) issues.push(`unexpected field ${key}`);
  }

  if (value.schema_version !== RELEASE_MANIFEST_SCHEMA_VERSION) {
    issues.push(`schema_version must equal ${RELEASE_MANIFEST_SCHEMA_VERSION}`);
  }
  if (value.site !== RELEASE_SITE) issues.push(`site must equal ${RELEASE_SITE}`);
  if (value.source_repository !== RELEASE_SOURCE_REPOSITORY) {
    issues.push(`source_repository must equal ${RELEASE_SOURCE_REPOSITORY}`);
  }

  if (typeof value.release_version !== "string" || !value.release_version.trim()) {
    issues.push("release_version must be a non-empty string");
  } else {
    if (value.release_version.trim().toLowerCase() === "unversioned") {
      issues.push("release_version must not be unversioned");
    }
    if (expectedVersion && value.release_version !== expectedVersion) {
      issues.push(
        `release_version ${JSON.stringify(value.release_version)} does not match package version ${JSON.stringify(expectedVersion)}`,
      );
    }
  }

  if (
    typeof value.commit !== "string" ||
    !/^[a-f0-9]{40}$/u.test(value.commit) ||
    /^0{40}$/u.test(value.commit)
  ) {
    issues.push("commit must be a non-placeholder lowercase 40-character Git SHA");
  }
  if (expectedCommit) {
    if (!/^[a-f0-9]{40}$/u.test(expectedCommit) || /^0{40}$/u.test(expectedCommit)) {
      issues.push("expected commit must be a non-placeholder lowercase 40-character Git SHA");
    } else if (value.commit !== expectedCommit) {
      issues.push(`commit ${JSON.stringify(value.commit)} does not match expected commit ${expectedCommit}`);
    }
  }

  if (requireCleanSource && value.source_tree !== "clean") {
    issues.push('source_tree must equal "clean" for a release artifact');
  } else if (!requireCleanSource && !["clean", "dirty", "unknown"].includes(value.source_tree)) {
    issues.push('source_tree must equal "clean", "dirty", or "unknown"');
  }
  if (!isCanonicalUtcTimestamp(value.built_at)) {
    issues.push("built_at must be a canonical UTC ISO-8601 timestamp with millisecond precision");
  }

  return issues;
}

export function parseAndValidateReleaseManifest(source, options = {}) {
  let manifest;
  try {
    manifest = JSON.parse(typeof source === "string" ? source : new TextDecoder().decode(source));
  } catch (error) {
    throw new Error(
      `build-manifest.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const issues = validateReleaseManifest(manifest, options);
  if (issues.length > 0) {
    throw new Error(
      `build-manifest.json failed release validation:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
  }
  return manifest;
}
