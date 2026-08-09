# OASIS Paper Library Research

## Overview

The site needs to publish the working-paper records now available in the UNLV OASIS repository while preserving the site's existing semester and economics-category organization.

## Problem Statement

OASIS is the permanent institutional record, but its collection page is not a complete discovery experience for this site. Readers need one accessible catalog that supports title, author, keyword, category, semester, and year discovery without duplicating or obscuring the repository record.

## User Stories / Use Cases

- A reader can search all current-series papers by title, author, keyword, or topic.
- A reader can browse papers by semester issue or economics category.
- A reader can open a readable abstract page before choosing the full PDF.
- A reader can reach the permanent OASIS record and DOI from every paper page.
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

## UI/UX Considerations

- Use a compact university-library visual treatment: strong type hierarchy, thin rules, white surfaces, and restrained UNLV red.
- Keep every paper in the HTML before JavaScript runs.
- Provide labeled search, category, semester, year, and sort controls.
- Announce result-count changes in a polite live region.
- Keep topic categories as real links and expose both local details and the full PDF.
- Keep the mobile header sticky, but move page-level tables of contents into normal flow below 980px.

## Integration Points

- `src/content/papers/`
- `src/content/config.ts`
- `src/lib/papers.ts`
- paper, issue, category, homepage, sitemap, and shared layout routes
- `scripts/verify-text-contracts.ts`

## Risks and Challenges

- External PDF URLs must bypass the site's base-path helper.
- Repository volume/issue metadata and the site's semester issue are related but distinct and must both remain visible.
- Full-bleed banners can create small horizontal overflow when browser scrollbars consume viewport width.
- Repeated CSS overrides can accidentally re-enable sticky page navigation on mobile.

## Open Questions

- Editorial category assignments should be reviewed before deployment because OASIS subjects do not map one-to-one to the site's economics taxonomy.

## References

- [UNLV OASIS Undergraduate Economics Working Paper Series](https://oasis.library.unlv.edu/econ_ug_papers/)
- [Project writing standards](../WRITING-STANDARDS.md)
