# ECON 495 Site

Astro front-end replacement for the UNLV ECON 495 Journal public site.

## Design Direction
This implementation intentionally departs from Jekyll Minimal Mistakes for a cleaner Astro-native layout and styling system.

## Current Scope
- Side-by-side Astro project bootstrap.
- Strict one-time importer from Jekyll `assets/data/papers.json` to `src/content/papers/*.md`.
- Core page set implemented in Astro:
  - `/`
  - `/issues`
  - `/issues/[issue]`
  - `/issues/archive`
  - `/papers`
  - `/papers/[slug]`
  - `/categories`
  - `/categories/[category]`
  - `/papers-generated` (client-side filters)
- Legacy route redirects:
  - `/issues/page2`
  - `/issues/page3`
  - `/issues/<issue>/paper-<n>` to `/papers/<slug>/`
  - `/categories/io-and-strategy`
  - `/categories/public-and-policy`
  - `/categories/economic-growth`

## Legacy Parity Status
- Equivalent Astro pages:
  - home, issues listing/detail, paper detail, category index/detail, generated listing, about.
- Legacy pages retained as redirect stubs:
  - issue pagination and selected legacy category routes.
- Remaining Jekyll-only artifacts:
  - kept read-only during cutover; no new content sync targets `_papers_generated/`.

## Prerequisites
- Node.js (LTS) and npm.

## Install
```bash
npm install
```

## Development (HTTPS)
```bash
npm run dev
```

Default local URL:
- `https://localhost:4321`

Note: your browser will show a local certificate warning the first time. Trust it for local development.

## Build
```bash
npm run build
```

## One-time Paper Import (strict JSON mode)
```bash
npm run migrate:papers
```

Or with explicit paths:
```bash
tsx scripts/import-papers-from-jekyll.ts --source /absolute/path/to/assets/data/papers.json --out src/content/papers
```

The importer fails when:
- JSON file is missing,
- JSON array is empty,
- required fields are missing/invalid,
- semester does not match `<Term> <YYYY>`,
- duplicate slugs are found.
