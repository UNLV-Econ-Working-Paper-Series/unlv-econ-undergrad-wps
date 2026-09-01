# Phase 8 release-readiness audit

Date: August 31, 2026 (America/Los_Angeles)

Branch: `feat/publication-infrastructure-release`

Phase 8 implementation commit: `62ec07a`

Production changed: **No**

This report consolidates the local engineering evidence and its limits. The exact final branch SHA is deliberately not embedded in a file inside that same commit; the authoritative fingerprint is the PR head and the generated `build-manifest.json` inside the verified release ZIP.

## Deterministic release gate

The integrated precommit run used Node 24.16.0 and npm 11.13.0:

```bash
npm run verify:release
```

Result:

- Prettier: passed.
- ESLint: passed.
- Astro and TypeScript: 129 files, 0 errors, 0 warnings, 0 hints.
- Publication and release tests: 61/61 passed across 11 test files.
- Paper migration dry run: 15 structured records, 0 rewrites, no identifier or URL collisions.
- Static build: 90 Astro pages.
- Text, governance, public-information-architecture, metadata, citation-export, sitemap, robots, and social-card contracts: passed.
- Internal links: 4,191 built `href`/`src` references across 91 HTML files, 0 unresolved references.
- Performance budget: 2 CSS files/68,325 bytes; 5 JavaScript files/7,264 bytes; largest HTML 62,838 bytes; largest fallback image 329,416 bytes.
- Playwright: 78/78 passed across Chromium, Firefox, and WebKit.

The first integrated run correctly stopped on invalid legacy category targets and a 404 canonical path. Empty legacy categories now resolve to the valid Research Fields directory, while populated categories retain direct field redirects. The complete gate passed after that repair.

## Browser, accessibility, and visual evidence

The repository-managed browser suite covers the homepage; catalog URL state, history, result grammar, and no-results behavior; paper records; DOI and OAsis links; BibTeX and RIS downloads; citation copying and print output; issues; a representative issue; fields; For Student Authors; About; Editorial Board; History; policies; Contact; legacy aliases; mobile navigation; and the custom 404.

Fourteen representative routes receive WCAG-tagged axe checks in each of three engines. The suite also checks one H1, heading continuity, visible focus, keyboard-operated mobile disclosure, focus return, live result announcements, 320-pixel reflow, landscape mobile, forced colors, reduced motion, normal-motion content visibility, horizontal overflow, and print citation behavior. Automated serious and critical axe violations: **0**.

Visual evidence:

- Before: `docs/audits/screenshots/before/`
- After: `docs/audits/screenshots/after/`
- Matrix/result: `docs/audits/phase4-browser-results.json`
- Review: `docs/audits/PHASE4_BROWSER_AUDIT.md`
- Widths: 320, 390, 768, and 1,440 pixels; 43 after-state screenshots; 168 route/browser/viewport observations.

Manual limitations remain explicit:

- Headless WebKit is not a substitute for Safari with VoiceOver and macOS Full Keyboard Access.
- The 320-pixel checks provide the WCAG reflow equivalent for a 1,280-pixel viewport at 400%, but an actual browser 200%/400% zoom review is still required.
- Automated print-media assertions are not a human print-preview review.
- Axe and browser semantics do not certify the linked PDFs. No PDF/UA or complete document-accessibility audit was performed.

## Performance

The local Lighthouse command audits the homepage on desktop/mobile and a representative paper on desktop. The measured run met every configured threshold:

| Surface          | Performance | Accessibility | Best practices | SEO | CLS |
| ---------------- | ----------: | ------------: | -------------: | --: | --: |
| Homepage desktop |          97 |           100 |            100 | 100 |   0 |
| Paper desktop    |         100 |           100 |            100 | 100 |   0 |
| Homepage mobile  |         100 |           100 |            100 | 100 |   0 |

The runner refuses to reuse an unrelated service already listening on port 4321. Final evidence is written under `artifacts/lighthouse/` and must be regenerated from the clean PR head before packaging.

The build has no remote font dependency. Responsive WebP sources reduce the Lee Business School hero image to approximately 55 KB at 960 pixels and 126 KB at 1,600 pixels; the compact profile image is approximately 10 KB. Astro emits cacheable external CSS and small JavaScript assets. Reduced-motion styles remove material animation duration without hiding content.

## Dependency and privacy evidence

Commands:

```bash
npm audit
npm audit --omit=dev
```

Both returned `found 0 vulnerabilities` against the final locked Astro 7.2.10 dependency tree. This supersedes the 13-finding Astro 5 preflight snapshot; no forced audit fix was used.

Repository hygiene checks found no current secret/key/token pattern, credentialed URL, private-record extension, tracked ignored file, or symbolic link. The public Eric Chiang JPEG contained embedded creator/email metadata; it was losslessly rewritten with JPEG markers removed. Its 450×450 dimensions and decoded RGB pixel SHA-256 remained identical. The unverified Spring 2024 PDF bundle was removed from the public asset tree and is not packaged or republished; it remains recoverable in Git history pending any separately authorized history-retention decision.

## OAsis and external records

Release-time OAsis/DOI command:

```bash
npm run verify:external-records
```

Result:

- 15/15 item pages returned 200.
- 15/15 DOI redirects reached the exact expected OAsis item.
- 13/13 comparable fields matched for every paper; 0 metadata mismatches.
- 15/15 automated PDF probes returned HTTP 403 in the latest bounded run.

The PDF responses are access restrictions, not record mismatches and not accessibility findings. OAsis disciplines are not substituted for the Series' controlled research fields, and semester labels are not inferred from repository volume/issue metadata.

The whole-site external-link auditor scans 91 HTML files and 72 unique external URLs with bounded retries, timeouts, concurrency, redirect evidence, and source locations. HTTP 401/403 and LinkedIn's non-standard anti-automation 999 are reported as access restrictions; 404/410 are broken; unresolved remote/network failures remain distinct. Evidence is written under `artifacts/external-links/`.

## Artifact and deployment boundary

`npm run package:faculty-sites` packages the contents of `dist`, not a wrapper directory. It rejects private/source patterns, nested ZIP files, symbolic links, missing root files, placeholder fingerprints, a dirty tree, a mismatched HEAD, and a forged `RELEASE_SOURCE_TREE=clean` claim. The ZIP includes a sorted internal `SHA256SUMS.txt`; a companion SHA-256 file covers the ZIP. Packaging the same fixed `dist` input twice produced the same digest during the deterministic-package test. Only a clean final-HEAD artifact is release evidence.

The live production checker is evidence-producing and intentionally fails the current production deployment. Its latest predeployment run reported 45 failures and 1 warning, including absence of the new build manifest/citation exports/field route, stale legacy pages, generic host 404 behavior, invalid or duplicate security headers, weak asset caching, and an exposed `/assets/` directory listing. This does not mean the local artifact failed; it proves that the new branch has not been deployed and that host-owner work remains.

No `.htaccess`, hosting setting, GitHub branch rule, Search Console action, upload, merge, or production mutation was performed.

## External blockers and verdict

Blocks formal public release:

- `DEPLOY-001`: production owner, document root, backup, staging/atomic replacement, header authority, custom 404 mapping, and rollback authority.
- OA-01 and OA-02: editorial appointments/titles and adoption of the voting, recusal, authority, and appeals model.
- Manual Safari/VoiceOver and final human accessibility/print review.
- Host security/404/directory-listing remediation and verified production fingerprint after an authorized upload.

Blocks a specific claim or feature:

- OA-03: stronger OAsis revision, withdrawal, historical deposit, accessible replacement, supplement, and cross-domain Scholar-PDF claims.
- OA-04: any stronger Spectra pathway claim.
- OA-05: historical full-text migration record by record.
- OA-06: final retention/disposition SOP and any unsupported contact details.
- Search Console ownership and indexing actions.

Does not block review of the code:

- OAsis PDF automation restrictions, because item metadata and DOI targets were still verified.
- LinkedIn/ResearchGate anti-automation responses, when preserved as access-restriction warnings rather than called broken links.
- The intentionally metadata-only historical archive.

Verdict after clean-HEAD gates: **CODE COMPLETE, EXTERNAL APPROVAL BLOCKED**. A successful build or PR does not change this verdict and does not authorize deployment.
