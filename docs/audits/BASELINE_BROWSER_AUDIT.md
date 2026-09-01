# Baseline Browser and Viewer Audit

Audit date: 2026-08-31  
Production origin: `https://econ-undergrad-wps.sites.unlv.edu/`  
Audited build: `b9bdf5de16ae8e44d47b83203949ad70008d61ae`

## Coverage

The baseline was rendered in Chromium at three representative viewport sizes:

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1440 x 900

Routes sampled at every viewport: home, papers, one paper record, issues, one Fall 2025 issue, categories, research pathway, about, contact, policies, historical archive, and the current 404 surface. The mobile navigation was also captured open at 390 x 844. Motion was reduced for deterministic screenshots.

Screenshots are stored under `docs/audits/screenshots/before/` using `<route>-<width>x<height>.jpg`; `mobile-menu-open-390x844.jpg` records the expanded mobile state.

## Baseline findings

| Area | Result | Finding |
| --- | --- | --- |
| Route availability | Pass for canonical routes | Audited canonical pages returned 200. |
| Heading structure | Basic pass | Each sampled canonical page exposed one `h1`; deeper hierarchy still requires semantic review. |
| Root overflow | Pass in sampled viewports | No document-level horizontal overflow at 390, 768, or 1440 pixels. |
| Mobile navigation default | Pass | Menu is closed on initial load. |
| Mobile navigation expanded | Functional, needs release retest | Expanded panel remains inside the viewport and exposes all current links. Focus order, escape behavior, focus return, and scroll containment require explicit automated/manual tests. |
| Sticky navigation | Needs redesign verification | The current header consumes substantial mobile space and combines sticky behavior with transition logic; all route classes need browser retesting after the IA change. |
| Papers desktop layout | Needs redesign | Marketing statistics, an oversized filter panel, card-style results, and broad empty space make the catalog read as a product dashboard rather than an academic series. |
| Papers mobile layout | Needs redesign | Long stacked controls and repeated cards create excessive vertical scanning and weak bibliographic hierarchy. |
| Typography | Operational risk | Every page requests Google Fonts at runtime. The public site should not depend on a third-party font request for legibility or rendering stability. |
| Motion | Needs systematic gate | Existing transitions mix Astro view transitions and GSAP. Reduced-motion behavior exists but requires route-by-route verification after changes. |
| 404 behavior | Fail on production host | An arbitrary missing URL receives the hosting provider's plain `404 Not Found`, not the site's built `404.html`. |
| Security-policy console | Fail | Every sampled production page reports `Unrecognized Content-Security-Policy directive 'SAMEORIGIN'`. |
| Build identity | Insufficient | Live hashed assets match the local baseline, but the HTML exposes no explicit commit/build fingerprint. |
| Institutional identity | Fail | Public surfaces use the former `UNLV Department of Economics` name and do not consistently present the required institutional hierarchy. |
| Publication identity | Fail | Launch-news language, startup-style calls to action, category pills, and builder attribution dominate content that should foreground the scholarly record. |
| Paper metadata | Incomplete | Current page title, structured fields, versions, status, date semantics, and machine-readable citation metadata do not yet meet the publication contract. |
| Historical files | Blocked | Archive pages reference local PDF paths whose files are absent. |

## Visual observations

### Home

The desktop hero is visually oversized, with a dark glass treatment, broad whitespace, and calls to action that resemble a product launch. The current `News and Events` section announces that the site is live and that issues were released; these are launch notices rather than durable publication updates. The footer gives platform-builder attribution more prominence than an institutional publication footer should.

### Papers

The desktop page opens with a large red banner followed by a marketing claim, three statistics, and a dense control panel. Results appear as bordered two-column cards. On mobile, controls and cards stack into a long sequence, delaying access to the bibliographic content. Search itself is valuable and should remain, but the release should present compact scholarly lists, explicit field/issue filters, shareable query state, and clear record metadata.

### Navigation

The mobile menu is closed by default and opens without observed clipping at 390 pixels. Its information architecture is outdated, however, and sticky/mobile behavior must be reverified after replacing `Categories` and `Research Pathway` with the approved public structure.

## Required after-state evidence

The release audit must repeat the same route/viewport matrix and add:

1. Keyboard-only navigation, skip-link, menu, dialog, disclosure, and focus-return checks.
2. Automated accessibility checks plus manual landmarks, headings, names/roles/values, zoom/reflow, contrast, reduced-motion, and forced-colors review.
3. Safari/WebKit and Firefox coverage in addition to Chromium.
4. Paper metadata, BibTeX, RIS, canonical URL, Open Graph, JSON-LD, sitemap, and robots validation.
5. Missing-route verification on the actual Faculty Sites host.
6. Slow-network and unavailable-third-party checks.
7. Explicit live build-fingerprint comparison after deployment by an authorized operator.

Automated scans are necessary but cannot establish WCAG conformance by themselves. External PDF accessibility remains a record-level verification requirement.

