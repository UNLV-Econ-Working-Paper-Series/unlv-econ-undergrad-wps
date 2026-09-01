# Google Scholar Monitoring Runbook

Status: operational runbook; no Google Scholar inclusion, grouping, correction, or update is recorded as completed by this document.

Canonical custom-site origin: `https://econ-undergrad-wps.sites.unlv.edu/`

OAsis collection: `https://oasis.library.unlv.edu/econ_ug_papers/`

## Non-negotiable boundaries

- Google Search Console does not control Google Scholar. Sitemap submission, URL Inspection, and an indexing request in Search Console do not establish or accelerate a Scholar update.
- The Series designates the OAsis item record and deposited full text as the permanent repository record for each deposited paper. OAsis is the primary Scholar-facing full-text source; the custom site is the canonical discovery, abstract, issue, policy, and citation interface for the Series.
- OAsis is a service of UNLV University Libraries and must not be described as the publisher. Series publisher metadata remains omitted unless an authorized public value is established.
- The custom site omits cross-domain `citation_pdf_url` metadata and visibly links the OAsis item record unless canonical full-text behavior is formally established.
- Scholar inclusion and version grouping are external outcomes, not release guarantees. Do not promise a date by which Scholar will first index, reindex, regroup, or correct a record.
- A result in ordinary Google Search is not evidence of a result in Google Scholar.

These boundaries come from the [Official Source Register](../audits/OFFICIAL_SOURCE_REGISTER.md) and the public [Archiving policy](../../src/pages/policies/archiving.md).

## Monitoring states

Use one of these states for each paper. Do not collapse them into a generic `done` state.

| State                     | Meaning                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `Not checked`             | No current release-specific evidence                                                           |
| `Local metadata verified` | Generated paper HTML passed the metadata contract locally                                      |
| `Live metadata verified`  | The production custom page and OAsis record were fetched and reconciled                        |
| `Not observed in Scholar` | A documented Scholar search found no matching result at that time                              |
| `Observed in Scholar`     | A documented Scholar search found a matching result                                            |
| `Grouping verified`       | DOI, HTML, OAsis item, and PDF versions shown by Scholar were reviewed and grouped as expected |
| `Mismatch under review`   | A title, author, DOI, version, PDF, date, or report-metadata discrepancy is documented         |
| `Correction escalated`    | The responsible owner received a bounded correction request with evidence                      |

`Not observed in Scholar` is not proof of permanent exclusion. `Observed in Scholar` is not proof that all metadata or versions are correct.

## 1. Pre-deploy metadata verification

### Build and inventory

- [ ] Record release ID, commit SHA, operator, UTC time, and the complete set of published paper slugs.
- [ ] Generate a clean static artifact and require the complete build contract to pass:

```sh
npm ci
npm run build
git rev-parse HEAD
```

- [ ] Confirm every canonical paper page is present:

```sh
find dist/papers -mindepth 2 -maxdepth 2 -name index.html -print | sort
```

- [ ] Reconcile the generated page count and slug set against `src/content/papers/*.md`. A matching count alone is insufficient; compare the exact set.

### Per-paper machine-readable contract

For every canonical paper page, verify:

- [ ] exactly one normalized `citation_title`;
- [ ] one `citation_author` for each author, in public byline order, with no combined multi-author string;
- [ ] `citation_publication_date` uses the citable publication date, not the later OAsis repository posting date;
- [ ] repository online date remains separately represented where the contract emits it;
- [ ] `citation_technical_report_institution` is `Molasky Family Department of Economics and Real Estate, University of Nevada, Las Vegas`;
- [ ] `citation_technical_report_number` exactly matches the stable Series number;
- [ ] `citation_abstract_html_url` exactly matches the custom-site canonical URL;
- [ ] DOI, volume, issue, pages, keywords, language, author affiliation, and ORCID metadata match the publication record when present;
- [ ] JSON-LD identifies a `ScholarlyArticle` and agrees with the visible title, authors, citable date, DOI, issue, version, and canonical URL;
- [ ] no unapproved cross-domain `citation_pdf_url` appears;
- [ ] no unapproved Series publisher metadata appears;
- [ ] the visible OAsis link points to the paper’s own normalized item URL.

The publication-metadata checks should produce no matches:

```sh
if rg -n 'name="citation_pdf_url"' dist/papers/*/index.html; then
  echo 'Blocked: unapproved cross-domain citation_pdf_url is present.'
  exit 1
fi

if rg -n 'name="citation_publisher"|"publisher"\s*:' dist/papers/*/index.html; then
  echo 'Blocked: unapproved publisher metadata is present.'
  exit 1
fi
```

Do not add a same-origin placeholder PDF or copy the OAsis item-level publisher value merely to satisfy a tag checklist.

### Custom-site and OAsis reconciliation

For each paper, compare the custom page with the public OAsis item record and record:

- exact title and subtitle punctuation;
- individual author names, order, initials, diacritics, and suffixes;
- DOI after normalization to the bare `10.../...` identifier;
- OAsis item URL and available deposited full-text link;
- Series number and technical-report identity;
- volume, issue, pages, and visible recommended citation;
- citable publication date on the custom site versus repository posting date in OAsis, without substituting one for the other;
- current-version label/date and any correction, withdrawal, or replacement notice;
- visible rights statement and any record-specific file-access or accessibility status.

Do not infer that a public PDF is accessible merely because it downloads. Document accessibility remains a separate record-level requirement.

## 2. Post-deploy live verification

Do not begin Scholar outcome monitoring until the authorized release is live and the production identity has been verified.

- [ ] Fetch each canonical custom paper page from the production origin and repeat the metadata checks against live HTML, not `dist/`.
- [ ] Open every visible OAsis item link and DOI from the live custom page; record final URL, status, and any mismatch.
- [ ] Confirm the OAsis full-text link remains public and corresponds to the same scholarly work/version described by the custom page.
- [ ] Confirm robots and canonical directives do not block the custom paper page unintentionally.
- [ ] Confirm a multi-author record renders separate author metadata. Use `/papers/rural-metropolitan-gender-wage-gap/` unless it is no longer published.
- [ ] Confirm a record from each citable year and published issue, including `/papers/march-madness-tournament-advancement/` and `/papers/the-race-for-increasing-college-costs/`, or document an equivalent replacement sample.

If live HTML differs from the verified artifact, stop and classify the release identity as unresolved. Do not explain a Scholar mismatch using metadata that is not actually live.

## 3. Google Scholar observation procedure

Run searches manually in Google Scholar and record the observation context. Do not use automated scraping. Results may vary by locale, account state, and Scholar’s current index, so preserve the exact query and time.

### Exact-title searches

For every new or materially corrected paper, and for each representative baseline paper:

1. Search the complete normalized title in quotation marks.
2. Repeat without quotation marks only if the exact-title search finds nothing.
3. Compare the displayed result title, author line, year, source/report label, and destination with the custom site and OAsis.
4. Open **All versions** when available and record the version count and destinations.
5. Record `Not observed in Scholar` when no matching result appears; do not call the paper rejected or excluded.

### Author parsing checks

- Confirm each author is parsed as an individual name rather than one combined string.
- Check displayed order, spelling, initials, diacritics, suffixes, and truncation.
- For multi-author papers, compare the result and **All versions** cluster with both the custom page and OAsis record.
- Treat an author-profile association as separate from paper metadata. Do not claim the Series can edit a scholar’s personal profile.

### DOI grouping

- Search the bare DOI and the exact title separately.
- Confirm that DOI-bearing results refer to the same work and normalized DOI.
- Open **All versions** and check whether custom HTML, OAsis item, DOI destination, and OAsis PDF are grouped rather than represented as conflicting works.
- A separate result is not automatically an error. Compare title, authors, year, DOI, report number, and substantive version before escalating.
- Never mint, replace, or remove a DOI as a search-engine workaround.

### Duplicate-version checks

Review apparent duplicates for:

- title punctuation or subtitle differences;
- author-name/order differences;
- citable year versus repository posting year;
- missing or conflicting DOI;
- different Series numbers;
- preliminary, corrected, withdrawn, or replaced versions;
- verified legacy public URLs. The current build generates no issue-paper aliases from the OAsis CGI PDF URLs, so do not treat that historical route pattern as an implemented redirect;
- materially different PDFs.

Record all URLs and metadata before deciding whether results should be grouped. Legitimate versions may remain separately visible while still belonging to one work.

### PDF grouping

- Check whether the OAsis deposited PDF appears as the accessible full-text version or within **All versions**.
- Confirm that the PDF title page and bibliographic details identify the same work as the OAsis item and custom page.
- Do not require the custom site to emit a cross-domain `citation_pdf_url` without an approved canonical full-text policy.
- Do not upload or expose a duplicate custom-site PDF solely to influence Scholar grouping.
- If the PDF is missing, restricted, inaccessible, or materially different, follow the OAsis and publication correction process rather than silently changing the custom record.

### Technical-report metadata

Scholar may treat these works as technical reports. For each observed result, compare:

- normalized title;
- individually parsed authors;
- citable publication year;
- institution string;
- stable Series/report number;
- DOI when assigned;
- custom abstract URL and OAsis full-text relationship.

Do not relabel a working paper as a peer-reviewed journal article to improve display. The Series’ working-paper and non-peer-reviewed status must remain accurate.

## 4. Consistency rules

The custom site and OAsis may describe different date events, but they must describe the same scholarly work.

| Field                | Required consistency rule                                                    |
| -------------------- | ---------------------------------------------------------------------------- |
| Title                | Same normalized scholarly title; investigate substantive wording differences |
| Authors              | Same people and order; normalize presentation without merging authors        |
| DOI                  | Same normalized DOI everywhere it is shown                                   |
| Series number        | Stable custom-site technical-report identifier                               |
| Citable date         | Controlled by the Series publication record and citations                    |
| OAsis online date    | Repository posting event; do not substitute for the citable date             |
| Version              | Same substantive current paper or an explicit, linked version relationship   |
| Full text            | OAsis deposited file is the primary Scholar-facing full text                 |
| Publisher            | Omitted unless an authorized public Series publisher value is established    |
| Cross-domain PDF tag | Omitted unless an approved canonical full-text policy requires it            |

## 5. Delays and follow-up

Google Scholar controls crawl, inclusion, metadata refresh, and version grouping. Changes can remain unobserved for an uncertain and potentially extended period. There is no Series, OAsis, Search Console, or deployment action that establishes a guaranteed Scholar update date.

- Record each observation date and the live metadata state at that time.
- Choose the next review date according to the release owner’s operating cadence and the seriousness of the mismatch.
- Do not repeatedly change correct metadata, resubmit Search Console requests, or create duplicate files merely because Scholar has not refreshed.
- Report `pending external indexing` or `not observed as of [date]`, never `will update by [date]`.

## 6. Correction escalation

Collect evidence before contacting an owner. Every escalation must identify the paper, exact mismatched field, expected value and source, observed value, URLs, observation date, screenshots or exports, and potential reader impact.

| Mismatch                                                         | First owner/action                                                                                                                            | Boundary                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Custom-site visible or machine metadata                          | Technical/editorial owner corrects the source record, reruns validation, deploys through the authorized process, and verifies live HTML       | Do not describe a local fix as live                                                         |
| OAsis item metadata or deposited PDF                             | Managing Editor coordinates with the OAsis administrator under `OASIS-001`                                                                    | The custom site cannot silently rewrite the repository record or file                       |
| DOI metadata or DOI grouping                                     | Reconcile the DOI shown by the Series and OAsis, then coordinate with the responsible repository/DOI metadata owner                           | Do not invent a new DOI or change a valid DOI for display purposes                          |
| Conflicting substantive versions                                 | Follow corrections/versioning governance and coordinate the custom record and OAsis record                                                    | Do not overwrite or hide a version without authorization and a public notice where required |
| Author parsing                                                   | Correct verified author fields at the source that is wrong; then recheck custom HTML and OAsis                                                | Do not merge author names or alter identity without evidence                                |
| Duplicate Scholar results                                        | Preserve cluster URLs and metadata, correct demonstrable source inconsistencies, then use Google Scholar’s supported feedback route if needed | A duplicate is not proof that either source should be removed                               |
| Missing Scholar result                                           | Recheck public access, robots, canonical URL, required citation metadata, OAsis record, and PDF searchability                                 | Inclusion remains external; no date or outcome may be promised                              |
| Rights, privacy, accessibility, withdrawal, or integrity concern | Use the applicable Series policy and responsible UNLV/OAsis channel immediately                                                               | Search visibility is secondary to the protective action and governing authority             |

Close an escalation only after the responsible source is corrected and verified. Scholar’s later refresh remains a separate observation state.

## Evidence log templates

Populate these tables in an access-controlled release record. Store only public bibliographic facts in broad-access logs; keep authenticated or personnel-specific evidence appropriately restricted. Never store account credentials or session material.

### Release and live-source identity

| Field                            | Value                                            |
| -------------------------------- | ------------------------------------------------ |
| Release ID                       |                                                  |
| Commit SHA                       |                                                  |
| Production verification UTC time |                                                  |
| Custom-site origin               | `https://econ-undergrad-wps.sites.unlv.edu/`     |
| OAsis collection                 | `https://oasis.library.unlv.edu/econ_ug_papers/` |
| Operator                         |                                                  |
| Live build identity evidence     |                                                  |
| `OASIS-001` status/evidence date |                                                  |
| Canonical full-text policy/date  |                                                  |
| Series publisher decision/date   |                                                  |

### Paper reconciliation inventory

| Series number | Custom URL | OAsis item URL | DOI | Exact title match | Author/order match | Citable date checked | OAsis date checked | Full text checked | Live metadata result | Evidence location |
| ------------- | ---------- | -------------- | --- | ----------------- | ------------------ | -------------------- | ------------------ | ----------------- | -------------------- | ----------------- |
|               |            |                |     |                   |                    |                      |                    |                   |                      |                   |

### Scholar search and grouping observation

| Observation UTC time | Series number | Exact query | Account/locale context | Result title/URL | Displayed authors/year | DOI match | All versions count/URLs | OAsis PDF grouped? | Technical-report metadata result | State | Evidence location |
| -------------------- | ------------- | ----------- | ---------------------- | ---------------- | ---------------------- | --------- | ----------------------- | ------------------ | -------------------------------- | ----- | ----------------- |
|                      |               |             |                        |                  |                        |           |                         |                    |                                  |       |                   |

### Correction escalation

| Case ID | Opened date | Paper/URL | Mismatch class | Expected value/source | Observed value/source | Responsible owner | Action/evidence location | Current state | Next review | Closed date/evidence |
| ------- | ----------- | --------- | -------------- | --------------------- | --------------------- | ----------------- | ------------------------ | ------------- | ----------- | -------------------- |
|         |             |           |                |                       |                       |                   |                          |               |             |                      |

## Closeout language

A bounded report should distinguish source readiness from the external outcome, for example: `Live custom-site and OAsis metadata reconciled for [N] records; [N] records observed in Scholar; [N] not observed as of [date]; grouping mismatches recorded for review; no update date promised.` Replace every bracketed value with evidence from the current monitoring run. Never infer completion from an earlier release, Search Console status, or an unchanged result count.
