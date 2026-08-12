# OASIS Paper Library Implementation Plan

## Overview

Add all published OASIS records to the Astro site, build a searchable catalog and complete paper pages, then repair and verify responsive navigation and accessibility.

## Prerequisites

- Public OASIS collection and record pages are available.
- Existing issue and category route structure remains the site's editorial taxonomy.
- Work remains local until owner review.

## Phase Summary

1. Import and validate repository metadata.
2. Build the catalog and paper-detail experience.
3. Integrate issue, category, navigation, sitemap, and repository links.
4. Repair mobile navigation and complete accessibility verification.
5. Correct Fall 2025, redesign the paper record, and add citation styles.
6. Publish launch announcements and complete the editorial-quality UI pass.

---

## Phase 1: Authoritative Metadata

### Objective

Represent every published OASIS paper without inventing missing bibliographic fields.

### Tasks

- [x] Read the live collection and individual record metadata.
- [x] Add 15 content entries with unique OASIS records and DOIs.
- [x] Add Spring 2025 to the issue registry.
- [x] Extend the schema for repository volume, issue, pages, DOI, and optional advisor.

### Success Criteria

The content store builds with 15 unique paper, DOI, and OASIS record entries.

## Phase 2: Catalog and Paper Pages

### Objective

Give readers a clear, accessible discovery layer over the repository collection.

### Tasks

- [x] Build a filterable and sortable all-papers catalog.
- [x] Add linked categories, semester issues, keywords, and publication metadata.
- [x] Replace the embedded PDF preview with readable abstract, citation, metadata, DOI, and repository sections.
- [x] Preserve full catalog content when JavaScript is unavailable.

### Success Criteria

Readers can find a paper and reach its local record, PDF, OASIS record, category, and semester issue.

## Phase 3: Site Integration

### Objective

Make the published collection visible from the site's primary discovery paths.

### Tasks

- [x] Add Papers to primary and footer navigation.
- [x] Populate homepage, issue, and category pages from the imported records.
- [x] Support absolute OASIS PDF links.
- [x] Include all paper pages in the generated sitemap.
- [x] Update built-output text contracts for the published state.

### Success Criteria

All generated routes build and published-state content contracts pass.

## Phase 4: Mobile and Accessibility

### Objective

Meet WCAG 2.1 AA-oriented automated and manual checks across key journeys.

### Tasks

- [x] Keep the site header sticky and mobile menu bounded to the viewport.
- [x] Disable sticky page-level TOCs on narrow layouts.
- [x] Add Escape-to-close and focus restoration to the mobile menu.
- [x] Remove horizontal overflow from full-bleed mobile banners.
- [x] Repair focus, contrast, landmarks, scrollable content, and ARIA semantics.
- [x] Verify catalog filtering, no-results recovery, keyboard order, and live counts.

### Success Criteria

Key pages have no automated axe findings at 390px, no horizontal overflow, and usable keyboard navigation.

## Phase 5: Issue and Citation Correction

### Objective

Restore the missing Fall 2025 issue and make each paper record easier to read and cite.

### Tasks

- [x] Map Volume 3, Issue 1 to Fall 2025 using manuscript received-date evidence.
- [x] Add the Fall 2025 issue route and move its five papers from Spring 2026.
- [x] Generate OASIS, APA 7, MLA 9, and Chicago author-date citations from repository metadata.
- [x] Replace the narrow card stack and redundant action buttons with a wider editorial layout.
- [x] Re-run citation interaction, responsive, keyboard, overflow, and axe checks.

### Success Criteria

Fall 2025 appears throughout issue discovery, citation year remains tied to publication date, and the redesigned record passes desktop and mobile accessibility checks.

## Phase 6: Editorial Release Presentation

### Objective

Present the live series and released issues with the visual quality of a university research publication.

### Tasks

- [x] Add separate homepage announcements for the live series and the four released semester issues.
- [x] Rename the public Graduate Assistants role to Junior Editors while preserving existing profile URLs.
- [x] Replace issue-card grids with a numbered, responsive table of contents.
- [x] Replace solid-red issue and paper banners with restrained library-record mastheads.
- [x] Remove the remaining dashboard-card treatment from paper metadata and repository sections.
- [x] Keep citation tools collapsed on initial load with an accessible native disclosure.
- [x] Add coordinated issue, paper-record, citation-disclosure, hover, and focus motion using the existing GSAP system.
- [x] Verify the reduced-motion path uses immediate state changes without animated transforms or opacity.
- [x] Re-run production, responsive, interaction, overflow, and axe checks.

### Success Criteria

The homepage clearly announces the launch and released issues; About uses Junior Editors; and issue and paper pages read as one coherent, accessible editorial system at desktop and mobile sizes.

## Post-Implementation

- [x] Update text-contract verification.
- [x] Run the production build.
- [x] Run whitespace and metadata uniqueness checks.
- [ ] Owner reviews category assignments and local visual rendering.
- [ ] Deployment occurs only after owner approval.
