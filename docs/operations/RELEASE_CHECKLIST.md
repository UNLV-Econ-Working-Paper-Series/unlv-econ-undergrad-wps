# Release checklist

- Release commit:
- Release version:
- Artifact path:
- Artifact SHA-256:
- Prior release retained:
- Editorial approval record:
- Authorized operator:

## Deterministic engineering gate

- [ ] Clean `npm ci` completed using the committed lockfile.
- [ ] `npm run verify:release` passed at the release commit.
- [ ] Formatting, lint, Astro/TypeScript checks, unit tests, content/copy checks, internal links, build, metadata, sitemap, browser smoke, and axe checks passed.
- [ ] Dependency audit result reviewed; no accepted exception is undocumented.
- [ ] `npm run verify:external-links` completed at release time; access restrictions are distinguished from broken or unresolved links.
- [ ] No secrets, private records, generated debris, unapproved archives, or source files enter the artifact.
- [ ] Build fingerprint contains the intended commit and release version.
- [ ] Release ZIP and internal checksum manifest were independently verified.

## Scholarly record gate

- [ ] All current paper records match the release-time OAsis audit or have documented owners.
- [ ] DOI redirects, OAsis records, and PDF responses were checked with transient failures distinguished from mismatches.
- [ ] Paper and issue BibTeX/RIS downloads work with correct MIME and filenames.
- [ ] Scholarly meta, JSON-LD, canonical, sitemap, robots, and social metadata pass built-output checks.
- [ ] Historical records remain metadata-only unless rights, source, and accessibility status are verified.

## Accessibility and visual gate

- [ ] Automated axe serious and critical count is zero on representative routes.
- [ ] Chromium browser tests passed in CI; local cross-engine evidence is attached when required.
- [ ] Keyboard, visible focus, menu semantics, disclosures, announcements, form labels, contrast, reduced motion, forced colors, narrow reflow, zoom, and print were checked.
- [ ] Manual Safari/VoiceOver and PDF limitations are recorded honestly.
- [ ] Current after screenshots were reviewed at 390, 768, and 1440 pixels.

## Production authority and rollback

- [ ] The authorized Faculty Sites operator, document root, backup, hosting configuration, and rollback procedure are confirmed.
- [ ] Production backup and prior verified artifact exist.
- [ ] Hosting owner confirmed document root, staging/atomic procedure, 404 mapping, and header responsibility.
- [ ] Deployment approval is explicit and recorded.

## Live verification

- [ ] Live fingerprint matches the approved commit.
- [ ] Production smoke command passed.
- [ ] Homepage, representative paper/issue/field, DOI, OAsis PDF, sitemap, robots, citations, Contact, assets, 404, mobile layout, metadata, and security headers were verified.
- [ ] No material console error or mixed content was observed.

Final release decision: APPROVED / DEFERRED / NOT APPROVED

Reason and unresolved owners:
