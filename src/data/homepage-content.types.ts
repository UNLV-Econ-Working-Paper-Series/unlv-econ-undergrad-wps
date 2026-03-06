export type HomeLink = {
  label: string;
  href?: string;
};

export type HomeLatestIssueEditable = {
  title?: string;
  href?: string;
  metaText?: string;
  featuredItems?: HomeLink[];
  emptyStateText?: string;
  primaryCta?: HomeLink;
  secondaryCta?: HomeLink;
};

export type HomeNewsAndEventsEditable = {
  eyebrow?: string;
  title?: string;
  items?: string[];
  emptyStateText?: string;
};

export type HomePageEditableContent = {
  latestIssue?: HomeLatestIssueEditable;
  newsAndEvents?: HomeNewsAndEventsEditable;
};
