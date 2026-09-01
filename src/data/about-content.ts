import { ELIGIBILITY, OASIS, SERIES } from "../config/publication";
import type { AboutPageContent } from "./about-content.types";

export const ABOUT_PAGE_CONTENT: AboutPageContent = {
  banner: {
    title: "About the Series",
    lead: "Undergraduate economics research, organized for discovery and preserved through UNLV's institutional repository",
    note: SERIES.workingPaperNotice,
  },
  tocItems: [
    { id: "purpose", label: "Purpose and home" },
    { id: "scope", label: "Scope and eligibility" },
    { id: "publication-status", label: "Working papers and issues" },
    { id: "publication-process", label: "Publication process" },
    { id: "repository", label: "OAsis repository record" },
  ],
  purpose: {
    id: "purpose",
    title: "Purpose and institutional home",
    paragraphs: [
      SERIES.description,
      "The Series gives readers a stable way to discover undergraduate economics research and gives qualifying student authors a structured publication process with faculty sponsorship, editorial screening, accessible document preparation, and durable repository records.",
    ],
  },
  scope: {
    id: "scope",
    title: "Scope and eligibility",
    paragraphs: [ELIGIBILITY.summary, ELIGIBILITY.capstonePriority, ELIGIBILITY.inclusiveSummary],
    points: [
      "The work must make a substantive economics-related contribution.",
      "A UNLV faculty sponsor is required before the Series begins intake.",
      "The Series does not currently accept unsupported direct submissions from students.",
    ],
  },
  publicationStatus: {
    id: "publication-status",
    title: "Working-paper status and semester issues",
    paragraphs: [
      SERIES.scope,
      "Accepted papers are organized into semester issues. An issue is an editorial and discovery grouping for papers released together; it does not convert a working paper into a peer-reviewed journal article.",
    ],
  },
  process: {
    id: "publication-process",
    title: "A five-stage publication process",
    introduction:
      "The Editorial Board applies one documented process to each proposed paper. Detailed requirements and decision authority are set out in the public policies.",
    steps: [
      {
        title: "Intake and eligibility",
        description:
          "Confirm undergraduate eligibility, faculty sponsorship, scope, authorship, required materials, rights, and consent records.",
      },
      {
        title: "Editorial screening",
        description:
          "Review the research question, contribution, evidence, methods, conclusions, citations, writing, and research readiness.",
      },
      {
        title: "Compliance screening",
        description:
          "Review authorship, permissions, disclosures, research ethics, restricted data, accessibility, and data and code statements.",
      },
      {
        title: "Editorial decision",
        description: "Issue a documented outcome under the voting, conflict-of-interest, and recusal rules.",
      },
      {
        title: "Production",
        description:
          "Verify metadata and document accessibility, prepare citations, coordinate the OAsis record, release the issue, and check public links.",
      },
    ],
  },
  repository: {
    id: "repository",
    title: "The OAsis repository record",
    paragraphs: [OASIS.safeDescription, OASIS.relationship],
  },
  cta: {
    title: "Learn more",
    body: "Meet the Editorial Board, review the submission path for student authors, or read the policies that govern screening and publication.",
    actions: [
      { label: "Editorial Board", href: "/editorial-board/", primary: true },
      { label: "For Student Authors", href: "/for-authors/" },
      { label: "Publication Policies", href: "/policies/" },
    ],
  },
};
