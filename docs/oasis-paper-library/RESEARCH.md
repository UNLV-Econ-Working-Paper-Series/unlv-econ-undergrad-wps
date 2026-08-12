# OASIS Paper Library Research

## Overview

The site needs to publish the working-paper records now available in the UNLV OASIS repository while preserving the site's existing semester and economics-category organization.

The OASIS publication year is not always the academic semester. Volume 3, Issue 1 was received in December 2025 and belongs to Fall 2025 even though OASIS published the records in May 2026. Volume 3, Issue 2 is Spring 2026.

## Problem Statement

OASIS is the permanent institutional record, but its collection page is not a complete discovery experience for this site. Readers need one accessible catalog that supports title, author, keyword, category, semester, and year discovery without duplicating or obscuring the repository record.

## User Stories / Use Cases

- A reader can search all current-series papers by title, author, keyword, or topic.
- A reader can browse papers by semester issue or economics category.
- A reader can open a readable abstract page before choosing the full PDF.
- A reader can reach the permanent OASIS record and DOI from every paper page.
- A reader can select and copy OASIS, APA, MLA, or Chicago citations generated from the repository metadata.
- A keyboard or screen-reader user can operate the catalog, mobile menu, and page navigation.

## Technical Research

### Approach Options

1. Copy repository PDFs into this repository. This gives local control but creates duplicate files and an avoidable version-synchronization risk.
2. Link directly to OASIS without local paper pages. This preserves a single file source but removes the site's richer issue/category discovery layer.
3. Keep metadata and readable abstracts locally while treating OASIS as the full-text and preservation source.

### Recommended Approach

Use option 3. Store the public bibliographic metadata in Astro content entries, link PDF actions to OASIS, and expose the repository record and DOI on each local paper page.

### Required Technologies

- Existing Astro content collections and static routes
- Existing issue and category helpers
- Small progressive-enhancement script for client-side filtering and sorting
- Existing mobile navigation and table-of-contents components

### Data Requirements

Each paper record includes title, authors, semester, editorial category, keywords, abstract, publication date, OASIS PDF URL, OASIS record URL, DOI, volume, issue, and pages. Advisor remains optional because it is not published in every repository record.

Semester grouping follows the issue represented by the manuscript, while citation year follows the OASIS publication date. These fields must not be inferred from one another.

## UI/UX Considerations

- Use a compact university-library visual treatment: strong type hierarchy, thin rules, white surfaces, and restrained UNLV red.
- Keep every paper in the HTML before JavaScript runs.
- Provide labeled search, category, semester, year, and sort controls.
- Announce result-count changes in a polite live region.
- Keep topic categories as real links and expose both local details and the full PDF.
- Keep the mobile header sticky, but move page-level tables of contents into normal flow below 980px.
- Give paper pages a wider editorial reading measure, keep the abstract primary, and consolidate secondary metadata instead of stacking multiple equal-weight cards.
- Use a native citation-style selector, one live citation output, and one copy action rather than custom tabs.
- Present semester issues as editorial tables of contents rather than repeated dashboard cards: one numbered reading axis, restrained metadata, and direct text/PDF actions.
- Use white record mastheads, strong rules, and UNLV red as an accent on issue and paper pages so the research—not a large color field—carries the hierarchy.
- Show dated homepage announcements as distinct records with descriptive links.
- Use the existing GSAP motion system for restrained entrance hierarchy and disclosure transitions; animate opacity and transform only, except for the short citation-panel height transition.
- Treat reduced motion as a first-class path: reveal content immediately, preserve native disclosure behavior, and avoid delayed focus or interaction.

## Integration Points

- `src/content/papers/`
- `src/content/config.ts`
- `src/lib/papers.ts`
- paper, issue, category, homepage, sitemap, and shared layout routes
- `scripts/verify-text-contracts.ts`

## Risks and Challenges

- External PDF URLs must bypass the site's base-path helper.
- Repository volume/issue metadata and the site's semester issue are related but distinct and must both remain visible.
- Citation styles have different author, title-capitalization, volume/issue, and page conventions; generated output needs representative single-, two-, and multi-author checks.
- Full-bleed banners can create small horizontal overflow when browser scrollbars consume viewport width.
- Repeated CSS overrides can accidentally re-enable sticky page navigation on mobile.
- Long paper titles and multi-author bylines must reflow without pushing publication metadata outside the viewport.

## Open Questions

- Editorial category assignments should be reviewed before deployment because OASIS subjects do not map one-to-one to the site's economics taxonomy.

## References

- [UNLV OASIS Undergraduate Economics Working Paper Series](https://oasis.library.unlv.edu/econ_ug_papers/)
- [Project writing standards](../WRITING-STANDARDS.md)
