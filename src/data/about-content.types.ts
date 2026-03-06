import type { RichTextBlock, RichTextSegment } from "./rich-text.types";

export interface AboutTocItem {
  id: string;
  label: string;
}

export interface AboutBannerContent {
  title: string;
  lead: string;
  note: string;
}

export interface AboutActionLink {
  label: string;
  href: string;
  primary?: boolean;
}

export interface AboutGlanceSection {
  title: string;
  items: RichTextSegment[][];
}

export interface AboutSeriesScopeSection {
  title: string;
  blocks: RichTextBlock[];
}

export interface AboutPublicationStep {
  title: string;
  description: string;
}

export interface AboutPublicationSection {
  title: string;
  steps: AboutPublicationStep[];
}

export interface AboutPolicySectionItem {
  summary: string;
  open?: boolean;
  blocks: RichTextBlock[];
}

export interface AboutPoliciesSection {
  title: string;
  sections: AboutPolicySectionItem[];
}

export interface AboutCreditsSection {
  title: string;
  items: Array<{
    label: string;
    value: string;
  }>;
}

export interface AboutPeopleSection {
  title: string;
}

export interface AboutGraduateAssistantsSection extends AboutPeopleSection {
  linkLabel: string;
  linkHref: string;
  emptyText: string;
}

export interface AboutCtaSection {
  title: string;
  body: string;
  actions: AboutActionLink[];
}

export interface AboutPageContent {
  banner: AboutBannerContent;
  tocItems: AboutTocItem[];
  atAGlance: AboutGlanceSection;
  seriesScope: AboutSeriesScopeSection;
  publication: AboutPublicationSection;
  policies: AboutPoliciesSection;
  editorialTeam: AboutPeopleSection;
  credits: AboutCreditsSection;
  graduateAssistants: AboutGraduateAssistantsSection;
  cta: AboutCtaSection;
}
