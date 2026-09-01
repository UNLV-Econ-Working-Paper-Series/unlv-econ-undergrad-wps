export type NewsEvent = {
  date: string;
  title: string;
  summary: string;
  href: string;
  linkLabel: string;
};

export const NEWS_EVENTS: NewsEvent[] = [
  {
    date: "May 21, 2026",
    title: "Determinants of March Madness Tournament Advancement",
    summary:
      "Jace Waldahl examines how tournament seed and team efficiency ratings relate to advancement in the NCAA men's basketball tournament.",
    href: "/papers/march-madness-tournament-advancement/",
    linkLabel: "View paper record",
  },
  {
    date: "May 21, 2026",
    title: "Las Vegas Casino Revenue in an Expanding Gambling Market",
    summary:
      "Kaden A. Villa-Real studies whether expanding gambling alternatives are associated with Las Vegas casino revenue.",
    href: "/papers/las-vegas-casino-revenue/",
    linkLabel: "View paper record",
  },
];
