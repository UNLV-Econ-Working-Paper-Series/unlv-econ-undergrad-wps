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

export interface AboutProseSection {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

export interface AboutPublicationStep {
  title: string;
  description: string;
}

export interface AboutPublicationSection {
  id: string;
  title: string;
  introduction: string;
  steps: AboutPublicationStep[];
}

export interface AboutCtaSection {
  title: string;
  body: string;
  actions: AboutActionLink[];
}

export interface AboutPageContent {
  banner: AboutBannerContent;
  tocItems: AboutTocItem[];
  purpose: AboutProseSection;
  scope: AboutProseSection;
  publicationStatus: AboutProseSection;
  process: AboutPublicationSection;
  repository: AboutProseSection;
  cta: AboutCtaSection;
}
