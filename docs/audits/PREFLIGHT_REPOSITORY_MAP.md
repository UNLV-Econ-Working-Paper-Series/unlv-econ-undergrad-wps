# Phase 0 Preflight Repository Map

Audit date: 2026-08-31  
Audited commit: `b9bdf5de16ae8e44d47b83203949ad70008d61ae`  
Feature branch: `feat/publication-infrastructure-release`  
Isolated worktree: `tmp/publication-infrastructure-release`

## Isolation and baseline

The implementation is isolated from the original checkout. The original checkout contained a user-owned `.gitignore` modification and an untracked `faculty-sites-dist.zip`; neither item was copied, modified, staged, or committed to this branch.

The feature branch was created directly from `origin/main` at the audited commit above. Its production target is the separately hosted Faculty Sites origin at `https://econ-undergrad-wps.sites.unlv.edu/`. The GitHub Pages workflow is a second deployment surface and is not evidence that the Faculty Sites origin was updated.

## Application architecture

| Area                  | Current implementation                                 | Current source of truth                                           |
| --------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Framework             | Astro 5 static site                                    | `astro.config.mjs`, `package.json`                                |
| Papers                | Astro content collection                               | `src/content/papers/*.md`, `src/content.config.ts`                |
| Paper utilities       | Normalization, citations, filters, issue helpers       | `src/lib/papers.ts`                                               |
| Issues                | Hand-maintained TypeScript registry                    | `src/data/issues.ts`                                              |
| Research categories   | Hand-maintained TypeScript registry                    | `src/data/categories.ts`                                          |
| Historical archive    | Metadata-only TypeScript registry                      | `src/data/archive-papers.ts`                                      |
| Editorial profiles    | Public TypeScript registry and Markdown profile        | `src/data/public-profiles.ts`, `src/content/graduate-assistants/` |
| Public copy           | TypeScript data modules plus page-local strings        | `src/data/*.ts`, `src/pages/**/*.astro`                           |
| Layout and navigation | Shared Astro layout                                    | `src/layouts/BaseLayout.astro`                                    |
| Styling               | Site-wide CSS plus viewer-readiness overrides          | `src/styles/global.css`, `src/styles/viewer-readiness.css`        |
| Motion                | GSAP plus site motion controller                       | `src/scripts/site-motion.ts`, `src/layouts/BaseLayout.astro`      |
| Deployment            | GitHub Pages workflow and manual Faculty Sites package | `.github/workflows/deploy.yml`, `README.md`                       |
| Private operations    | Separate private repository                            | `markjayson13/econ495journal_ops`                                 |

The public repository contains 15 paper records. The existing flat schema stores authors as strings and uses `published_at` for what is currently the OAsis repository posting date. The release work must preserve that date as `repository_published_at` rather than infer an issue-release date.

## Public route inventory at baseline

| Surface            | Baseline route or pattern                               | Notes                                                       |
| ------------------ | ------------------------------------------------------- | ----------------------------------------------------------- |
| Home               | `/`                                                     | Marketing-style hero, latest issue, launch news, categories |
| Papers             | `/papers/`                                              | Search/filter interface and card grid                       |
| Paper record       | `/papers/[slug]/`                                       | Abstract, metadata, citation dialog, OAsis link             |
| Issues             | `/issues/`                                              | Current and prior issue navigation                          |
| Issue              | `/issues/[issue]/`                                      | Issue-specific paper list                                   |
| Issue paper alias  | `/issues/[issue]/[paper]/`                              | Generated paper route                                       |
| Legacy issue pages | `/issues/page2/`, `/issues/page3/`                      | Legacy compatibility surfaces                               |
| Historical archive | `/issues/archive/`, `/issues/archive/[issue]/`          | Metadata records point to missing local PDF assets          |
| Categories         | `/categories/`, `/categories/[category]/`               | Seventeen-category taxonomy at baseline                     |
| Research pathway   | `/our/`                                                 | Undergraduate research pathway copy                         |
| About              | `/about/`                                               | Series overview and contributor structure                   |
| Editorial profiles | `/editorial-board/[slug]/`                              | Public faculty/series profiles                              |
| Junior editors     | `/graduate-assistants/`, `/graduate-assistants/[slug]/` | Route name retains obsolete role terminology                |
| Policies           | `/policies/` and Markdown policy pages                  | Existing policy set requires governance rewrite             |
| Contact            | `/contact/`                                             | Series and department contact information                   |
| Sitemap            | `/sitemap.xml`                                          | Hand-authored route aggregation                             |
| Error page         | `/404.html` in static output                            | Faculty Sites currently serves its host-level 404 instead   |

The planned information architecture adds `/fields/`, `/for-authors/`, `/editorial-board/`, and `/history/`, while retaining explicit redirects for replaced public routes.

## Content and record findings

- The public institutional name is outdated in multiple locations: `UNLV Department of Economics` must become `Molasky Family Department of Economics and Real Estate` where the department is named.
- The public site and private operations repository use inconsistent governance titles. Existing records use `Editorial Lead`, `Co-Editor`, `Managing Editor (GA)`, `Founding Technical Editor`, and `Series Organizer`; the release charter requires a single controlled role vocabulary.
- The private operations repository exists and is accessible. It contains intake, publication, metadata validation, OAsis-linking, admin, audit, and deployment controls. It has no completed organization registry and therefore does not prove current appointments or public-profile consent.
- OAsis item pages exist for all 15 current records. Their posting dates do not establish semester-issue release dates.
- The historical registry contains 14 metadata entries, but no referenced `public/assets/archive/econ-495/*.pdf` files exist in any reachable public-repository commit. Historical full-text availability is unresolved.
- `src/config/repositoryStatus.ts` globally enables OAsis links. Repository links should instead be validated per record.
- `src/pages/.about.astro.swp` is a source-tree editor artifact and should not remain in a release branch.
- Google Fonts are requested from third-party origins on every audited page. The release should remove this runtime dependency or document and secure it deliberately.

## Baseline verification

| Check                           | Result                                          | Evidence boundary                                                                     |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm ci`                        | Pass                                            | 283 packages installed; audit reported 13 known findings (1 low, 1 moderate, 11 high) |
| `npm run build`                 | Pass                                            | 72 static pages generated                                                             |
| `npm run verify:text-contracts` | Pass                                            | Existing textual contract only; not governance-complete                               |
| Browser route smoke             | Pass for canonical routes                       | Chromium at 390x844, 768x1024, and 1440x900                                           |
| Root horizontal overflow        | Not observed                                    | Same three viewports; does not replace component-level inspection                     |
| Mobile navigation               | Closed initially and operable                   | 390x844 screenshot and browser inspection                                             |
| Live/build relationship         | Current live assets match baseline build hashes | Asset fingerprint evidence, not an embedded build identifier                          |
| Production deployment           | Not performed                                   | Feature work remains local until final feature-branch push/PR gate                    |

No breaking dependency upgrade was attempted during preflight. In particular, the high-severity Astro advisory chain must be handled as a deliberate upgrade and regression-tested; `npm audit fix --force` is not an acceptable release shortcut.

## Phase 0 release blockers

1. Publication authority, titles, voting, recusals, corrections, withdrawal, appeal, and records responsibility are not yet represented in one enforceable governance contract.
2. Sponsorship by the department or college is not established by the public sources reviewed.
3. Current board appointments, Junior Editor status, and consent to publish student biographies/photos/links require written confirmation.
4. The public/private metadata schemas do not distinguish issue dates, repository dates, versions, status, rights, and persistent identifiers.
5. Historical archive full text, rights, accessibility, and record provenance are unresolved.
6. The production host serves a generic missing-page response and emits an invalid `Content-Security-Policy: SAMEORIGIN` directive.
7. The public site does not yet expose an explicit build fingerprint, so release identity cannot be proven directly.
