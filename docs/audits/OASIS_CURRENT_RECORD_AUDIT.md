# OAsis Current Record Audit

Audit date: 2026-08-31

Scope: all 15 records publicly listed in the [OAsis Undergraduate Economics Working Paper Series collection](https://oasis.library.unlv.edu/econ_ug_papers/) as of the audit date.

This audit establishes the primary-source metadata and deterministic order used for the initial UNLV Economics Working Paper Series number assignment. It does not alter OAsis, infer an issue release date, or establish that an OAsis query-string article identifier is a permanent Series identifier.

## Sources and method

For every record, the audit checked the live OAsis item page and compared it with the corresponding local paper slug. The following OAsis fields were recorded:

- public item URL and numeric item-path component;
- PDF link's `article` query parameter;
- title;
- DOI;
- visible `Publication Date` and COinS `rft.date`;
- `bepress_citation_online_date`;
- volume and issue.

The OAsis collection page was also checked. Its current display order is grouped by citation year, but its within-year presentation is not a monotonic accession order. That presentation-specific order was therefore not used as the tied-date key. The initial assignment instead uses the deterministic public item-record order represented by the item URLs `/econ_ug_papers/1` through `/econ_ug_papers/15`, corroborated by the monotonic PDF article identifiers `1000` through `1014` and DOI suffixes `40601190` through `40601204`.

The Series number is an explicit local publication identifier. It is not an alias for any one repository identifier. Once assigned, it remains fixed even if OAsis changes a URL, identifier, display order, or metadata field.

## Date finding

OAsis exposes two distinct dates for every current record:

1. The human-visible `Publication Date`, also encoded as the COinS `rft.date`, is the citable publication date.
2. `bepress_citation_online_date` is the date the repository record became available online.

All current records report **2026-08-05** as their OAsis online date, so they form one tied date group for ordering. OAsis exposes no time of day, so no publication timestamp more precise than the day is supported. The older citable dates must not be overwritten by that repository-online date, and the repository-online date must not be backdated to the semester or visible citation date.

| Public item records | Verified citable publication date | Verified repository-online date |
| ------------------- | --------------------------------- | ------------------------------- |
| 1–2                 | 2024-05-16                        | 2026-08-05                      |
| 3                   | 2025-05-20                        | 2026-08-05                      |
| 4–15                | 2026-05-21                        | 2026-08-05                      |

Migration consequence: retain a separately named citable-publication-date field for `citation_publication_date`, and use the repository-online date for `repository_published_at` and `citation_online_date`. Do not retain a generic `published_at` field.

## Record-by-record evidence and proposed assignments

The four-digit year in each proposed identifier comes from the verified citable publication date. The three-digit suffix is a single Series-wide accession sequence and does not reset each year.

| Seq. | Proposed immutable Series number | Local slug                                      | Issue term  | Vol./issue | OAsis item / PDF article ID                                           | Exact OAsis title                                                                   | DOI                 | Citable date | Repository-online date | Ordering evidence / confidence |
| ---: | -------------------------------- | ----------------------------------------------- | ----------- | ---------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------- | ------------ | ---------------------- | ------------------------------ |
|  001 | `UNLV-Econ-WPS-2024-001`         | `the-race-for-increasing-college-costs`         | Spring 2024 | 1(1)       | [item 1](https://oasis.library.unlv.edu/econ_ug_papers/1/) / `1000`   | The Race for Increasing College Costs                                               | `10.34917/40601190` | 2024-05-16   | 2026-08-05             | Public item record 1; high     |
|  002 | `UNLV-Econ-WPS-2024-002`         | `used-electric-vehicle-tax-credit`              | Spring 2024 | 1(1)       | [item 2](https://oasis.library.unlv.edu/econ_ug_papers/2/) / `1001`   | The Effects of the Tax Credit on the Used Electric Vehicle Market                   | `10.34917/40601191` | 2024-05-16   | 2026-08-05             | Public item record 2; high     |
|  003 | `UNLV-Econ-WPS-2025-003`         | `nba-real-team-value`                           | Spring 2025 | 2(1)       | [item 3](https://oasis.library.unlv.edu/econ_ug_papers/3/) / `1002`   | Does a Star Player’s Jewelry Matter? An Analysis of NBA Real Team Value             | `10.34917/40601192` | 2025-05-20   | 2026-08-05             | Public item record 3; high     |
|  004 | `UNLV-Econ-WPS-2026-004`         | `hedonics-used-car-attributes`                  | Fall 2025   | 3(1)       | [item 4](https://oasis.library.unlv.edu/econ_ug_papers/4/) / `1003`   | Hedonics of Used Car Attributes on Market Price                                     | `10.34917/40601193` | 2026-05-21   | 2026-08-05             | Public item record 4; high     |
|  005 | `UNLV-Econ-WPS-2026-005`         | `key-determinants-diamond-value`                | Fall 2025   | 3(1)       | [item 5](https://oasis.library.unlv.edu/econ_ug_papers/5/) / `1004`   | Key Determinants of Diamond Value                                                   | `10.34917/40601194` | 2026-05-21   | 2026-08-05             | Public item record 5; high     |
|  006 | `UNLV-Econ-WPS-2026-006`         | `rural-metropolitan-gender-wage-gap`            | Fall 2025   | 3(1)       | [item 6](https://oasis.library.unlv.edu/econ_ug_papers/6/) / `1005`   | Do Rural Areas Gender-Discriminate Wages More than Metropolitan Areas?              | `10.34917/40601195` | 2026-05-21   | 2026-08-05             | Public item record 6; high     |
|  007 | `UNLV-Econ-WPS-2026-007`         | `social-determinants-educational-attainment`    | Fall 2025   | 3(1)       | [item 7](https://oasis.library.unlv.edu/econ_ug_papers/7/) / `1006`   | Social Determinants of Low Educational Attainment                                   | `10.34917/40601196` | 2026-05-21   | 2026-08-05             | Public item record 7; high     |
|  008 | `UNLV-Econ-WPS-2026-008`         | `ai-wage-effects-us-occupations`                | Fall 2025   | 3(1)       | [item 8](https://oasis.library.unlv.edu/econ_ug_papers/8/) / `1007`   | Labor Market Responses to AI: Measuring Wage Effects Across U.S. Occupations        | `10.34917/40601197` | 2026-05-21   | 2026-08-05             | Public item record 8; high     |
|  009 | `UNLV-Econ-WPS-2026-009`         | `residential-sale-prices-neighborhood-interior` | Spring 2026 | 3(2)       | [item 9](https://oasis.library.unlv.edu/econ_ug_papers/9/) / `1008`   | The Effects of Neighborhood and Interior Characteristics on Residential Sale Prices | `10.34917/40601198` | 2026-05-21   | 2026-08-05             | Public item record 9; high     |
|  010 | `UNLV-Econ-WPS-2026-010`         | `mlb-speed-premium`                             | Spring 2026 | 3(2)       | [item 10](https://oasis.library.unlv.edu/econ_ug_papers/10/) / `1009` | MLB Speed Premium                                                                   | `10.34917/40601199` | 2026-05-21   | 2026-08-05             | Public item record 10; high    |
|  011 | `UNLV-Econ-WPS-2026-011`         | `nevada-mining-output-growth`                   | Spring 2026 | 3(2)       | [item 11](https://oasis.library.unlv.edu/econ_ug_papers/11/) / `1010` | The Structural Limitations of Mining Output Growth in Nevada                        | `10.34917/40601200` | 2026-05-21   | 2026-08-05             | Public item record 11; high    |
|  012 | `UNLV-Econ-WPS-2026-012`         | `commercial-bank-failures`                      | Spring 2026 | 3(2)       | [item 12](https://oasis.library.unlv.edu/econ_ug_papers/12/) / `1011` | Simple Determinants of Commercial Bank Failures                                     | `10.34917/40601201` | 2026-05-21   | 2026-08-05             | Public item record 12; high    |
|  013 | `UNLV-Econ-WPS-2026-013`         | `gambling-losses-future-wagers`                 | Spring 2026 | 3(2)       | [item 13](https://oasis.library.unlv.edu/econ_ug_papers/13/) / `1012` | Gambling Behaviors: How Do Gambling Losses Affect Future Wagers?                    | `10.34917/40601202` | 2026-05-21   | 2026-08-05             | Public item record 13; high    |
|  014 | `UNLV-Econ-WPS-2026-014`         | `las-vegas-casino-revenue`                      | Spring 2026 | 3(2)       | [item 14](https://oasis.library.unlv.edu/econ_ug_papers/14/) / `1013` | Las Vegas Casino Revenue in an Expanding Gambling Market                            | `10.34917/40601203` | 2026-05-21   | 2026-08-05             | Public item record 14; high    |
|  015 | `UNLV-Econ-WPS-2026-015`         | `march-madness-tournament-advancement`          | Spring 2026 | 3(2)       | [item 15](https://oasis.library.unlv.edu/econ_ug_papers/15/) / `1014` | Determinants of March Madness Tournament Advancement                                | `10.34917/40601204` | 2026-05-21   | 2026-08-05             | Public item record 15; high    |

## Ordering and fallback record

The initial ordering procedure produced the same accession sequence under both available date views:

1. Repository-online date: every item ties on 2026-08-05.
2. Stable public repository-record order: item records 1 through 15 break the tie.
3. Citable dates independently preserve the chronological year groups 2024, 2025, and 2026.

No issue-order or slug fallback was used. Local issue term is not an OAsis field; it was taken from the repository's current structured content and cross-checked against the OAsis volume/issue pair. In particular, the four Fall 2025 papers have a 2026 citable publication date. Their identifier year is therefore 2026, not an inferred semester year.

## Collision and completeness check

The proposed table has:

- 15 records and 15 proposed Series numbers;
- 15 unique local slugs;
- 15 unique public OAsis item URLs;
- 15 unique PDF article identifiers;
- 15 unique DOIs;
- a contiguous Series-wide suffix range from `001` through `015`;
- no duplicate full identifier and no duplicate suffix.

Result: **no collision detected**.

## Confidence and limits

| Finding                                                        | Confidence                       | Limit                                                                                                                                                              |
| -------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title, DOI, dates, volume, issue, item URL, and PDF article ID | High                             | Read directly from each live official OAsis item page on the audit date.                                                                                           |
| Repository-online date is 2026-08-05                           | High                             | Encoded in `bepress_citation_online_date` on every item and corroborated by the item-statistics start date; no time of day is exposed.                             |
| Citable date is distinct from online date                      | High                             | Visible `Publication Date` and COinS `rft.date` agree and differ from `bepress_citation_online_date` for records 1–3.                                              |
| Public item-record order is the deterministic tie-breaker      | High for this initial assignment | OAsis does not label the path integer as a Series number. It is used only to establish the initial order and is not retained as the Series identifier's authority. |
| Local issue term                                               | Medium-high                      | OAsis exposes volume and issue, but not the local semester label. The local issue registry supplies the term.                                                      |

Future metadata correction at OAsis must not silently renumber a paper. Any discrepancy discovered after public assignment requires a documented metadata correction while preserving the immutable Series number under `docs/governance/SERIES_NUMBERING_POLICY.md`.
