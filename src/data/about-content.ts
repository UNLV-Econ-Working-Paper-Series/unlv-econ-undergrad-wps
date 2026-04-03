import type { AboutPageContent } from "./about-content.types";

const bibtexTemplate = `@misc{unlv_econ_wp_author_year,
  title        = {Title of Paper},
  author       = {Last, First and Last, First},
  year         = {2026},
  howpublished = {UNLV Undergraduate Economics Working Paper Series, Issue: Spring 2026},
  url          = {https://markjayson13.github.io/<site-path>/papers/<paper-slug>/},
  note         = {Working paper (Department of Economics research).}
}`;

// Backend sync target:
// keep the object shape stable so backend can overwrite text without changing page markup.
export const ABOUT_PAGE_CONTENT: AboutPageContent = {
  banner: {
    title: "About",
    lead: "An open-access archive of working papers from the UNLV Department of Economics",
    note: "Working papers (not peer reviewed), published by semester issue",
  },
  tocItems: [
    { id: "about-glance-title", label: "At a Glance" },
    { id: "about-series-scope", label: "Series Scope" },
    { id: "about-process-title", label: "How Publication Works" },
    { id: "about-policies-title", label: "Policies" },
    { id: "about-team-title", label: "Editorial Team" },
    { id: "about-ga-title", label: "Graduate Assistants" },
    { id: "about-cta-title", label: "Get Involved" },
  ],
  atAGlance: {
    title: "At a Glance",
    items: [
      [
        { text: "Open-access archive", tone: "strong" },
        { text: " of working papers from the UNLV Department of Economics." },
      ],
      [
        { text: "Published ", tone: "strong" },
        { text: "once per semester", tone: "strong" },
        { text: " as a single issue." },
      ],
      [
        { text: "Each paper has its own ", tone: "strong" },
        { text: "paper page", tone: "strong" },
        { text: " with an abstract, metadata, and a downloadable PDF." },
      ],
      [
        { text: "Projects are developed with ", tone: "strong" },
        { text: "faculty mentorship", tone: "strong" },
        { text: " and may be revised over time." },
      ],
    ],
  },
  seriesScope: {
    title: "Series Scope",
    blocks: [
      {
        type: "paragraph",
        segments: [
          {
            text: "The UNLV Undergraduate Economics Working Paper Series is a public archive for papers connected to the UNLV Department of Economics. It gives students, graduate assistants, faculty, and collaborators one place to post ",
          },
          { text: "working papers", tone: "strong" },
          { text: ". The site is " },
          { text: "not a peer-reviewed journal", tone: "strong" },
          { text: ", and authors may revise papers over time." },
        ],
      },
    ],
  },
  publication: {
    title: "How Publication Works",
    steps: [
      {
        title: "Department research",
        description: "Authors in the UNLV Department of Economics develop original research projects with faculty mentorship.",
      },
      {
        title: "Semester issue",
        description: "Each semester can be published as one issue containing newly accepted papers.",
      },
      {
        title: "Paper pages",
        description: "Every paper has a page with abstract, key metadata, and a downloadable PDF.",
      },
      {
        title: "Updates",
        description: "When authors revise, the most current version is displayed and prior versions may be retained when feasible.",
      },
    ],
  },
  policies: {
    title: "Policies",
    sections: [
      {
        summary: "How to cite",
        open: true,
        blocks: [
          {
            type: "paragraph",
            segments: [
              { text: "Use the paper's page URL as the stable link. Suggested format:" },
            ],
          },
          {
            type: "paragraph",
            segments: [
              { text: "Author Last Name, First Name.", tone: "strong" },
              { text: " (Year). " },
              { text: "Title of Paper.", tone: "em" },
              { text: " UNLV Undergraduate Economics Working Paper Series, " },
              { text: "Issue: [Semester Year]", tone: "strong" },
              { text: ". URL" },
            ],
          },
          { type: "heading", text: "BibTeX template" },
          { type: "code", code: bibtexTemplate },
        ],
      },
      {
        summary: "Rights and reuse",
        blocks: [
          {
            type: "paragraph",
            segments: [
              { text: "Authors retain copyright", tone: "strong" },
              { text: " unless otherwise noted." },
            ],
          },
          {
            type: "paragraph",
            segments: [
              {
                text: "Posting a paper here makes it publicly available. For reuse beyond brief quotation, contact the author or the series team.",
              },
            ],
          },
          {
            type: "paragraph",
            segments: [
              { text: "The views in each paper are those of the author(s) and do not necessarily reflect UNLV or its faculty." },
            ],
          },
        ],
      },
      {
        summary: "Corrections and versioning",
        blocks: [
          {
            type: "paragraph",
            segments: [
              {
                text: "Papers may be updated over time as methods, interpretation, or presentation improve. The latest public version is displayed on each paper page.",
              },
            ],
          },
        ],
      },
      {
        summary: "Takedown and accessibility support",
        blocks: [
          {
            type: "paragraph",
            segments: [
              {
                text: "If a paper contains an error, requires an update, or needs removal for rights reasons, contact the series team with the paper title and URL.",
              },
            ],
          },
          {
            type: "paragraph",
            segments: [
              {
                text: "For accessibility support or format requests, use the Contact page and include the page link plus the requested accommodation.",
              },
            ],
          },
        ],
      },
    ],
  },
  editorialTeam: {
    title: "Editorial Board",
  },
  graduateAssistants: {
    title: "Graduate Assistants",
    linkLabel: "View all Graduate Assistants →",
    linkHref: "/graduate-assistants/",
    emptyText: "No current graduate assistants are listed",
  },
  cta: {
    title: "Get Involved",
    body: "Contact the series team with questions about posting a paper, fixing a record, or helping with the site.",
    actions: [
      { label: "Contact", href: "/contact/", primary: true },
      { label: "Explore Research Pathway", href: "/our/" },
    ],
  },
};
