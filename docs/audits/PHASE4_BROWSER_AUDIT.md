# Phase 4 Browser and Visual Audit

Date: August 31, 2026  
Branch: `feat/publication-infrastructure-release`  
Production preview: `astro preview` at `http://127.0.0.1:4321`

## Result

The final automated run passed 168 route, viewport, and browser observations with zero recorded failures. It also captured 43 after-state screenshots for visual review.

The machine-readable result is in [`phase4-browser-results.json`](./phase4-browser-results.json). Before-state screenshots are in [`screenshots/before`](./screenshots/before); after-state screenshots are in [`screenshots/after`](./screenshots/after). The after-state images are lossily compressed WebP evidence derived from the final raw Playwright captures so the public repository does not retain 24 MB of redundant PNG files.

## Matrix

- Browsers: Chromium, Firefox, and WebKit using Playwright 1.58.2 browser builds.
- Viewports: 320 × 800, 390 × 844, 768 × 1024, and 1440 × 900.
- Routes: homepage, paper catalog, paper detail, issues, issue detail, research fields, For Student Authors, About, Editorial Board, History and Acknowledgments, policies, Contact, historical archive, and 404.
- Screenshot widths: 390, 768, and 1440 pixels, plus the open mobile-menu state at 390 pixels.

## Automated assertions

The run checked:

- successful route responses, page titles, and one meaningful H1;
- heading-order continuity;
- absence of horizontal overflow;
- content position below the sticky header;
- mobile navigation closed on load, openable, fully reachable, and dismissible with Escape;
- desktop navigation visibility, usable width, viewport containment, and keyboard order;
- search-query restoration, filter URL updates, result counts, no-results feedback, and filter clearing;
- native paper disclosures closed on load;
- copy-citation feedback;
- console and uncaught page errors;
- absence of remote Google Font requests;
- production stylesheet loading; and
- at least 4.5:1 contrast for the primary paper action.

Reduced-motion emulation was active during screenshot capture. The responsive menu uses a native `details` disclosure and is not open by default.

## Manual visual review

The screenshots were reviewed for clipped text, broken line wrapping, inaccessible overlays, oversized empty space, hidden footer content, excessive card styling, mobile action hierarchy, hero integrity, and narrow biography columns. Corrections made during review included:

- separating desktop navigation from the mobile disclosure so the desktop navigation is present in every engine;
- restoring white header and footer link treatment on paper routes;
- fixing the primary PDF button's text contrast and adding a regression assertion;
- shortening catalog excerpts and reducing secondary catalog actions;
- reorganizing paper actions at tablet and mobile widths;
- changing Editorial Board biographies to one column at tablet widths;
- making the mobile footer directory more compact;
- increasing the mobile homepage H1 prefix size; and
- keeping field links visibly identifiable without hover.

## Limitations and follow-up

- Headless WebKit on macOS does not reproduce Safari's system-controlled full keyboard access setting reliably. WebKit route, layout, disclosure, interaction, overflow, and screenshot checks ran, but Safari plus VoiceOver keyboard order remains a manual release check.
- Automated layout review does not establish PDF accessibility. The linked OAsis PDFs require a separate document audit.
- This Phase 4 runner was local release evidence. Phase 8 replaces the temporary runner with repository-managed Playwright and axe tests suitable for CI.
- These results verify the local production build, not the live Faculty Sites deployment.
