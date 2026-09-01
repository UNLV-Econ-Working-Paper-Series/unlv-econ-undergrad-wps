# Paper Metadata Migration Report

This report is generated deterministically by `scripts/migrate-paper-metadata.ts`. It contains no wall-clock timestamp so a second migration run produces the same result.

## Result

- Records migrated and validated: 15
- Legacy runtime fields removed: `authors: string[]`, `semester`, `category`, `advisor`, `pdf`, `issue`, and generic `published_at`
- Explicit Series-number collisions: none
- Duplicate canonical OAsis item URLs: none
- Duplicate DOIs: none
- Paper slugs, titles, abstract text, keywords, DOI values, OAsis URLs, PDF URLs, volume/issue metadata, and page ranges were preserved

## Date semantics

OAsis exposes two dates with different meanings for this initial collection. The former flat `published_at` values match the official citable `Publication Date` on each item record. The repository audit separately verified that all 15 records first appeared online in OAsis on 2026-08-05.

- `citable_published_at` preserves the item record's official citable Publication Date.
- `repository_published_at` records the verified date the OAsis record became public.
- `current_version.published_at` records the verified public date of the currently deposited file.
- `issue_published_at` remains absent because a semester label is not evidence of an issue-release date.

## Initial Series-number assignments

Assignments sort all 15 records by the verified repository-online date. Because all records tie on 2026-08-05, the stable public OAsis collection-item order determines the sequence, with slug only as a final deterministic fallback. The numeric suffix is a global, zero-padded accession sequence across the Series; it does not reset by year. It happens to correspond to the current public item order, but the Series identifier is stored explicitly and is not dynamically derived from an OAsis URL at runtime. The four-digit year comes from the separately verified citable Publication Date.

| Series number | Paper slug | Citable date | Repository online | OAsis item order |
| --- | --- | --- | --- | ---: |
| UNLV-Econ-WPS-2024-001 | `the-race-for-increasing-college-costs` | 2024-05-16 | 2026-08-05 | 1 |
| UNLV-Econ-WPS-2024-002 | `used-electric-vehicle-tax-credit` | 2024-05-16 | 2026-08-05 | 2 |
| UNLV-Econ-WPS-2025-003 | `nba-real-team-value` | 2025-05-20 | 2026-08-05 | 3 |
| UNLV-Econ-WPS-2026-004 | `hedonics-used-car-attributes` | 2026-05-21 | 2026-08-05 | 4 |
| UNLV-Econ-WPS-2026-005 | `key-determinants-diamond-value` | 2026-05-21 | 2026-08-05 | 5 |
| UNLV-Econ-WPS-2026-006 | `rural-metropolitan-gender-wage-gap` | 2026-05-21 | 2026-08-05 | 6 |
| UNLV-Econ-WPS-2026-007 | `social-determinants-educational-attainment` | 2026-05-21 | 2026-08-05 | 7 |
| UNLV-Econ-WPS-2026-008 | `ai-wage-effects-us-occupations` | 2026-05-21 | 2026-08-05 | 8 |
| UNLV-Econ-WPS-2026-009 | `residential-sale-prices-neighborhood-interior` | 2026-05-21 | 2026-08-05 | 9 |
| UNLV-Econ-WPS-2026-010 | `mlb-speed-premium` | 2026-05-21 | 2026-08-05 | 10 |
| UNLV-Econ-WPS-2026-011 | `nevada-mining-output-growth` | 2026-05-21 | 2026-08-05 | 11 |
| UNLV-Econ-WPS-2026-012 | `commercial-bank-failures` | 2026-05-21 | 2026-08-05 | 12 |
| UNLV-Econ-WPS-2026-013 | `gambling-losses-future-wagers` | 2026-05-21 | 2026-08-05 | 13 |
| UNLV-Econ-WPS-2026-014 | `las-vegas-casino-revenue` | 2026-05-21 | 2026-08-05 | 14 |
| UNLV-Econ-WPS-2026-015 | `march-madness-tournament-advancement` | 2026-05-21 | 2026-08-05 | 15 |

Identifiers are immutable once publicly assigned. A withdrawal does not release an identifier for reuse.

## Controlled-field migration

| Paper slug | Legacy category | Controlled research field |
| --- | --- | --- |
| `ai-wage-effects-us-occupations` | Labor and Demography | Labor Economics and Demography |
| `commercial-bank-failures` | Finance | Financial Economics |
| `gambling-losses-future-wagers` | Behavioral & Experimental Economics | Behavioral and Experimental Economics |
| `hedonics-used-car-attributes` | Applied Microeconomics | Applied Microeconomics |
| `key-determinants-diamond-value` | Applied Microeconomics | Applied Microeconomics |
| `las-vegas-casino-revenue` | Industrial Organization (IO) & Strategy | Industrial Organization |
| `march-madness-tournament-advancement` | Applied Microeconomics | Applied Microeconomics |
| `mlb-speed-premium` | Labor and Demography | Labor Economics and Demography |
| `nba-real-team-value` | Industrial Organization (IO) & Strategy | Industrial Organization |
| `nevada-mining-output-growth` | Environmental and Resource | Environmental and Resource Economics |
| `residential-sale-prices-neighborhood-interior` | Urban, Regional, & Real Estate Economics | Urban, Regional, and Real Estate Economics |
| `rural-metropolitan-gender-wage-gap` | Labor and Demography | Labor Economics and Demography |
| `social-determinants-educational-attainment` | Education | Economics of Education |
| `the-race-for-increasing-college-costs` | Education | Economics of Education |
| `used-electric-vehicle-tax-credit` | Public Economics & Policy | Public Economics |

Every resulting value is a member of the 17-value controlled taxonomy. No arbitrary public field variant was added.

## Deliberately unresolved public metadata

- Faculty sponsor absent: 15 of 15. The former records did not publish sponsor metadata, so none was fabricated.
- Issue release date absent: 15 of 15. Semester labels were not converted into dates.
- Documented previous versions: 0. No superseded, corrected, or withdrawn version was inferred without public evidence.
- Rights, license, copyright-holder, conflict, AI-use, ethics, data-availability, and code-availability fields remain absent unless record-level public evidence supports them.
- Private consent records, editorial votes, conflict forms, and rights documents are intentionally excluded from public content.

## Repeatability and failure behavior

- Default and `--dry-run` modes parse and validate every record without changing files.
- `--write` converts an all-legacy collection or canonicalizes an all-structured collection and regenerates this report.
- Mixed legacy/structured collections fail, preventing a long-lived dual schema.
- Missing required fields, invalid dates or URLs, unknown research fields, duplicate Series numbers, duplicate OAsis URLs, duplicate DOIs, and ambiguous initial ordering fail the migration.
- A second `--write` run is byte-stable when source metadata has not changed.
