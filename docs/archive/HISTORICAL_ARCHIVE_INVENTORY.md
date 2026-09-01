# Historical Archive Inventory

Inventory date: 2026-08-31 (America/Los_Angeles)

Scope: the 14 metadata entries currently listed in `src/data/archive-papers.ts` and the corresponding public records from the earlier UNLV Economics Hub.

Status: **metadata inventory only; no historical PDF has been added to this repository or republished by the current Series.** The row-level, machine-readable inventory is [historical-archive-inventory.csv](./historical-archive-inventory.csv).

## Evidence searched

The following public and repository-local evidence was inspected:

- the live Hub [Volume 1](https://thehouseunlv.wordpress.com/vol-1/), [Volume 2](https://thehouseunlv.wordpress.com/vol-2/), and [Volume 3](https://thehouseunlv.wordpress.com/vol-3/) pages;
- the 14 public PDF URLs linked from those pages, retrieved temporarily for title/byline verification and SHA-256 calculation;
- the current working tree, ignored-file listing, all reachable Git objects and commits, and the history of `src/data/archive-papers.ts` and `public/assets/archive/econ-495/`;
- the current 15-item OAsis collection audited separately in `docs/audits/OASIS_RECORD_AUDIT.md`.

Repository finding: the legacy registry was introduced in commit `a518c8a`, but no referenced `public/assets/archive/econ-495/*.pdf` exists in the current tree or any reachable public-repository commit. The temporary audit downloads remain outside the repository and are not migration assets. No private operations evidence was copied or summarized here.

The separate, unreferenced `public/assets/issues/2024-spring/2024-spring-pdfs.zip` was removed during Phase 8 hygiene because its rights and accessibility status were unverified. It remains recoverable from Git history. It was not an `assets/archive/econ-495/` source, is not evidence for any of the 14 historical records, and was not re-added during this audit.

## Inventory summary

| ID          | Original manuscript title                                                                                                         | Hub author display → normalized manuscript names                                      | Hub issue   | Source and verification                                                                                                                     | Material discrepancy or unresolved point                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `hub-v1-01` | An Economic Model of the Contemporary Oil Market: OPEC and the New Competitive Fringe                                             | J. Wenzel and Tony Foresta → T.J. Wenzel; Tony Foresta                                | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/wenzel_foresta_wps1.pdf); title verified; SHA-256 in CSV                | Hub uses `J. Wenzel`; manuscript uses `T.J. Wenzel`. Current registry says Spring 2018.                                                       |
| `hub-v1-02` | Analysis of Film Revenues: Saturated and Limited Films                                                                            | Megan Gold → Megan Gold                                                               | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/gold_wps1.pdf); title/byline verified; SHA-256 in CSV                   | Current registry says Spring 2018.                                                                                                            |
| `hub-v1-03` | Mezze Foods: An Analysis of the Factors Affecting Consumer Behavior in the Local Hummus Industry                                  | Avetis Mazmanyan and Raphael Medin → Avetis Mazmanyan; Raphael Medina                 | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/mazmanyan_medina_wps1.pdf); title/byline verified; SHA-256 in CSV       | Hub spells the surname `Medin`; manuscript spells it `Medina`. Current registry says Spring 2018.                                             |
| `hub-v1-04` | A Million and Above: Hedonic Modeling of how the characteristics of High-End Houses in the Las Vegas Metropolitan Area are valued | Josephine Fenton and Robert Villemaire → Josephine Fenton; Robert Villemaire          | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/fenton_villemaire_wps1.pdf); title/byline verified; SHA-256 in CSV      | PDF properties add `R.` and `Jr.` to Robert Villemaire; byline does not. Hub punctuation and current registry term differ.                    |
| `hub-v1-05` | Risk Behavior Patterns and Wealth Accumulation                                                                                    | Jeffrey Joe → Jeffrey Joe                                                             | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/jeffrey_joe_wps1.pdf); title/byline verified; SHA-256 in CSV            | Current registry says Spring 2018.                                                                                                            |
| `hub-v1-06` | The Marriage Wage Gap: An Analysis of Marital Status and Gender Related Disparity in Wage                                         | Alex Cannon → Alex Cannon                                                             | Fall 2016   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/06/alex_cannon_wps1.pdf); both title components verified; SHA-256 in CSV   | Manuscript cover says ECON 495 Fall 2014; Hub publication issue is Fall 2016. Current registry uses the course/manuscript term.               |
| `hub-v2-01` | Reference Dependence – On Any Given Sunday: Are Taxi Driver’s Shift End Decisions Impacted by the NFL?                            | Matt Parkins → Matt Parkins                                                           | Spring 2017 | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/matt-parkins.pdf); title/byline verified; SHA-256 in CSV                | PDF properties use `Matthew`; manuscript byline and Hub use `Matt`. Current registry says Spring 2018.                                        |
| `hub-v2-02` | Child Care’s Effects in the Las Vegas Valley                                                                                      | Lois Fortez, Edmund Yao, and Cindy Valencia → Lois Fortez; Cindy Valencia; Edmund Yao | Spring 2017 | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/child-care-analysis-_fortez.pdf); title/byline verified; SHA-256 in CSV | Hub and manuscript author orders differ. PDF properties say ECON 495 Fall 2016; Hub publication issue is Spring 2017.                         |
| `hub-v2-03` | Pythagorean Expectation for Baseball                                                                                              | Scott Leavitt and Anthony Serrano → E. Scott Leavitt; Anthony Serrano                 | Spring 2017 | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/leavitt_serrano_baseball.pdf); title/byline verified; SHA-256 in CSV    | Hub omits the first initial. Manuscript cover says Spring 2016; Hub publication issue is Spring 2017. Footnote markers are not name suffixes. |
| `hub-v2-04` | Major League Baseball Salary Determinants: Contract Year or Career Average                                                        | Michael Dillon → Michael Dillon                                                       | Spring 2017 | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/michael_dillon.pdf); title/byline verified; SHA-256 in CSV              | Current registry says Spring 2018.                                                                                                            |
| `hub-v2-05` | Shelter Animal Outcomes: Helping Improve Outcomes for Shelter Animals                                                             | Alexandra Ferguson → Alexandra Ferguson                                               | Spring 2017 | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/ferguson.pdf); title/byline verified; SHA-256 in CSV                    | PDF properties abbreviate `Alex`; manuscript byline and Hub use `Alexandra`.                                                                  |
| `hub-v3-01` | MMA Wages: The Determinants of UFC Fighter’s Salaries                                                                             | Jordan Eisinger → Jordan Eisinger                                                     | Fall 2017   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/jordan_eisinger_wps.pdf); title/byline verified; SHA-256 in CSV         | Current registry says Spring 2018.                                                                                                            |
| `hub-v3-02` | An Economic Analysis if Legalization of Recreational Marijuana Impact Violent Crime?                                              | Josefine Hippi → Josefine Hippi                                                       | Fall 2017   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/josefine_hippi.pdf); title/byline verified verbatim; SHA-256 in CSV     | The unusual grammar appears in both Hub and manuscript and must not be silently rewritten. Current registry says Spring 2018.                 |
| `hub-v3-03` | Does Having Children Make Cents? An Economic Analysis of the Gender Wage Gap in Nevada                                            | Jeffrey Wheble → Jeffrey Wheble                                                       | Fall 2017   | [PDF](https://thehouseunlv.wordpress.com/wp-content/uploads/2018/07/jeffrey_-wheble_wps.pdf); title/byline verified; SHA-256 in CSV         | Current registry says Spring 2018.                                                                                                            |

## Meaning of the CSV fields

- `original_title` is the manuscript title verified from the public Hub PDF, preserving unusual wording.
- `original_author_display` preserves the public Hub issue-page display; `normalized_author_names` records the manuscript byline without footnote markers.
- `original_semester` and `original_year` are the Hub publication-issue label. A manuscript course/date statement is retained as a discrepancy rather than substituted for the publication issue.
- `retrieved_source_file` identifies the temporary audit filename. It does not claim the file is present in or authorized for this repository.
- `sha256` identifies the public file retrieved on the inventory date. It is not a license or permission record.
- `title_verification_status` and `author_verification_status` distinguish exact verification from page/manuscript discrepancies.
- `rights_status`, `accessibility_status`, `oasis_deposit_status`, `doi`, `custom_record_status`, and `migration_date` remain explicitly unresolved where evidence is absent.

## Rights and migration boundary

The fact that a PDF is publicly downloadable from an older WordPress site does not prove authority to republish it on the current Series site. All 14 records remain `Unverified for republication`. No historical full text should be copied into `public/assets`, deposited into OAsis, or converted into a current structured paper record until the responsible editor has verified permission through the private operations process.

The public inventory intentionally contains only non-sensitive statuses. Signed agreements, student contact information, correspondence, internal review, and detailed rights evidence belong in the private operations repository.

## Accessibility boundary

The temporary files were screened only for the PDF `Tagged` flag. Thirteen report `Tagged: no`; `ferguson.pdf` reports `Tagged: yes`. A tagged flag alone does not establish correct headings, reading order, bookmarks, table structure, figure alternatives, link purpose, language, contrast, equation handling, or PDF/UA conformance.

Every record therefore remains “not fully audited.” Before any authorized migration, preserve the best editable source when available, perform a document-level audit, remediate where authorized and feasible, and retain the public accessibility-request pathway.

## Required next actions

For each record, the assigned migration owner must:

1. reconcile Hub display metadata with the manuscript byline and title;
2. distinguish course/manuscript dates from the Hub publication issue;
3. verify republishing authority without exposing private evidence;
4. complete and document an accessibility audit;
5. coordinate an OAsis deposit if approved;
6. record any DOI and immutable custom Series number only after verification;
7. preserve the original date and a separate future migration date;
8. test final PDF and citation links.

Until those actions are complete, the existing runtime archive should be treated as a bounded legacy metadata index, not a set of migrated or publication-ready papers.
