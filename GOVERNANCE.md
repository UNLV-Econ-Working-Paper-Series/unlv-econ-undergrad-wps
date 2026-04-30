# Governance

This document defines stewardship and change control for the public website repository of the UNLV Undergraduate Economics Working Paper Series.

## 1) Roles

- Editorial Lead
  - Final owner for publication-facing decisions.

- Co-Editor
  - Supports the Editorial Lead on policy and publication approvals.

- Technical Maintainer
  - Maintains the site code, build, deployment, and structural changes.

- Operations Support
  - Assists with metadata checks, content preparation, and routine site updates.

## 2) Change Control

### Minor changes
Examples:
- copy updates and content clarifications
- non-breaking UI polish
- docs updates

Approval:
- one editor role plus one technical maintainer

### Major changes
Examples:
- routing/base-path/domain changes
- schema changes affecting published papers
- publication/citation behavior changes
- legal/policy model changes

Approval:
- Editorial Lead plus one additional approver
- at least one approver should be responsible for the technical implementation when code changes are involved

## 3) Attribution and Credit Expectations

- `NOTICE` must remain present in this repository.
- `CONTRIBUTORS.md` should be updated as contributors join.
- Public-facing credit should remain visible in footer and About/Credits.

## 4) Public Writing Standards

Public-facing copy should follow [`docs/WRITING-STANDARDS.md`](docs/WRITING-STANDARDS.md). Use plain institutional language, describe the project as a working paper series or archive, and keep working-paper disclaimers direct.
