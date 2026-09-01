# Google Search Reindexing Runbook

Status: operational runbook; no deployment, sitemap submission, URL inspection, or indexing request is recorded as completed by this document.

Canonical production origin: `https://econ-undergrad-wps.sites.unlv.edu/`

This runbook covers Google Search discovery after an authorized Faculty Sites release. It does not authorize a deployment. `DEPLOY-001` remains open in [External Confirmations](../governance/EXTERNAL_CONFIRMATIONS.md), so the authorized deployment owner, rollback method, and release sign-off must be recorded before production is changed. A GitHub Pages deployment is a separate surface and is not proof that the Faculty Sites origin changed.

## Evidence boundaries

- Do not state that a sitemap was submitted, a URL was inspected, or indexing was requested without evidence from an authenticated Google Search Console session for the production property.
- A successful local build proves only the generated artifact. A public HTTP check proves only what the production origin returned at that time. Neither is authenticated Search Console evidence.
- `URL is available to Google`, a successful live test, and an accepted indexing request are not proof that a URL is indexed.
- Search Console does not control Google Scholar. Scholar monitoring follows [Google Scholar Monitoring](GOOGLE_SCHOLAR_MONITORING.md).
- Google controls crawl and indexing timing. Do not promise an indexing or reindexing date.
- Store authenticated screenshots, exported reports, property identifiers, and operator identity in the private operations release record. Never record credentials, cookies, recovery data, or authentication tokens.

Use these status terms in release reporting:

| Status | Required evidence |
| --- | --- |
| `Local artifact verified` | Clean build and checks against `dist/` at a recorded commit |
| `Production response verified` | Timestamped HTTP/browser evidence from the canonical production origin |
| `Search Console submitted` | Authenticated sitemap-submission evidence for the production property |
| `Search Console inspected` | Authenticated URL Inspection evidence for the exact canonical URL |
| `Indexing requested` | Authenticated request confirmation for the exact canonical URL |
| `Indexed` | Authenticated URL Inspection reports the canonical URL indexed, with the evidence date recorded |
| `Not verified` | Evidence is missing, stale, belongs to another origin, or cannot be tied to the release |

## 1. Pre-deploy: identify and build the release

- [ ] Record the release ID, commit SHA, branch, operator, UTC start time, and intended production origin.
- [ ] Confirm the release commit has passed review and is the exact commit being packaged.
- [ ] Confirm the authorized Faculty Sites owner and rollback procedure. Stop if `DEPLOY-001` has not been resolved for this release.
- [ ] Install from the lockfile and generate a fresh static artifact from the release commit:

```sh
npm ci
npm run build
git rev-parse HEAD
git status --short
```

- [ ] Record the complete build result. Do not call the artifact verified if any build or verification step failed.
- [ ] Confirm that the generated sitemap and robots policy exist and are non-empty:

```sh
test -s dist/sitemap.xml
test -s dist/robots.txt
rg -n '<loc>https://econ-undergrad-wps\.sites\.unlv\.edu/' dist/sitemap.xml
rg -n '^Sitemap: https://econ-undergrad-wps\.sites\.unlv\.edu/sitemap\.xml$' dist/robots.txt
```

### Sitemap contract

The build regenerates `dist/sitemap.xml`. Before deployment, verify that it contains only indexable canonical HTML routes and that it includes:

- `/`, `/papers/`, `/issues/`, `/fields/`, `/for-authors/`, `/about/`, `/editorial-board/`, `/history/`, `/policies/`, and `/contact/`;
- every current canonical `/papers/[slug]/` page;
- every published canonical `/issues/[issue]/` page;
- current research-field, public editorial-profile, archive, and policy pages intended for indexing.

The sitemap must not include redirect/noindex aliases, missing records, query-string variants, fragment URLs, or `.bib`/`.ris` download endpoints. Review any match before release:

```sh
rg -n '<loc>[^<]*/categories/|<loc>[^<]*/(our|graduate-assistants|issues/page[23])/<\/loc>' dist/sitemap.xml
rg -n '/issues/[0-9]{4}-(spring|fall)/paper-[0-9]+/' dist/sitemap.xml
rg -n '<loc>[^<]*[?#][^<]*</loc>|\.(bib|ris)</loc>' dist/sitemap.xml
```

For these three commands, no output is the expected result. A match is a release defect unless the route has been explicitly reclassified as canonical and that decision is documented.

### Canonical and page-source sample

- [ ] Verify one page from each major content class in the built artifact: homepage, papers catalog, newest issue, Fall 2025 issue, oldest current issue, one single-author paper, one multi-author paper, policies index, archiving policy, corrections/versioning policy, and accessibility policy.
- [ ] Verify each sampled canonical is absolute, uses HTTPS, uses the production host, has the intended trailing slash, and matches `og:url`.
- [ ] Verify canonical pages do not contain `noindex` or a refresh redirect.
- [ ] Verify sampled pages contain one usable title, description, Open Graph title/description/URL/image, and Twitter card metadata.
- [ ] Verify the social image URL is absolute and the built asset exists.
- [ ] Verify current institutional-identity surfaces use `Molasky Family Department of Economics and Real Estate`; do not present the stale `UNLV Department of Economics` name as current. A clearly attributed historical quotation or artifact is not a current identity defect.
- [ ] Verify page titles contain normal punctuation rather than HTML entities, duplicated series names, raw Markdown, or truncated template text.

Recommended fixed sample routes for this release are:

| Class | Canonical route |
| --- | --- |
| Homepage | `/` |
| Catalog | `/papers/` |
| Current issue | `/issues/2026-spring/` |
| Fall 2025 issue | `/issues/2025-fall/` |
| Earlier issue | `/issues/2024-spring/` |
| Single-author paper | `/papers/march-madness-tournament-advancement/` |
| Multi-author paper | `/papers/rural-metropolitan-gender-wage-gap/` |
| Policies | `/policies/` |
| Repository/indexing boundary | `/policies/archiving/` |
| Version policy | `/policies/corrections-versioning/` |
| Accessibility | `/policies/accessibility/` |

If any listed record is withdrawn or its slug changes before release, replace it with a published record in the same class and record the substitution.

## 2. Deploy canonical routes

- [ ] Deploy the exact verified artifact through the approved Faculty Sites procedure.
- [ ] Record artifact checksum or package identifier, commit SHA, deployment operator, start/end time, and rollback point in the private release record.
- [ ] Do not infer a Faculty Sites deployment from a push to `main`, a GitHub Pages workflow, or a successful local preview.
- [ ] If production does not match the release artifact, stop. Do not submit the sitemap or request indexing for the mismatched release.

## 3. Post-deploy: verify public production responses

Run these checks against the production origin, not a preview URL:

```sh
SITE_ORIGIN='https://econ-undergrad-wps.sites.unlv.edu'
curl --fail --silent --show-error --location "$SITE_ORIGIN/" -o /dev/null
curl --fail --silent --show-error --location "$SITE_ORIGIN/sitemap.xml" -o /tmp/unlv-wps-sitemap.xml
curl --fail --silent --show-error --location "$SITE_ORIGIN/robots.txt" -o /tmp/unlv-wps-robots.txt
rg -n '<loc>https://econ-undergrad-wps\.sites\.unlv\.edu/' /tmp/unlv-wps-sitemap.xml
rg -n '^Sitemap: https://econ-undergrad-wps\.sites\.unlv\.edu/sitemap\.xml$' /tmp/unlv-wps-robots.txt
```

- [ ] Confirm every sampled canonical route returns its intended final content over HTTPS without a redirect loop.
- [ ] Compare the live sitemap and robots files to the deployed artifact.
- [ ] Fetch every sitemap URL and record any non-2xx response. A URL returning a redirect is not a canonical sitemap entry.
- [ ] Confirm each sampled live canonical and `og:url` points to the same production URL.
- [ ] Confirm the live `og:image` and Twitter image return a successful image response with the expected content type.
- [ ] Test social previews for the homepage, papers catalog, a single-author paper, and a multi-author paper. Record the tool, timestamp, fetched title/description/image, and any cached prior value. A social-card preview is not Search Console evidence.
- [ ] Verify the production build identity against the release record. If the site exposes no reliable build identity, record that verification as blocked rather than inferred.

### Redirect and old-route verification

Check each retained legacy route in both HTTP tooling and a browser. The current static compatibility pages may return `200` with a refresh redirect rather than a server-side `3xx`; record the actual status. An approved static alias must contain `noindex, follow`, a canonical link to the destination, a refresh or script redirect, and a visible followable link. If the host is configured for server redirects, record the exact `3xx` status and `Location` header instead.

| Legacy route or pattern | Required canonical destination |
| --- | --- |
| `/our/` | `/for-authors/` |
| `/categories/` and obsolete general category routes | `/fields/` or the mapped canonical field |
| `/categories/io-and-strategy/` | `/fields/industrial-organization/` |
| `/categories/public-and-policy/` | `/fields/public-economics/` |
| `/issues/page2/`, `/issues/page3/` | `/issues/` |
| `/graduate-assistants/` | `/editorial-board/#junior-editors` with canonical `/editorial-board/` |
| Existing `/graduate-assistants/[slug]/` | Preserve the profile route, or use a documented equivalent editorial-board profile destination; do not break the external URL |
| Historical `/issues/[issue]/paper-[number]/` pattern | No verified aliases are generated by the current build. Treat the old-URL inventory and paper mapping as unresolved; do not claim a redirect until an explicit source-to-target mapping is implemented and tested. |

- [ ] Confirm aliases are absent from the sitemap.
- [ ] Confirm aliases do not self-canonicalize.
- [ ] Confirm the canonical destination returns indexable content.
- [ ] Confirm query strings and fragments do not create a second canonical identity.
- [ ] Record unexpected old routes, duplicate pages, loops, soft 404s, or host-level 404s as release defects.

### Citation-download content types

The static artifact contains per-paper and per-issue `.bib` and `.ris` files. Astro endpoint source can declare response headers, but a static host ultimately selects the live MIME type. Faculty Sites MIME configuration is an authorized host-owner action under `DEPLOY-001`; do not add or claim an `.htaccess` rule without that confirmation.

After deployment, sample both a paper export and an issue export:

```sh
curl --silent --show-error --head "$SITE_ORIGIN/papers/hedonics-used-car-attributes/citation.bib"
curl --silent --show-error --head "$SITE_ORIGIN/papers/hedonics-used-car-attributes/citation.ris"
curl --silent --show-error --head "$SITE_ORIGIN/issues/2025-fall/citations.bib"
curl --silent --show-error --head "$SITE_ORIGIN/issues/2025-fall/citations.ris"
```

- [ ] `.bib` responses use `application/x-bibtex` with UTF-8 support.
- [ ] `.ris` responses use `application/x-research-info-systems` with UTF-8 support.
- [ ] Each response body matches the verified artifact and downloads with the intended filename.
- [ ] If the host omits or changes either MIME type, record deployment verification as blocked and route the configuration request to the authorized Faculty Sites owner. The presence of a correct local file or source-level response header is not live MIME evidence.

## 4. Submit the sitemap in Search Console

These steps require an authenticated operator with access to the production Search Console property.

1. Select the property that covers `https://econ-undergrad-wps.sites.unlv.edu/`. Record whether it is a Domain property or URL-prefix property and its displayed identifier.
2. Open **Sitemaps** and submit the exact URL `https://econ-undergrad-wps.sites.unlv.edu/sitemap.xml`.
3. Record the authenticated timestamp, submitted URL, displayed submission status, discovered URL count if shown, and evidence location.
4. If a prior sitemap entry exists, verify that Search Console is evaluating the same canonical URL. Do not delete history merely to obtain a fresh-looking status.
5. Treat `Submitted` or `Success` as sitemap-processing evidence only. It does not establish that every listed URL is indexed.

## 5. Inspect representative canonical URLs

Use **URL Inspection** for the exact HTTPS canonical URL. For each URL, record both the indexed-data result and the result of **Test live URL** when available.

Inspect at minimum:

1. the homepage;
2. `/papers/`;
3. the two representative paper pages listed above, plus every newly published or materially corrected paper;
4. `/issues/2026-spring/`, `/issues/2025-fall/`, and any newly released issue;
5. `/policies/`, `/policies/archiving/`, `/policies/corrections-versioning/`, and any materially changed policy.

For every inspection, capture:

- inspected URL and content class;
- indexed status and last crawl shown, if any;
- live-test result and time;
- user-declared canonical;
- Google-selected canonical, if shown;
- crawl allowance and indexing allowance;
- referring sitemap, if shown;
- evidence location and operator notes.

Do not convert a missing or inconclusive field into a pass. Record `not shown`, `not tested`, or `blocked` exactly.

## 6. Request indexing for high-priority pages

After live production and canonical verification, request indexing only for changed, indexable canonical pages in this order:

1. homepage and papers catalog when their metadata or information architecture changed materially;
2. newly published or materially corrected paper pages;
3. newly released or materially changed issue pages;
4. materially changed policy pages.

Do not request indexing for redirects, noindex aliases, citation downloads, query variants, fragments, missing pages, or unchanged low-priority pages. Respect Search Console limits and do not repeatedly resubmit a URL to imply progress. Record the exact URL, timestamp, confirmation displayed, operator, and evidence location. An accepted request is not an indexing guarantee.

## 7. Monitor naming, titles, canonicals, and duplicate routes

Use Search Console reports plus manual public-result observation. Keep these evidence types separate.

- **Stale department naming:** look for cached results using `UNLV Department of Economics` or other superseded identity text. Verify the live page first; if live copy is correct, record the result as a stale external observation rather than a production defect.
- **Malformed titles:** look for entity codes, duplicated suffixes, missing paper titles, raw template values, or titles that differ from the canonical page metadata.
- **Duplicate old routes:** monitor legacy `/categories/`, `/our/`, the `/graduate-assistants/` index, paginated issue, and any explicitly verified issue-paper aliases. The current build does not generate issue-paper aliases from the OAsis CGI PDF URLs, so do not report those redirects as present. A preserved Junior Editor profile route is not an alias unless an equivalent replacement route is actually published. The desired outcome for true aliases is selection of the new canonical destination and eventual exclusion of the old alias, but Google controls timing.
- **Canonical divergence:** investigate any Google-selected canonical that differs from the declared canonical. Compare redirects, internal links, sitemap entries, page content, and cross-domain record relationships before changing metadata.
- **Social-card cache:** verify live metadata before attempting cache refreshes. A stale preview does not by itself prove a live-site defect.

Schedule follow-up observations according to the release owner’s normal operating cadence. Record observation dates; do not assign or publish a guaranteed completion date.

## Evidence log templates

Populate these tables in the private release record. The public repository contains only the blank template.

### Release and deployment identity

| Field | Value |
| --- | --- |
| Release ID | |
| Commit SHA | |
| Artifact/package checksum | |
| Production origin | `https://econ-undergrad-wps.sites.unlv.edu/` |
| Authorized deployment owner | |
| Deployment UTC start/end | |
| Rollback point and procedure | |
| Local build result/evidence | |
| Production identity evidence | |
| Search Console property type/identifier | |
| Authenticated operator | |

### Sitemap evidence

| UTC time | Sitemap URL | Live HTTP result | Search Console submission status | Discovered URLs shown | Evidence location | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| | `https://econ-undergrad-wps.sites.unlv.edu/sitemap.xml` | | | | | |

### URL Inspection and indexing requests

| UTC time | URL | Class | Indexed-data result | Live-test result | Declared canonical | Google-selected canonical | Request made/result | Evidence location | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | | |

### Redirect and metadata verification

| UTC time | Tested URL | HTTP status | Browser destination | Canonical | Robots | Sitemap present? | Social metadata result | Result | Evidence location |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | | |

### Ongoing search observation

| Observation date | Query/report | Observed URL/title | Category (`stale name`, `malformed title`, `duplicate`, `canonical`) | Live source correct? | Action/owner | Next review | Evidence location |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

## Closeout

Release reporting must state each evidence class separately. A valid closeout can read: `Local artifact verified; production response verified; sitemap submission authenticated; selected URL inspections recorded; indexing outcome pending Google.` Never shorten that statement to `reindexing complete` unless the exact intended URL set has current authenticated evidence supporting that claim.
