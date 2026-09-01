import type { PublicationRecord } from "../../src/lib/publication/types";

export function publicationFixture(): PublicationRecord {
  return {
    title: "Paper 12: María's Wages & AI_Models: Evidence from a 50% Sample",
    authors: [
      {
        name: "María O'Connor",
        affiliation: "University of Nevada, Las Vegas",
        orcid: "https://orcid.org/0000-0002-1825-0097",
        institutional_profile: "https://www.unlv.edu/people/maria-oconnor",
      },
      { name: "Djeto Assané" },
    ],
    abstract: "This paper estimates wage differences using a transparent specification.",
    keywords: ["wages", "artificial intelligence", "labor"],
    field: "Labor Economics and Demography",
    issue_term: "Fall 2025",
    issue_slug: "2025-fall",
    volume: 2,
    issue_number: 2,
    series_number: "UNLV-Econ-WPS-2025-004",
    citable_published_at: "2025-12-15",
    repository_published_at: "2026-08-05",
    current_version: {
      label: "Version 2",
      published_at: "2026-08-05",
      note: "Corrects Table 2 and clarifies the interpretation.",
      oasis_url: "https://oasis.library.unlv.edu/econ_ug_papers/4/",
      pdf_url: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1004&context=econ_ug_papers",
    },
    previous_versions: [
      {
        label: "Version 1",
        published_at: "2026-05-21",
        note: "Initial repository version.",
        oasis_url: "https://oasis.library.unlv.edu/econ_ug_papers/4/",
        status: "corrected",
      },
    ],
    faculty_sponsor: {
      name: "Eric Chiang",
      profile_url: "https://www.unlv.edu/people/eric-chiang",
    },
    doi: "HTTPS://DOI.ORG/10.9741%2F2578-3170.1004",
    oasis_url: "HTTP://OASIS.LIBRARY.UNLV.EDU/ECON_UG_PAPERS/4?source=test#record",
    pdf_url: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1004&context=econ_ug_papers",
    pages: "1-24",
    rights_statement: "Authors retain copyright.",
    license_url: "https://creativecommons.org/licenses/by-nc/4.0/",
    copyright_holder: "María O'Connor and Djeto Assané",
    conflict_statement: "The authors report no conflicts of interest.",
    ai_disclosure: "Generative AI was used for code documentation and verified by the authors.",
    ethics_statement: "Not applicable: no human participants or identifiable private information.",
    data_availability: "Public data are available from the named source.",
    code_availability: "Code is available in a public repository.",
  };
}

export function minimalPublicationFixture(): PublicationRecord {
  const record = publicationFixture();
  return {
    ...record,
    title: "A Minimal Record",
    authors: [{ name: "Li Wei" }],
    keywords: ["economics"],
    series_number: "UNLV-Econ-WPS-2025-005",
    faculty_sponsor: undefined,
    doi: undefined,
    pages: undefined,
    rights_statement: undefined,
    license_url: undefined,
    copyright_holder: undefined,
    conflict_statement: undefined,
    ai_disclosure: undefined,
    ethics_statement: undefined,
    data_availability: undefined,
    code_availability: undefined,
    current_version: {
      ...record.current_version,
      label: undefined,
      note: undefined,
    },
    previous_versions: [],
  };
}

export function historicalPublicationFixture(): PublicationRecord {
  return {
    ...minimalPublicationFixture(),
    title: "Historical Employment Patterns",
    issue_term: "Spring 2017",
    issue_slug: "2017-spring",
    series_number: "UNLV-Econ-WPS-2017-001",
    citable_published_at: "2017-05-15",
    repository_published_at: "2026-08-31",
    current_version: {
      published_at: "2026-08-31",
      oasis_url: "https://oasis.library.unlv.edu/econ_ug_papers/101/",
      pdf_url: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1101&context=econ_ug_papers",
    },
    oasis_url: "https://oasis.library.unlv.edu/econ_ug_papers/101/",
    pdf_url: "https://oasis.library.unlv.edu/cgi/viewcontent.cgi?article=1101&context=econ_ug_papers",
    historical_provenance: {
      source_name: "UNLV Economics Hub",
      original_url: "https://economics-hub.example.edu/papers/employment-patterns/",
      original_term: "Spring 2017",
      original_publication_date: "2017-05-15",
      migrated_at: "2026-08-31",
      note: "Metadata verified from the historical issue page; full text reviewed separately.",
    },
  };
}
