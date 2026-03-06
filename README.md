# UNLV Undergraduate Economics Working Paper Series Site

Astro front-end replacement for the UNLV Undergraduate Economics Working Paper Series public site.

## Rebrand Notes
- Canonical publication name: **UNLV Undergraduate Economics Working Paper Series**.
- Contact label: **Series Team**.
- Citation label/output uses: **UNLV Undergraduate Economics Working Paper Series**.
- Paper-page disclaimer uses: **Working paper (not peer-reviewed unless stated)**.
- GitHub Pages path is still `/econ495journal_site` in `astro.config.mjs` for compatibility with the current repository URL.

## Attribution and Governance Files
- `LICENSE` (All Rights Reserved — see file for terms)
- `NOTICE`
- `CITATION.cff`
- `CONTRIBUTORS.md`
- `GOVERNANCE.md`

Public-facing attribution appears in the site footer and About page credits section.

## Handoff Packet
- This repo handoff docs: `handoff/`
- Admin runtime handoff docs: `../private-ops-repo/handoff/`

## Design Direction
This implementation intentionally departs from Jekyll Minimal Mistakes for a cleaner Astro-native layout and styling system.

## Current Scope
- Side-by-side Astro project bootstrap.
- Strict one-time importer from Jekyll `assets/data/papers.json` to `src/content/papers/*.md`.
- OAsis mirror support is present in schema (`oasis_url`) and is not active yet and still department-determined.
- Citation URL generation currently uses local paper URLs because OAsis mirroring is not active yet and still department-determined.
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

`build` also verifies stable text contracts for the homepage, `About`, and `Contact` pages so text-dependent web automations do not silently break.

## Backend-ready Page Content
- About page content contract: `src/data/about-content.ts`
- Contact page content contract: `src/data/contact-content.ts`
- Public people/profile projection for About cards: `src/data/public-profiles.ts`

These modules are intended to hold backend-managed content while the page structure and styling stay in:
- `src/pages/about.astro`
- `src/pages/contact.astro`

## OAsis Mirror Status
- OAsis mirror status: not active yet and still department-determined.
- Content schema includes optional `oasis_url` on paper entries.
- Paper detail pages only show OAsis links after mirror activation.
- Admin metadata updates from ops (`tools/link_oasis.py` or portal actions) should be treated as pre-provisioned capability while status is not active yet and still department-determined.

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

## Homepage Backend Content Sync (Markdown -> TS)
Use this to generate `src/data/homepage-content.ts` from one markdown blob so backend can update both Home cards without touching Astro templates.

```bash
npm run generate:homepage-content -- --input scripts/homepage-content.md
```

Read from stdin (useful for backend posting a blob):
```bash
cat /path/to/homepage-content.md | npm run generate:homepage-content -- --stdin
```

Input format:
- Frontmatter for text/link fields (title, meta text, CTAs, empty states).
- `## Featured Items` bullet list for Latest Issue featured entries.
- `## News and Events` bullet list for the News and Events card.

Template file:
- `scripts/homepage-content.md`
