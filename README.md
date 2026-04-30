# UNLV Undergraduate Economics Working Paper Series

Public Astro frontend for the UNLV Undergraduate Economics Working Paper Series.

This site is an open-access frontend and archive for undergraduate economics working papers connected to the UNLV Department of Economics. Working papers are not peer-reviewed unless a paper page explicitly says otherwise. Use "working paper series" or "archive" as the default wording for this project.

## Live Site

Official live site:

https://econ-undergrad-wps.sites.unlv.edu

The current Astro config uses:

- `site: "https://econ-undergrad-wps.sites.unlv.edu"`
- `base: "/"`

This repo is deployed at the domain root. Do not add a repository base path to links or build settings.

## Repository Scope

This public frontend repo contains:

- homepage
- issue pages
- paper pages
- category pages
- About page
- Contact page
- policy pages
- editorial board and graduate assistant profile pages
- public assets used by the site
- generated paper metadata and content consumed by Astro

This public frontend repo does not contain:

- a private admin portal
- unpublished intake files
- authentication or session databases
- private backend runtime data
- raw operations workflow data
- the backend publishing pipeline

The private backend/publishing pipeline lives in a separate repository:

`markjayson13/econ495journal_ops`

Treat that private repo only as an external upstream publishing source. Do not place the backend inside this repo, inside `public_html`, or at `/admin`.

## Tech Stack

- Astro
- TypeScript
- GSAP for selected page motion
- Static HTML/CSS/JS output

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Default local URL:

```text
https://localhost:4321
```

Local development uses HTTPS because `astro.config.mjs` includes `@vitejs/plugin-basic-ssl`. Your browser may show a local certificate warning.

Build the static site:

```bash
npm run build
```

Preview a completed build:

```bash
npm run preview
```

## Production Build

Run:

```bash
npm run build
```

This generates:

```text
dist/
```

The build script also runs:

```bash
npm run verify:text-contracts
```

The verification script checks required text on the built homepage, About page, and Contact page.

## Deploying to UNLV Faculty Sites

Deploy the static build output to UNLV Faculty Sites through cPanel.

1. Run `npm run build`
2. Create a ZIP from the contents inside `dist`, not the `dist` folder itself
3. Upload the ZIP to cPanel File Manager under `/public_html`
4. Extract it into `/public_html`
5. Confirm that `index.html`, `_astro/`, `about/`, `issues/`, `papers/`, `policies/`, `assets/`, and related built folders are directly inside `/public_html`
6. Do not upload `src/`, `node_modules/`, `.git/`, `.astro/`, `package.json`, or the backend repo into cPanel

Terminal packaging command:

```bash
rm -f faculty-sites-dist.zip
cd dist
zip -r ../faculty-sites-dist.zip .
cd ..
```

The generated `faculty-sites-dist.zip` is ignored by git.

## Content Publishing Flow

Paper content is generated upstream by the private backend/publishing pipeline. Generated artifacts should land in this frontend repo under paths such as:

- `src/content/papers/`
- `public/assets/papers/`
- `public/assets/issues/`

After generated content changes are present in this frontend repo, run:

```bash
git status
npm run build
git add .
git commit -m "Publish working paper content"
git push origin main
```

Then package and deploy the new `dist/` output to Faculty Sites.

## Branch Workflow

Use branches and pull requests when branch protection is active:

```bash
git checkout -b docs/example-change
git add .
git commit -m "Describe change"
git push origin docs/example-change
```

## Content and Route Structure

Key source paths:

- `src/pages/`: Astro routes for homepage, issues, papers, categories, profiles, Contact, About, and policies
- `src/content/config.ts`: Astro content collection schemas
- `src/data/about-content.ts`: About page copy and citation template
- `src/data/contact-content.ts`: Contact page copy
- `src/data/public-profiles.ts`: Editorial board and public profile data
- `src/data/issues.ts`: defined issue labels and archive years
- `src/lib/papers.ts`: paper grouping, issue/category helpers, citation formatting, and paper URLs
- `scripts/verify-text-contracts.ts`: post-build text checks
- `scripts/markdown-to-homepage-content.ts`: helper for generating homepage editable content

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for repository roles and change-control expectations:

- Editorial Lead
- Co-Editor
- Technical Maintainer
- Operations Support

## Writing Standards

Public-facing copy should follow [docs/WRITING-STANDARDS.md](docs/WRITING-STANDARDS.md).

In short: use plain institutional language, call the project a working paper series or archive, make disclaimers direct, and avoid marketing copy.
