export interface EditorialMember {
  id: string;
  name: string;
  publicTitle: string;
  voting: boolean;
  description: string;
}

export const EDITORIAL_BOARD: readonly EditorialMember[] = [
  {
    id: "mark-jayson-martinez-farol",
    name: "Mark Jayson Martinez Farol",
    publicTitle: "Managing Editor and Series Organizer",
    voting: true,
    description:
      "Participates in editorial screening and publication decisions and oversees Series operations, issue preparation, metadata review, OAsis coordination, policy implementation, and maintenance of the public working-paper catalog.",
  },
  {
    id: "djeto-assane",
    name: "Djeto Assané",
    publicTitle: "Faculty Editor",
    voting: true,
    description:
      "Provides faculty oversight, participates in editorial screening and publication decisions, supports faculty sponsorship and academic-policy interpretation, and advises on research readiness and the development of undergraduate authors.",
  },
  {
    id: "eric-chiang",
    name: "Eric Chiang",
    publicTitle: "Faculty Editor",
    voting: true,
    description:
      "Participates in editorial screening and publication decisions and advises on research presentation, undergraduate scholarship, and publication readiness.",
  },
] as const;

export const JUNIOR_EDITORS: readonly EditorialMember[] = [
  {
    id: "brandon-penticoff",
    name: "Brandon Penticoff",
    publicTitle: "Junior Editor",
    voting: false,
    description:
      "Supports initial manuscript screening, metadata review, issue preparation, accessibility checks, and other editorial production work under the direction of the Editorial Board.",
  },
] as const;

export const EDITORIAL_BOARD_DESCRIPTION =
  "The Editorial Board oversees the Series' scope, editorial screening, publication decisions, issue planning, corrections, revisions, withdrawals, and publication policies.";

export const JUNIOR_EDITOR_DESCRIPTION =
  "Junior Editors assist with initial screening, metadata review, manuscript preparation, accessibility checks, and issue production. Junior Editors may make recommendations but do not independently accept or reject papers.";

export const PUBLICATION_APPROVAL_RULE =
  "A paper must be approved by at least two non-conflicted voting editors, including at least one Faculty Editor.";

export const AD_HOC_REVIEWER_RULE =
  "When fewer than two non-conflicted voting editors are available, the Editorial Board may appoint a qualified UNLV faculty member to serve as an ad hoc reviewer for that paper.";
