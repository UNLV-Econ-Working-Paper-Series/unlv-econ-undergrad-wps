export interface ResourceLink {
  label: string;
  href: string;
  kind: "primary" | "secondary";
}

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
  "Open to undergraduate researchers across UNLV, including Department of Economics projects.",
  "Formats include posters, oral presentations, and performances or exhibitions.",
  "Held each fall and spring to support public communication and research feedback.",
];

export const SPECTRA_PUBLISHES: string[] = [
  "Primary research articles",
  "Primary review articles",
  "Research protocol articles",
  "Thesis-based research articles",
];

export const SPECTRA_REVIEW: string[] = [
  "Double-blind peer review with disciplinary experts.",
  "Editorial checks for clarity, structure, and submission completeness.",
  "Revision cycle focused on evidence quality and manuscript readiness.",
];
