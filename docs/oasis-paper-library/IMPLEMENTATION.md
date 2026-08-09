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

## Post-Implementation

- [x] Update text-contract verification.
- [x] Run the production build.
- [x] Run whitespace and metadata uniqueness checks.
- [ ] Owner reviews category assignments and local visual rendering.
- [ ] Deployment occurs only after owner approval.
