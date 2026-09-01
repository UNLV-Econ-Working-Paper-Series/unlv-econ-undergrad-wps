# UNLV Undergraduate Economics Working Paper Series

Public discovery and reading site for the UNLV Undergraduate Economics Working Paper Series.

The Series publishes original economics-related working papers by UNLV undergraduates. It is operated by its Editorial Board within the Molasky Family Department of Economics and Real Estate, Lee Business School, University of Nevada, Las Vegas. Papers are editorially screened, are not peer reviewed, and may be revised.

The custom site organizes papers, authors, issues, research fields, citations, policies, and accessibility information. [OAsis](https://oasis.library.unlv.edu/econ_ug_papers/) is the institutional repository and permanent repository record for deposited papers.

## Production boundary

The canonical public origin is <https://econ-undergrad-wps.sites.unlv.edu>. The Astro build uses the domain root (`base: "/"`). GitHub Pages is neither production nor staging and must not be treated as deployment evidence.

This repository contains only public source, public records, release tooling, and static assets. It must not contain submissions, consent evidence, ballots, review notes, decision records, mailbox exports, credentials, or restricted editorial records.

## Supported toolchain

- Node 24.16.0 (see `.nvmrc`)
- npm 11.13.0 and the committed lockfile
- Astro 7.2.10
- TypeScript 6
- Playwright for browser and accessibility checks

Use the pinned runtime before installing:

```bash
nvm use
npm ci
```

Install the browser engines once on a development machine:

```bash
npx playwright install chromium firefox webkit
```

## Local development

```bash
npm run dev
```

The default local URL is `http://127.0.0.1:4321`. Local development is HTTP on the loopback interface; there is no self-signed-certificate plugin.

Build and preview the static site:

```bash
npm run build
npm run preview
```

## Verification

The complete deterministic and browser release gate is:

```bash
npm run verify:release
```

It runs formatting, lint, Astro and TypeScript checks, publication unit tests, schema/content validation, the production build, copy and governance contracts, scholarly metadata and sitemap checks, internal-link checks, performance budgets, Playwright browser behavior, and axe accessibility checks. External services are intentionally excluded from this ordinary gate.

Focused commands are also available:

```bash
npm run check
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run test:a11y
npm run verify:content
npm run verify:metadata
npm run verify:internal-links
npm run verify:performance
npm run verify:external-records
npm run verify:external-links
npm run audit:lighthouse
```

Run `npm audit` during release review and record the exact result. Do not use `npm audit fix --force` as a substitute for reviewing a framework-major upgrade.

## Content architecture

Important public paths:

- `src/content.config.ts`: Astro content collections
- `src/content/paper-schema.ts`: strict public paper record schema
- `src/content/papers/`: the 15 current structured paper records
- `src/config/publication.ts`: institutional identity and controlled research fields
- `src/config/editorial.ts`: public editorial roles
- `src/lib/publication/`: citation, metadata, date, identifier, version, and catalog utilities
- `src/pages/`: canonical routes and supported legacy aliases
- `docs/governance/`: publication governance and editorial authority
- `docs/archive/`: metadata-only historical inventory and migration controls
- `docs/operations/`: release, deployment, and rollback runbooks

Current paper metadata may be audited and migrated with:

```bash
npm run migrate:papers
```

The write form is deliberately separate:

```bash
npm run migrate:papers:write
```

Review the diff and rerun the full release gate after any migration. Never infer issue-release dates, rights, faculty sponsorship, or private consent from semester labels or public availability.

## Branch and review workflow

All public changes use a feature branch and pull request:

```bash
git switch -c feat/descriptive-change
npm ci
npm run verify:release
git add <reviewed-files>
git commit -m "Describe the reviewed change"
git push -u origin feat/descriptive-change
```

Do not push publication changes directly to `main`. Use the repository's pull-request and review controls.

## Release artifact

After the approved commit passes the release gate:

```bash
npm run package:faculty-sites
```

This produces and verifies:

- `artifacts/faculty-sites-dist.zip`
- `artifacts/faculty-sites-dist.zip.sha256`
- an internal `SHA256SUMS.txt`
- root-level `build-manifest.json`

The ZIP contains the contents of `dist/`, not a `dist` wrapper. The packager rejects symbolic links, nested ZIPs, source/private paths, and missing required root files.
It also re-reads Git independently and refuses to package a dirty tree, a mismatched commit, or a forged clean-source claim.

Verify the external ZIP checksum and the embedded checksum/fingerprint gate before upload:

```bash
(cd artifacts && shasum -a 256 -c faculty-sites-dist.zip.sha256)
RELEASE_COMMIT_SHA=<approved-40-character-sha> \
  node scripts/verify-release-artifact.mjs artifacts/faculty-sites-dist.zip
```

Creating the artifact is not deployment. Only an authorized Faculty Sites operator may change production after confirming the backup, custom-404, hosting, and rollback requirements. Follow the [deployment architecture](docs/operations/DEPLOYMENT_ARCHITECTURE.md), [release checklist](docs/operations/RELEASE_CHECKLIST.md), and [rollback runbook](docs/operations/ROLLBACK.md).

After an authorized deployment, verify the live commit and host behavior:

```bash
npm run verify:production -- \
  --origin https://econ-undergrad-wps.sites.unlv.edu \
  --expected-commit <approved-40-character-sha>
```

The automated production checker verifies the fingerprint, representative routes, assets, citation MIME types, redirects, 404 behavior, metadata, and security headers. It cannot inspect a real mobile layout or browser console remotely. The authorized operator must complete those two browser checks separately before calling a release live.

## External scholarly checks

DOI and OAsis checks are retried, evidence-producing, and separate from normal CI:

```bash
npm run verify:external-records
npm run verify:external-links
```

HTTP restrictions on repository PDFs are transport observations, not metadata mismatches or PDF accessibility findings. Full PDF accessibility remains a manual/document-remediation responsibility.

Search and Scholar operations are bounded by the [Google Search runbook](docs/release/GOOGLE_SEARCH_REINDEXING.md) and [Google Scholar monitoring runbook](docs/release/GOOGLE_SCHOLAR_MONITORING.md). Neither indexing nor timing is guaranteed.

## Governance and writing

Repository change control is summarized in [GOVERNANCE.md](GOVERNANCE.md). Publication authority is defined in [publication governance](docs/governance/PUBLICATION_GOVERNANCE.md).

Public copy follows [writing standards](docs/WRITING-STANDARDS.md): use plain institutional language, distinguish the Editorial Board from Junior Editors, state the working-paper and non-peer-reviewed status clearly, and never describe OAsis as the publisher.
