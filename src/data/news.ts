export type NewsEvent = {
  date: string;
  title: string;
  summary: string;
  href: string;
  linkLabel: string;
};

export const NEWS_EVENTS: NewsEvent[] = [
  {
    date: "August 2026",
    title: "The working paper series is live",
    summary:
      "The UNLV Undergraduate Economics Working Paper Series is now live, giving readers one place to browse papers, semester issues, subject areas, and permanent OASIS records.",
    href: "/papers/",
    linkLabel: "Explore the papers",
  },
  {
    date: "August 2026",
    title: "Four semester issues released",
    summary:
      "The first 15 papers are available across Spring 2024, Spring 2025, Fall 2025, and Spring 2026.",
    href: "/issues/",
    linkLabel: "Browse all issues",
  },
];
