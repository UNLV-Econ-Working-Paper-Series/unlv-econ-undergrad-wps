# Deployment architecture

Status: code-complete target architecture; production operator confirmation remains open

Production domain: `https://econ-undergrad-wps.sites.unlv.edu`

Verified: August 31, 2026

## Canonical path

The GitHub repository is the reviewed source of truth. GitHub Actions verifies pull requests and retains build evidence. The production site is a static Astro build served at the domain root by UNLV Faculty Sites. An authorized Faculty Sites operator deploys the verified release ZIP through cPanel or another institutionally approved file-transfer path.

```text
feature branch -> pull request -> deterministic CI -> approved main commit
  -> verified dist build -> deterministic ZIP + checksums
  -> authorized Faculty Sites operator -> /public_html
  -> live fingerprint and smoke verification
```

GitHub Pages is not production or staging for this project. On the audit date it was configured at `/unlv-econ-undergrad-wps/`, while the production build correctly uses `base: "/"`. That mismatch caused root-relative assets on the Pages surface to fail. The repository's automatic Pages deployment is therefore removed; an owner must disable the stale Pages setting after this pull request is approved.

## Release inputs

An eligible release must identify:

- approved source commit SHA;
- package version;
- Node and npm versions;
- successful deterministic release verification;
- external OAsis/DOI audit result or documented network limitation;
- release build manifest;
- ZIP SHA-256 and internal `SHA256SUMS.txt`;
- retained prior production artifact;
- authorized deployment operator and approval record.

## Build and package

From a clean checkout of the approved commit:

```bash
npm ci
npm run verify:release
npm run package:faculty-sites
(cd artifacts && shasum -a 256 -c faculty-sites-dist.zip.sha256)
RELEASE_COMMIT_SHA=<approved-40-character-sha> \
  node scripts/verify-release-artifact.mjs artifacts/faculty-sites-dist.zip
```

The packager includes the contents of `dist/`, not a `dist` wrapper. It rejects symbolic links and private/source-file patterns, adds a sorted checksum manifest, writes the artifact under `artifacts/`, and verifies the completed ZIP.

Do not package `.git`, `src`, `node_modules`, local environment files, intake materials, the private operations repository, raw evidence, or source documents.

## Predeployment gate

The authorized operator must:

1. confirm the intended commit and artifact checksums against the release report;
2. download or copy the current production tree into access-controlled backup storage;
3. retain the previous release ZIP and fingerprint;
4. confirm the production document root and the supported custom-404/header configuration with Faculty Sites;
5. use a staging location or atomic directory switch if the host supports it;
6. avoid mixing files from different builds.

## Deployment

The exact cPanel control names can vary, so the authorized operator must confirm them before changing production.

1. Open the file manager for the production account.
2. Confirm that the document root for `econ-undergrad-wps.sites.unlv.edu` is `/public_html` or record the actual path.
3. Upload the verified `faculty-sites-dist.zip` outside the live document root when possible.
4. Extract into an empty staging directory.
5. Verify the external `.sha256` companion, then compare the extracted `SHA256SUMS.txt` and `build-manifest.json` with the release report.
6. Move or switch the complete staged contents into the document root using the host's safest supported atomic method.
7. Do not leave the uploaded ZIP, backups, source files, or private files web-accessible.
8. Run `npm run verify:production -- --origin https://econ-undergrad-wps.sites.unlv.edu --expected-commit <SHA>` from a trusted machine.
9. Record the operator, date, live fingerprint, smoke result, and any host-level changes.

## Postdeployment verification

Do not declare deployment complete until the production checker verifies:

- fingerprint and expected commit;
- homepage and representative paper, issue, field, policy, Contact, and 404 routes;
- DOI, OAsis item, and OAsis PDF behavior;
- sitemap and robots;
- citation downloads and MIME types;
- CSS/JavaScript assets;
- canonical, Open Graph, scholarly meta, and JSON-LD;
- HTTPS redirect and security headers.

Then use a real browser to inspect the console and verify mobile navigation, narrow reflow, and horizontal overflow. The HTTP production checker cannot prove those browser-only behaviors.

## Current external blocker

`DEPLOY-001` remains open: the authorized production owner, staging support, backup location, atomic replacement method, header authority, and rollback authority require institutional confirmation. This repository can produce a verified artifact, but code contributors must not claim or perform production deployment without that authorization.
