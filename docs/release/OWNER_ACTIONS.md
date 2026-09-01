# Release owner actions

Updated: 2026-08-31

These are decisions that code, public web pages, and repository evidence cannot make. Supporting correspondence, approvals, ballots, and consent records belong in the private operations repository. A pull-request merge does not close an item.

Completion requires the confirmer's name and authority, exact decision, effective date, scope, evidence location, and reviewer. Until then, the listed safe interim behavior controls the public site.

## OA-01 — Editorial roles and public titles

**Decision needed:** Confirm the current title, voting status, term, and authority of every named editor and the public status of the Junior Editor appointment.

**Why it matters:** The charter, quorum, recusal, authorship, profiles, and public accountability depend on actual appointments rather than draft labels.

**Exact owners:** Djeto Assané; Eric Chiang; Brandon Penticoff; Mark Jayson Martinez Farol; department chair or authorized delegate for institutional confirmation.

**Exact questions:**

1. Does Djeto Assané accept the public title `Faculty Editor`, voting membership, duties, and effective term? May any separate `Faculty Sponsor` title be used?
2. Does Eric Chiang accept the public title `Faculty Editor`, voting membership, duties, and effective term?
3. Is Brandon Penticoff currently appointed as a non-voting `Junior Editor`; for what term and duties; and which name, biography, photograph, contact, ORCID, institutional, and professional links may be public?
4. Does Mark Jayson Martinez Farol accept `Managing Editor and Series Organizer`, voting membership, duties, and effective term?

**Evidence required:** Written acceptance from each person plus the department-authorized appointment or acknowledgement. Store public-profile consent separately from appointment evidence.

**Safe interim behavior:** Use the bounded titles in configuration; keep Brandon's profile minimal; do not claim Djeto's separate Faculty Sponsor title; disclose externally unconfirmed governance status in release review.

**Release impact:** Blocks formal institutional adoption and use of the appointments as proven operating authority. It does not block review of the code or the bounded public role descriptions.

**Affected files:** `src/config/editorial.ts`, `src/data/public-profiles.ts`, `src/pages/editorial-board/`, `docs/governance/PUBLICATION_GOVERNANCE.md`, private appointment and consent records.

**Completion:** Status: Open. Decision date: ____. Confirmers: ____. Evidence: ____. Recorded by: ____.

## OA-02 — Governance approval

**Decision needed:** Adopt, amend, or reject the proposed editorial authority model.

**Why it matters:** Acceptance, rejection, correction, withdrawal, appeal, and conflicted-review decisions need a defensible decision maker and record.

**Exact owner:** Voting Editorial Board, with department chair or authorized delegate where institutional acknowledgement is required.

**Exact questions:**

1. Is every publication decision subject to a two-editor rule?
2. Must at least one participating editor be a Faculty Editor?
3. Must a conflicted editor disclose, recuse, leave deliberation, and not count toward the required two editors?
4. Who appoints an ad hoc reviewer when recusals prevent the normal rule?
5. Is the published authority matrix accurate for metadata fixes, substantive corrections, replacements, restrictions, withdrawals, appeals, and emergency takedowns?
6. Who receives an appeal, what can be reconsidered, and what is the final authority?

**Evidence required:** Dated approval record identifying eligible voters, recusals, adopted language, effective date, and review date.

**Safe interim behavior:** Publish the proposed accountable model as Series policy while labeling external confirmation open in release documentation; never fabricate a vote or approval date.

**Release impact:** Blocks a claim that the governance charter is institutionally adopted and blocks using it as proof of private decision authority. The public safety rules remain the default editorial constraint.

**Affected files:** `docs/governance/PUBLICATION_GOVERNANCE.md`, `docs/governance/EDITORIAL_AUTHORITY_MATRIX.md`, public policy routes, private decision templates.

**Completion:** Status: Open. Decision date: ____. Vote/approval record: ____. Evidence: ____. Recorded by: ____.

## OA-03 — OAsis repository operations

**Decision needed:** Confirm the working relationship, responsibilities, and supported repository actions between the Series and OAsis.

**Why it matters:** Permanent records, DOI targets, versions, withdrawals, historical deposits, accessible replacements, and supplements cannot be promised by the custom site alone.

**Exact owner:** Authorized UNLV University Libraries/OAsis administrator, coordinated by the Managing Editor.

**Exact questions:**

1. Is the safer statement that the Series _designates_ the OAsis item and deposited full text as its permanent repository record acceptable?
2. How are revisions deposited, related, labeled, and preserved; are prior versions retained publicly?
3. How are corrections, restrictions, and withdrawals represented, and which public tombstone fields remain?
4. Can verified historical papers be deposited, and what rights/provenance package is required?
5. Who assigns or updates DOIs, and how are target errors corrected?
6. Can an accessible replacement file be deposited without silently changing the scholarly record?
7. Can data/code supplements be deposited and related to a paper?
8. Should the custom domain ever emit a cross-domain `citation_pdf_url`, and what exact full-text URL is canonical?

**Evidence required:** Written administrator response, supported workflow, required metadata/file checklist, revision/withdrawal rules, canonical URL guidance, and responsible contacts.

**Safe interim behavior:** Call OAsis the institutional repository, never the publisher; link item and PDF records; omit cross-domain `citation_pdf_url`; make no supplement or revision-service promise.

**Release impact:** Blocks stronger repository commitments, historical deposits, supplement promises, and cross-domain Scholar PDF metadata. It does not block verified links to existing public records.

**Affected files:** `src/config/publication.ts`, paper metadata utilities, policy pages, archive inventory, Search/Scholar runbooks, private OAsis outreach draft.

**Completion:** Status: Open. OAsis confirmer/date: ____. Evidence: ____. Implemented by: ____.

## OA-04 — Spectra prior-publication treatment

**Decision needed:** Clarify how public working-paper posting affects possible later submission to Spectra.

**Why it matters:** Students must not receive an unsupported promise of eligibility, referral, preference, or publication pathway.

**Exact owner:** Authorized Spectra editors or UNLV Office of Undergraduate Research representative.

**Exact questions:** Does a Series working paper count as prior publication; may a substantially revised paper remain eligible; what disclosure and citation are required; must a Series paper be withdrawn or replaced; and who gives case-specific guidance?

**Evidence required:** Written policy interpretation or authoritative published policy URL with effective date and contact.

**Safe interim behavior:** Tell students only to consult Spectra and their faculty mentor before authorizing public posting. Make no eligibility, referral, review, acceptance, or preference claim.

**Release impact:** Blocks only a stronger Spectra pathway claim. It does not block the Series or its current cautionary language.

**Affected files:** `src/pages/for-authors.astro`, public policy copy, private Spectra outreach draft.

**Completion:** Status: Open. Decision date: ____. Confirmer: ____. Evidence: ____. Recorded by: ____.

## OA-05 — Historical archive recovery

**Decision needed:** Decide the disposition of each inventoried historical paper after source, bibliographic, rights, accessibility, author-name, and repository review.

**Why it matters:** Prior web availability is not permission to republish, proof of the final version, or accessibility evidence.

**Exact owners:** Managing Editor; each author/rightsholder and faculty sponsor as applicable; accessibility reviewer; OAsis administrator.

**Exact questions:** Where is the final file; are title and author order correct; who controls copyright; is public redistribution authorized; may the author name remain public; is the file accessible or remediable; will OAsis accept it; and what original/migration dates must display?

**Evidence required:** Record-level source checksum, provenance, final-version confirmation, written rights/consent, accessibility result, OAsis disposition, and public metadata approval.

**Safe interim behavior:** Keep the bounded metadata-only archive; publish no historical PDF, download control, rights claim, completeness claim, or OAsis-deposit promise.

**Release impact:** Blocks historical full-text migration record by record. It does not block the current clearly labeled metadata-only archive.

**Affected files:** `docs/archive/`, `src/data/archive-papers.ts`, `src/pages/issues/archive*`, private historical review records.

**Completion:** Status: Open for all inventoried records. Per-record log/evidence: ____. Last reviewed: ____.

## OA-06 — Contact ownership and records retention

**Decision needed:** Confirm the role mailbox, backup coverage, official records location, retention/disposition rules, public-record escalation route, and department contact data.

**Why it matters:** Submission, consent, editorial, correction, withdrawal, and public inquiries are university-operational records and require continuity beyond one individual.

**Exact owners:** Department chair or delegate; designated mailbox owner and backup; department/UNLV records liaison; public-records authority where applicable.

**Exact questions:** Who owns and backs up the role account; which public phone/address are approved; what record classes and retention schedules apply; where are records stored; who may access them; how are legal hold/public-record requests escalated; and what deletion is authorized?

**Evidence required:** Account ownership record, backup assignment, approved public contacts, applicable schedule/policy citation, repository/access procedure, and escalation contact.

**Safe interim behavior:** Use only the approved role address currently configured; retain operational records privately; publish no personal email; perform no automated deletion; state the bounded retention/public-record notice.

**Release impact:** Blocks a final retention/disposition SOP and unsupported contact details. It does not block the existing role-address contact route.

**Affected files:** `src/config/publication.ts`, `src/pages/contact.astro`, privacy policy, private mailbox-governance record.

**Completion:** Status: Open. Owner/backup: ____. Schedule/evidence: ____. Approved contacts: ____. Recorded by: ____.

## OA-07 — Search ownership, deployment, and repository protection

**Decision needed:** Confirm who owns Google Search Console, the canonical Faculty Sites release process, host configuration, rollback authority, and GitHub branch protection.

**Why it matters:** A built ZIP or pushed branch is not a live, secure, indexed, or recoverable release.

**Exact owners:** Authorized Faculty Sites/cPanel operator; UNLV IT/security as applicable; Search Console property owner; GitHub repository administrator; Managing Editor for release sign-off.

**Exact questions:**

1. Who controls the production document root and may deploy or roll back?
2. Does the host support staging or atomic replacement, backups, custom 404 mapping, MIME types, security headers, cache rules, compression, and directory-index disabling?
3. Who owns the domain-prefix Search Console property and may submit the sitemap or request indexing?
4. Which CI check will protect `main`, who approves pull requests, and who may use a documented emergency override?
5. Should the broken secondary GitHub Pages surface be disabled?

**Evidence required:** Named owners and backups; actual document root; approved deploy/rollback procedure; tested header/MIME/404 configuration; Search Console verification; GitHub ruleset URL/API output; release sign-off record.

**Safe interim behavior:** Build and package locally/CI only; do not deploy; do not add untested `.htaccess`; do not claim Search/Scholar indexing; use feature branches and pull requests; document that `main` was unprotected at audit time.

**Release impact:** `DEPLOY-001` blocks formal production deployment and a production-ready security/MIME/404 claim. Search ownership blocks indexing actions only. Branch protection blocks governance sign-off but not creation of the review pull request.

**Affected files:** `.github/workflows/`, `docs/operations/`, `docs/release/GOOGLE_*`, hosting configuration outside this repository, GitHub repository settings.

**Completion:** Status: Open. Deployment owner: ____. Search owner: ____. Ruleset: ____. Host test evidence: ____. Release approval: ____.
