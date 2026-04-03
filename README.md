# UNLV Undergraduate Economics Working Paper Series Site

Astro site for the public website of the UNLV Undergraduate Economics Working Paper Series.

## Scope

This repository contains the public-facing site:

- homepage, issues, paper pages, categories, about, contact, and policy pages
- public assets used by the site
- content and metadata used to build the static pages

Operational tooling, unpublished intake workflows, and other internal administration materials are intentionally not included here.

## Site Identity

- Canonical name: **UNLV Undergraduate Economics Working Paper Series**
- Contact label: **Series Team**
- Paper-page disclaimer: **Working paper (not peer-reviewed unless stated)**
- GitHub Pages base path: `/econ495journal_site`

## Tech Stack

- [Astro](https://astro.build/)
- TypeScript
- GSAP for selected page motion

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Default local URL:

- `https://localhost:4321`

The local dev server uses HTTPS, so your browser may show a certificate warning the first time.

## Production Build

```bash
npm run build
```

The build also runs text-contract checks for the homepage, About page, and Contact page.

## Content Structure

- `src/content/papers/`: paper source files
- `public/assets/papers/`: paper PDFs
- `public/assets/issues/`: issue-level downloads
- `src/data/about-content.ts`: About page copy
- `src/data/contact-content.ts`: Contact page copy
- `src/data/public-profiles.ts`: Editorial board and public profile cards

## Public Metadata

This repo also includes:

- `LICENSE`
- `NOTICE`
- `CITATION.cff`
- `CONTRIBUTORS.md`
- `GOVERNANCE.md`

Public-facing attribution appears in the site footer and About page credits section.
