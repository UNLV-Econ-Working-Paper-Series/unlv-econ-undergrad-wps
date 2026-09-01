# Publication Governance

Version: 1.0

Adopted in code: 2026-08-31

Review cadence: at least annually and after any material policy, authority, repository, or institutional change

## How to read this document

Every rule carries one or more evidence classifications:

- **Specification-approved**: fixed by the institutionalization specification for this implementation.
- **Official-source verified**: supported by an official UNLV, UNLV Libraries, NSHE, or platform source in `docs/audits/OFFICIAL_SOURCE_REGISTER.md`.
- **External confirmation required**: safe code can be implemented, but a named person or office must confirm the stated appointment, relationship, or workflow.
- **Private implementation required**: the control or evidence belongs in the private operations repository, not public Git.
- **Author evidence required**: the rule is evaluated from paper-specific author, faculty, rights, ethics, or consent records.

An open confirmation is not a vague placeholder. Each open item has a safe current rule, owner, requested evidence, and consequence in `EXTERNAL_CONFIRMATIONS.md`.

## 1. Identity and institutional relationship

**Specification-approved; official-source verified for names and hierarchy.**

The canonical name is **UNLV Undergraduate Economics Working Paper Series**.

The institutional hierarchy is:

1. University of Nevada, Las Vegas
2. Lee Business School
3. Molasky Family Department of Economics and Real Estate
4. UNLV Undergraduate Economics Working Paper Series

The public description is:

> An undergraduate research publication operated by its Editorial Board within the Molasky Family Department of Economics and Real Estate, Lee Business School, University of Nevada, Las Vegas.

The department and school names identify the Series' institutional location. They do not, by themselves, prove sponsorship, endorsement, legal ownership, or acceptance of this governance charter. Until written confirmation is recorded, public copy must not state that the department or school sponsors the Series.

**External confirmation required:** the department chair or authorized delegate must confirm the Series' ongoing institutional relationship and any sponsorship/ownership wording. Safe current rule: describe the Series as operated by its Editorial Board within the department. Consequence if unresolved: no sponsorship or endorsement claim may appear.

## 2. Scope and working-paper status

**Specification-approved.**

> The Series publishes original economics-related working papers by UNLV undergraduates. Papers are editorially screened but are not peer reviewed and may be revised.

Working papers are preliminary research outputs, not journal articles. Publication records must not imply peer review, replication, institutional certification of results, or guaranteed correctness. Editorial screening evaluates readiness and compliance under Section 7; it does not independently reproduce the analysis.

## 3. Eligibility and faculty sponsorship

**Specification-approved; author evidence required.**

The Series considers original economics and economics-related research authored primarily by current UNLV undergraduate students or completed while the author was enrolled as a UNLV undergraduate.

Papers developed in ECON 495 receive priority because ECON 495 is the department's undergraduate capstone research course. Publication is not limited to ECON 495, economics majors, or a single course.

UNLV undergraduate students from any major may be considered when all of the following apply:

- the paper makes a substantive contribution to an economics-related question;
- the work was completed primarily by the undergraduate author or authors;
- a UNLV faculty member agrees to serve as faculty sponsor; and
- the manuscript meets editorial, ethical, rights, data, and accessibility requirements.

A paper completed while an author was an undergraduate remains eligible if the author graduates before publication or OAsis deposit processing is complete. Students should first consult their instructor or faculty mentor; the faculty sponsor may then contact the Series to begin intake.

Private intake must retain author/coauthor approval, enrollment-at-completion evidence, faculty-sponsor acceptance, contribution/originality attestations, rights records, disclosures, and consent records. Public Git must not contain student identifiers beyond approved publication metadata.

## 4. Editorial Board and Editorial Team

**Specification-approved; external confirmation required for appointments and title acceptance.**

The Editorial Board holds final publication and policy authority under this charter.

| Intended member | Safe public title | Voting authority | Confirmation boundary |
| --- | --- | --- | --- |
| Mark Jayson Martinez Farol | Managing Editor and Series Organizer | Yes | Written role acceptance and term/continuity record required |
| Djeto Assané | Faculty Editor | Yes | Written role acceptance required; add `and Faculty Sponsor` only after that title is expressly accepted |
| Eric Chiang | Faculty Editor | Yes | Written role acceptance and term/continuity record required |

The broader Editorial Team may include Board members, Junior Editors, temporary editorial assistants, metadata support, accessibility support, and publication-production support.

Brandon Penticoff is the intended current **Junior Editor** and has no vote. Appointment/term confirmation and public-profile consent must be retained privately before a biography, photograph, personal email, or external profile link is published. The name and intended role in this charter do not constitute consent for those profile elements.

> The Editorial Board oversees the Series' scope, editorial screening, publication decisions, issue planning, corrections, revisions, withdrawals, and publication policies.

> Junior Editors assist with initial screening, metadata review, manuscript preparation, accessibility checks, and issue production. Junior Editors may make recommendations but do not independently accept or reject papers.

## 5. Voting and ad hoc review

**Specification-approved; private implementation required.**

> A paper must be approved by at least two non-conflicted voting editors, including at least one Faculty Editor.

A faculty sponsor may mentor and recommend a paper but cannot be its sole approving editor. When fewer than two non-conflicted voting editors are available, the Editorial Board may appoint a qualified UNLV faculty member as an ad hoc reviewer for that paper.

The private decision record must identify the eligible voting pool, disclosures, recusals, approvers, Faculty Editor participation, decision, conditions, date, and the location of any supporting review. Public records report the outcome but do not expose confidential deliberation.

## 6. Conflicts and recusal

**Specification-approved; private implementation required.**

An editor must disclose a relationship or interest that could reasonably affect impartiality, including teaching or current supervision of an author, coauthorship, close personal or family relationships, employment, financial interests, active disputes, prior advocacy for the paper, or any other inability to remain impartial.

Recusal removes the editor from deliberation, voting, appeal review, and access to confidential material not needed for their remaining duties. The remaining non-conflicted editors decide whether an disclosed circumstance requires recusal. If the remaining Board cannot form the required approval group, it appoints an ad hoc UNLV faculty reviewer.

The public standard is published at `/policies/conflicts-recusal/`. Paper-specific disclosures, determinations, and access restrictions remain private.

## 7. Five-stage publication process

**Specification-approved; author evidence and private implementation required.**

### Stage 1: Intake and eligibility

Confirm UNLV undergraduate eligibility, faculty sponsorship, economics-related scope, complete materials, author/coauthor identities and approval, rights documentation, and required consent records.

### Stage 2: Editorial screening

Review the research question, contribution, evidence or data, methodology, support for conclusions, citations, disclosures, writing, presentation, and research readiness.

Editorial screening is not peer review, replication, or certification that the paper's methods and conclusions are correct.

### Stage 3: Compliance screening

Confirm authorship and originality attestations, copyright/permissions, material AI-use disclosure, conflicts, human-subjects or research-ethics status, restricted-data compliance, accessibility, and data/code availability statements.

The Series does not issue IRB approval or decide formal research-misconduct proceedings. Applicable questions must be escalated to the UNLV Office of Research Integrity or other responsible university office.

### Stage 4: Editorial decision

Valid outcomes are:

- Accepted for publication
- Accepted subject to specified revisions
- Revise and resubmit
- Deferred to a later issue
- Declined

The voting rule in Section 5 applies to acceptance. Private records must capture conditions and notices.

### Stage 5: Production

Complete final metadata verification, accessible-document review, citation generation, OAsis submission/record coordination, DOI confirmation, custom paper-page publication, issue release, sitemap update, post-publication link verification, and version-log creation.

## 8. Corrections, revisions, restrictions, and withdrawal

**Specification-approved; private implementation required; OAsis coordination externally confirmable.**

| Action | Required authority |
| --- | --- |
| Correct a typo, broken link, or non-substantive metadata error | Managing Editor, with author notification |
| Correct an author name, title, abstract, or bibliographic field | Managing Editor after written author confirmation and, where relevant, OAsis coordination |
| Replace a PDF only for accessibility or formatting, without substantive change | Managing Editor plus author approval |
| Replace a manuscript with a substantive revision | Author, faculty sponsor, and two non-conflicted voting editors including one Faculty Editor |
| Publish a correction notice | Two non-conflicted voting editors including one Faculty Editor |
| Temporarily remove a custom-site PDF link for a credible urgent rights/privacy concern | Managing Editor or Faculty Editor pending formal review |
| Restrict an OAsis record or file | OAsis administration in coordination with the Editorial Board |
| Withdraw a paper | Majority of non-conflicted voting editors, including one Faculty Editor, coordinated with OAsis |
| Decide an appeal | Non-conflicted Faculty Editor not responsible for the original decision, or appointed ad hoc faculty reviewer |

Minor metadata and presentation errors may be corrected administratively. Substantive revisions, correction notices, restrictions, and withdrawals require editorial approval.

The record must distinguish a metadata correction, accessibility replacement, substantive revision, corrigendum, expression of concern, temporary restriction, withdrawal, and complete removal compelled by law, privacy, or safety. A withdrawal ordinarily preserves a public tombstone with title, authors, original publication information, withdrawal date, and reason, subject to legal, privacy, and safety limits.

The operational requirements, notices, and evidence for each action are defined in `EDITORIAL_AUTHORITY_MATRIX.md`.

## 9. Appeals

**Specification-approved; private implementation required.**

An author or faculty sponsor may appeal an editorial decision or post-publication action by identifying the decision, the specific procedural or factual basis, and the requested remedy. An appeal is not a second vote by the original decision-makers.

A non-conflicted Faculty Editor who was not responsible for the original decision decides the appeal. If none is available, the Board appoints a qualified ad hoc UNLV faculty reviewer. The reviewer may affirm, return for reconsideration, or modify the action within this charter's authority limits. The private record retains the request, conflict check, reviewer appointment, evidence considered, decision, rationale, and notifications.

## 10. OAsis and permanent records

**Official-source verified for repository functions; specification-approved for the Series designation; external confirmation required for workflow terminology and coordination.**

OAsis is UNLV's institutional repository and a service of UNLV University Libraries. The Series designates the OAsis item record and deposited full text as the permanent repository record for each deposited paper. OAsis provides the item record, file access, persistent URL, preservation service, and usage information. Where assigned, the DOI resolves to the OAsis record.

The Editorial Board selects papers, assigns issues, and decides Series policy. OAsis preserves and provides access to deposited records but does not make Series editorial decisions. The custom site is a distinct discovery and reader interface with its own canonical paper URLs; DOI and OAsis URLs express the record relationship. The custom site must not silently host a materially different substantive PDF.

OAsis must not be described as the publisher. Until UNLV University Libraries confirms the phrase `repository of record`, public copy uses the Series-side designation above and does not imply that OAsis accepted a new contractual duty.

## 11. Spectra and future publication

**Official-source verified for Spectra's separate policies; specification-approved caution; external confirmation required for any referral claim.**

Publication in the Series can give a paper a stable public record and allow continued development with a faculty mentor. Journal policies differ. Before authorizing public posting, authors should discuss future publication plans with their faculty sponsor and review the prior-publication/working-paper policies of any intended journal.

Students considering submission to Spectra should consult the Spectra editors and their faculty mentor before authorizing public posting in this Series. The Series does not promise Spectra eligibility, referral, review, acceptance, submission, or preference.

## 12. Public and private record boundaries

**Specification-approved; private implementation required; NSHE source verified.**

Public Git may contain approved publication metadata, abstracts, issue assignments, public policies, public role/name records, public notices, and non-sensitive audit evidence. It must not contain unpublished manuscripts, student contact details, private consent, ballots, reviewer identities, deliberation, disputes, IRB documents, rights correspondence, authentication material, mailbox recovery information, or private OAsis submission packets.

The private operations repository retains intake materials, approvals, disclosures, role acceptances, consent, decision logs, correction/withdrawal evidence, repository correspondence, and operational access records according to the applicable NSHE/UNLV retention classification. The responsible owner must classify each record series; no fixed deletion period may be invented in public code.

## 13. Review and change control

**Specification-approved; external confirmation and private implementation required.**

The Editorial Board reviews this charter at least annually and after material changes to institutional relationships, authority, eligibility, review, corrections, repository workflows, privacy, accessibility, rights, or retention.

- Editorial copy/implementation changes that do not alter policy require the Managing Editor plus one non-conflicted voting editor.
- Material policy, schema, authority, retention, repository, domain, or infrastructure changes require two non-conflicted voting editors including a Faculty Editor.
- Appointment changes require written acceptance and an effective date recorded privately before public configuration changes.
- Emergency technical action may restore availability or protect rights/privacy, but it cannot permanently change editorial status without the applicable authority. It must be recorded and reviewed within five business days.

No code commit, pull request, or deployment substitutes for the required editorial, author, institutional, library, or records approval.
