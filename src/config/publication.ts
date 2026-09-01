import { INSTITUTION } from "./institution";

export const SERIES = {
  name: "UNLV Undergraduate Economics Working Paper Series",
  mastheadName: "Undergraduate Economics Working Paper Series",
  description:
    "An undergraduate research publication operated by its Editorial Board within the Molasky Family Department of Economics and Real Estate, Lee Business School, University of Nevada, Las Vegas.",
  scope:
    "The Series publishes original economics-related working papers by UNLV undergraduates. Papers are editorially screened but are not peer reviewed and may be revised.",
  workingPaperNotice:
    "Working papers are preliminary research outputs. They are editorially screened, are not peer reviewed, and may be revised.",
  siteUrl: "https://econ-undergrad-wps.sites.unlv.edu/",
  contactEmail: "contact@econ-undergrad-wps.sites.unlv.edu",
} as const;

export const OASIS = {
  name: "OAsis",
  collectionUrl: "https://oasis.library.unlv.edu/econ_ug_papers/",
  aboutUrl: "https://oasis.library.unlv.edu/about.html",
  safeDescription:
    "The Series designates the OAsis item record and deposited full text as the permanent repository record for each paper.",
  relationship:
    "OAsis is UNLV's institutional repository and a service of UNLV University Libraries. It hosts deposited item records and full-text files, supports preservation through persistent URLs, and provides readership and download information. The Editorial Board, not OAsis, makes the Series' editorial decisions.",
} as const;

export const ELIGIBILITY = {
  summary:
    "The Series considers original economics and economics-related research authored primarily by current UNLV undergraduate students or completed while the author was enrolled as a UNLV undergraduate.",
  inclusiveSummary:
    "UNLV undergraduate students from any major may be considered when their work makes a substantive economics-related contribution and has a faculty sponsor.",
  capstonePriority:
    "Papers developed in ECON 495 receive priority because ECON 495 is the department's undergraduate capstone research course. Publication is not limited to ECON 495, economics majors, or a single course.",
  facultySponsorRequired: true,
} as const;

export const PUBLIC_ROUTES = {
  home: "/",
  papers: "/papers/",
  issues: "/issues/",
  fields: "/fields/",
  authors: "/for-authors/",
  about: "/about/",
  editorialBoard: "/editorial-board/",
  history: "/history/",
  policies: "/policies/",
  contact: "/contact/",
} as const;

export const PRIMARY_NAVIGATION = [
  { href: PUBLIC_ROUTES.home, label: "Home" },
  { href: PUBLIC_ROUTES.papers, label: "Working Papers" },
  { href: PUBLIC_ROUTES.issues, label: "Issues" },
  { href: PUBLIC_ROUTES.fields, label: "Research Fields" },
  { href: PUBLIC_ROUTES.authors, label: "For Student Authors" },
  { href: PUBLIC_ROUTES.about, label: "About" },
] as const;

export const ABOUT_NAVIGATION = [
  { href: PUBLIC_ROUTES.about, label: "About the Series" },
  { href: PUBLIC_ROUTES.editorialBoard, label: "Editorial Board" },
  { href: PUBLIC_ROUTES.history, label: "History and Acknowledgments" },
  { href: PUBLIC_ROUTES.policies, label: "Policies" },
  { href: PUBLIC_ROUTES.contact, label: "Contact" },
] as const;

export const RESEARCH_FIELDS = [
  "Applied Microeconomics",
  "Macroeconomics",
  "Public Economics",
  "Labor Economics and Demography",
  "Health Economics",
  "Economics of Education",
  "International Economics",
  "Financial Economics",
  "Industrial Organization",
  "Environmental and Resource Economics",
  "Economic History and Institutions",
  "Econometrics and Quantitative Methods",
  "Development Economics",
  "Behavioral and Experimental Economics",
  "Urban, Regional, and Real Estate Economics",
  "Political Economy",
  "Economic Theory",
] as const;

export type ResearchField = (typeof RESEARCH_FIELDS)[number];

export const RESEARCH_FIELD_ALIASES: Readonly<Record<string, ResearchField>> = {
  Finance: "Financial Economics",
  Education: "Economics of Education",
  International: "International Economics",
  "Environmental and Resource": "Environmental and Resource Economics",
  "Industrial Organization (IO) & Strategy": "Industrial Organization",
  "Public Economics & Policy": "Public Economics",
  "Labor and Demography": "Labor Economics and Demography",
  Health: "Health Economics",
  "Methods and Econometrics": "Econometrics and Quantitative Methods",
  "Behavioral & Experimental Economics": "Behavioral and Experimental Economics",
  "Urban, Regional, & Real Estate Economics": "Urban, Regional, and Real Estate Economics",
  "Economic Theory / Game Theory": "Economic Theory",
} as const;

export const PUBLIC_CONTACT = {
  seriesEmail: SERIES.contactEmail,
  departmentName: INSTITUTION.department.name,
  departmentPhoneDisplay: INSTITUTION.department.phoneDisplay,
  departmentPhoneHref: INSTITUTION.department.phoneHref,
} as const;
