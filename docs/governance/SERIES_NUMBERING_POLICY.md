# Series Numbering Policy

Version: 1.0

Published: 2026-08-31

## Purpose

Every published paper receives one stable, human-readable identifier in this form:

`UNLV-Econ-WPS-YYYY-NNN`

The identifier supports citation, discovery, version control, correction, withdrawal, and reconciliation with OAsis. It does not replace the DOI or OAsis item URL.

## Identifier components

- `UNLV-Econ-WPS` is the fixed Series prefix.
- `YYYY` is the year of the verified citable publication date. If no citable date exists, an explicitly documented repository publication year may be used only after editorial verification. A semester label is never a substitute for date evidence.
- `NNN` is a zero-padded, Series-wide accession sequence. It does not reset each calendar year.

The full identifier must be unique. The three-digit sequence is explicit in each public paper record and must never be calculated from the current sort order at runtime.

## Initial assignment method

The initial assignment covers the 15 current OAsis paper records audited in `docs/audits/OASIS_CURRENT_RECORD_AUDIT.md`.

1. Verify each live OAsis item page, title, DOI, citable publication date, repository-online date, volume, issue, public item URL, and PDF article identifier.
2. Sort by the verified repository-online publication date.
3. When repository dates tie, use stable public repository-record order.
4. Only if that order is unavailable, use documented issue order and then local slug as the final deterministic fallback.
5. Use the verified citable publication year for `YYYY`.
6. Assign the Series-wide sequence `001` through `015` and store the full identifier explicitly in content.
7. Check the complete proposed registry for duplicate full identifiers and duplicate sequence values before publication.

All 15 current OAsis records share the repository-online date 2026-08-05. The stable public item-record order `/1` through `/15` therefore resolves the tie. No issue-order or slug fallback was used.

The initial registry is:

| Series sequence | Immutable identifier     | Local paper slug                                |
| --------------: | ------------------------ | ----------------------------------------------- |
|             001 | `UNLV-Econ-WPS-2024-001` | `the-race-for-increasing-college-costs`         |
|             002 | `UNLV-Econ-WPS-2024-002` | `used-electric-vehicle-tax-credit`              |
|             003 | `UNLV-Econ-WPS-2025-003` | `nba-real-team-value`                           |
|             004 | `UNLV-Econ-WPS-2026-004` | `hedonics-used-car-attributes`                  |
|             005 | `UNLV-Econ-WPS-2026-005` | `key-determinants-diamond-value`                |
|             006 | `UNLV-Econ-WPS-2026-006` | `rural-metropolitan-gender-wage-gap`            |
|             007 | `UNLV-Econ-WPS-2026-007` | `social-determinants-educational-attainment`    |
|             008 | `UNLV-Econ-WPS-2026-008` | `ai-wage-effects-us-occupations`                |
|             009 | `UNLV-Econ-WPS-2026-009` | `residential-sale-prices-neighborhood-interior` |
|             010 | `UNLV-Econ-WPS-2026-010` | `mlb-speed-premium`                             |
|             011 | `UNLV-Econ-WPS-2026-011` | `nevada-mining-output-growth`                   |
|             012 | `UNLV-Econ-WPS-2026-012` | `commercial-bank-failures`                      |
|             013 | `UNLV-Econ-WPS-2026-013` | `gambling-losses-future-wagers`                 |
|             014 | `UNLV-Econ-WPS-2026-014` | `las-vegas-casino-revenue`                      |
|             015 | `UNLV-Econ-WPS-2026-015` | `march-madness-tournament-advancement`          |

## Future assignment

A new number is assigned only when a paper is approved for publication and its citable year has been verified. The next paper receives the next unused Series-wide sequence after the greatest previously assigned suffix, regardless of semester, issue, publication year, or later changes to repository order.

Before assignment, the restricted editorial register must check the public registry and any reserved or withdrawn numbers. Concurrent production work must not reserve the same sequence for two papers. The assigned full identifier is then copied explicitly into public content and validated before release.

If a paper lacks a verified citable or repository publication year, number assignment is blocked. Editors must not infer the year from an issue term, course semester, file name, or anticipated release date.

## Immutability and lifecycle rules

- Once a Series number becomes public, it never changes.
- A corrected or substantively revised version retains the original Series number and adds version metadata.
- Withdrawal, temporary restriction, or removal does not free the number for reuse.
- A withdrawn record should retain its Series number on the public tombstone where legal, privacy, rights, and safety constraints permit.
- A DOI, OAsis item URL, PDF article identifier, title correction, date correction, issue reassignment, or repository migration does not trigger renumbering.
- A number assigned in error is retired with an internal explanation; it is not reassigned to another paper.

## Repository identifiers are not Series numbers

The OAsis public item-path number and PDF `article` query parameter are repository identifiers. They corroborated the initial ordering, but they are not copied, transformed, or treated as the ongoing authority for a Series number. The numerical alignment in the initial registry is a result of the verified initial order, not a permanent coupling.

Future papers continue the Series-wide sequence even if an OAsis record number is non-sequential, changes format, is created later, or is unavailable at the moment the Series number is assigned.

## Date controls

The following meanings must remain separate in content and display:

- citable publication date: supplies `YYYY` and scholarly `citation_publication_date`;
- repository publication date: when the OAsis record became public and the value for `citation_online_date`;
- issue publication date: when the Series issue itself became public, only when independently verified;
- current-version publication date: when that specific version became public.

An OAsis batch deposit can therefore produce different citable and repository-online years. The identifier year remains the documented citable year chosen at initial assignment. Later metadata correction does not silently alter an already public identifier.

## Verification requirements

The release gate must fail when any of the following is true:

- a current paper lacks a Series number;
- the value does not match `^UNLV-Econ-WPS-[0-9]{4}-[0-9]{3}$`;
- a full identifier or Series-wide three-digit sequence is duplicated;
- the identifier year disagrees with the documented assignment registry;
- runtime code derives or renumbers identifiers from current paper sorting;
- a withdrawn or retired number has been reused.

Changes to this policy or registry require the authority defined in `docs/governance/PUBLICATION_GOVERNANCE.md`.
