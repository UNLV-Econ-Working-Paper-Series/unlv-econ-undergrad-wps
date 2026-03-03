export interface ResourceLink {
  label: string;
  href: string;
  kind: "primary" | "secondary";
}

export interface PathwayStep {
  title: string;
  summary: string;
}

export const OUR_PATHWAY_STEPS: PathwayStep[] = [
  {
    title: "R1 Research Culture",
    summary: "UNLV's Carnegie R1 environment builds research rigor and evidence-first thinking.",
  },
  {
    title: "OUR Support",
    summary: "Office of Undergraduate Research programs help students develop projects and communication skills.",
  },
  {
    title: "Research Symposia",
    summary: "Students present findings publicly through poster, oral, and creative presentation formats.",
  },
  {
    title: "Spectra Journal",
    summary: "Strong projects can develop into polished manuscripts for formal undergraduate publication.",
  },
];

export const OUR_LINKS: ResourceLink[] = [
  {
    label: "Visit Research Symposia",
    href: "https://www.unlv.edu/our/research-symposia",
    kind: "primary",
  },
  {
    label: "RSVP",
    href: "https://unlv.co1.qualtrics.com/jfe/form/SV_e39xiQhQQWABzG6",
    kind: "secondary",
  },
  {
    label: "Symposia Resources",
    href: "https://sites.google.com/unlv.edu/our-rsy-student-resources/",
    kind: "secondary",
  },
];

export const SPECTRA_LINKS: ResourceLink[] = [
  {
    label: "Visit Spectra Journal",
    href: "https://oasis.library.unlv.edu/spectra/",
    kind: "primary",
  },
];

export const SYMPOSIA_POINTS: string[] = [
  "Students present capstone and independent projects in a public research setting.",
  "Presentation formats include poster sessions, oral presentations, and performances/exhibitions.",
  "Symposia run each fall and spring and help students strengthen communication and feedback cycles.",
];

export const SPECTRA_HIGHLIGHTS: string[] = [
  "Biannual and open access, with mentored undergraduate scholarship at the center.",
  "Multidisciplinary publication pathway for research completed through courses and projects.",
  "Built for discoverability and citation in undergraduate research ecosystems.",
];

export const SPECTRA_PUBLISHES: string[] = [
  "Primary research articles",
  "Primary review articles",
  "Research protocol articles",
  "Thesis-based research articles",
];

export const SPECTRA_REVIEW: string[] = [
  "Editorial screening for completeness and submission standards.",
  "Double-blind peer review with disciplinary experts.",
  "Revision cycle focused on evidence quality, method clarity, and manuscript readability.",
];
