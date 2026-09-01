import type { ResearchField } from "../../config/publication";

export type IsoDate = string;

export interface PublicationAuthor {
  name: string;
  affiliation?: string;
  orcid?: string;
  institutional_profile?: string;
  public_profile?: string;
}

export interface FacultySponsor {
  name: string;
  profile_url?: string;
}

export interface CurrentPublicationVersion {
  label?: string;
  published_at: IsoDate;
  note?: string;
  oasis_url: string;
  pdf_url: string;
}

export type PreviousVersionStatus = "superseded" | "corrected" | "withdrawn";

export interface PreviousPublicationVersion {
  label: string;
  published_at: IsoDate;
  note: string;
  public_url?: string;
  oasis_url?: string;
  status: PreviousVersionStatus;
}

export interface HistoricalProvenance {
  source_name: string;
  original_url?: string;
  original_term: string;
  original_publication_date?: IsoDate;
  migrated_at?: IsoDate;
  note: string;
}

/**
 * Public, citable paper data only. Private consent, ballots, reviews, and rights
 * evidence intentionally do not belong in this shape.
 */
export interface PublicationRecord {
  title: string;
  authors: PublicationAuthor[];
  abstract: string;
  keywords: string[];
  field: ResearchField;
  issue_term: string;
  issue_slug: string;
  volume: number;
  issue_number: number;
  series_number: string;
  issue_published_at?: IsoDate;
  citable_published_at: IsoDate;
  repository_published_at: IsoDate;
  current_version: CurrentPublicationVersion;
  previous_versions: PreviousPublicationVersion[];
  faculty_sponsor?: FacultySponsor;
  doi?: string;
  oasis_url: string;
  pdf_url: string;
  pages?: string;
  rights_statement?: string;
  license_url?: string;
  copyright_holder?: string;
  conflict_statement?: string;
  ai_disclosure?: string;
  ethics_statement?: string;
  data_availability?: string;
  code_availability?: string;
  historical_provenance?: HistoricalProvenance;
}

export type CitationStyle = "repository" | "apa" | "mla" | "chicago";

export interface CitationOption {
  id: CitationStyle;
  label: string;
  citation: string;
}

export interface MetaTagData {
  name: string;
  content: string;
}
