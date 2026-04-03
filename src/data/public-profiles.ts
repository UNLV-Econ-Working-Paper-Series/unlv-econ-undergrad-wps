import type { PublicProfile } from "./public-profiles.types";

// Backend sync target:
// this file represents the public-facing subset of backend user/profile data.
export const PUBLIC_PROFILES: PublicProfile[] = [
  {
    id: "professor-djeto-assane",
    name: "Professor Djeto Assané, Ph.D.",
    displayRole: "Editorial Lead",
    summary:
      "Professor of economics in the Lee Business School with research interests in applied econometrics, growth, trade, institutions, and energy economics",
    profileBio: [
      "Professor Djeto Assané is a professor of economics in UNLV's Lee Business School. He earned his B.A. in economics from Universite d'Abidjan and later completed both his M.A. and Ph.D. in economics at the University of Colorado Boulder.",
      "He has taught at UNLV since 1994 and became professor in 2022. His research focuses on applied econometrics with micro data, economic growth, trade, institutions, and energy economics.",
      "At UNLV, he has taught undergraduate and graduate courses in statistics, microeconomics, mathematical economics, econometrics, and ECON 495, and he has supervised graduate theses in the department.",
    ],
    sections: ["editorial_team"],
    headshot: "/assets/images/assane.jpg",
    photoSource: "Photo source: UNLV profile",
    profileHref: "/editorial-board/djeto-assane/",
    links: [
      { type: "website", href: "https://assane.faculty.unlv.edu/" },
      { type: "scholar", href: "https://scholar.google.com/citations?user=VJYYWTIAAAAJ&hl=en" },
      { type: "researchgate", href: "https://www.researchgate.net/profile/Djeto-Assane" },
    ],
    sortOrder: 10,
  },
  {
    id: "professor-eric-chiang",
    name: "Professor Eric Chiang, Ph.D.",
    displayRole: "Co-Editor",
    summary:
      "Professor-in-Residence of economics in the Lee Business School and former tenured associate professor at Florida Atlantic University",
    profileBio: [
      "Professor Eric Chiang is a Professor-in-Residence of economics in UNLV's Lee Business School. Before joining UNLV, he was a tenured associate professor and Director of Instructional Technology at Florida Atlantic University, where he taught students from introductory economics through Ph.D.-level courses.",
      "He received Florida Atlantic University's Distinguished Teacher of the Year award in 2009 and earned his Ph.D. in economics from the University of Florida in 2002.",
      "His work includes dozens of journal articles, the textbook Economics: Principles for a Changing World, and public-facing economics outreach, including a 2023 guest-host appearance on Planet Money's All You Can Eat Economics.",
    ],
    sections: ["editorial_team"],
    headshot: "/assets/images/eric-chiang.jpeg",
    photoSource: "Photo source: UNLV profile",
    profileHref: "/editorial-board/eric-chiang/",
    links: [
      { type: "website", href: "https://www.unlv.edu/people/eric-chiang" },
      { type: "linkedin", href: "https://www.linkedin.com/in/ericpchiang" },
      { type: "scholar", href: "https://scholar.google.com/citations?user=TcCXpb0AAAAJ" },
      { type: "researchgate", href: "https://www.researchgate.net/profile/Eric-Chiang-5" },
    ],
    sortOrder: 15,
  },
  {
    id: "mark-jayson-farol",
    name: "Mark Jayson Farol, M.A.",
    displayRole: "Series Organizer",
    summary:
      "Economics researcher and platform builder who developed the series site and manages its publishing structure, metadata, and issue posting",
    profileBio: [
      "Mark Jayson Farol, M.A., earned his M.A. in Quantitative Business Economics and B.S. in Economics from the University of Nevada, Las Vegas.",
      "At UNLV, he served as a graduate assistant and research collaborator, supporting undergraduate empirical research in ECON 495 and contributing to data-intensive work in applied economics.",
      "He is the founding builder of the UNLV Undergraduate Economics Working Paper Series platform, where he established the site's publishing structure and continues to oversee page setup, metadata, and issue posting for the archive.",
    ],
    sections: ["editorial_team"],
    headshot: "/assets/images/mark-jayson.jpg",
    photoSource: "Photo source: LinkedIn profile",
    profileHref: "/editorial-board/mark-jayson-farol/",
    links: [
      { type: "website", href: "https://markjayson.com" },
      { type: "linkedin", href: "https://www.linkedin.com/in/markjaysonfarol/" },
      { type: "scholar", href: "https://scholar.google.com/citations?user=vdr24hsAAAAJ&hl=en" },
      { type: "researchgate", href: "https://www.researchgate.net/profile/Mark-Jayson-Farol" },
    ],
    sortOrder: 20,
  },
  {
    id: "brandon-penticoff",
    name: "Brandon Penticoff",
    displayRole: "Spring 2026",
    summary:
      "UNLV student in the accelerated B.A./M.A. program in Economics and Quantitative Business Economics and Spring 2026 Graduate Assistant for the series",
    sections: ["graduate_assistants"],
    headshot: "/assets/images/brandon-penticoff.jpg",
    photoSource: "Photo source: LinkedIn profile",
    profileHref: "/graduate-assistants/brandon-penticoff/",
    links: [{ type: "linkedin", href: "https://www.linkedin.com/in/brandon-penticoff-4002252b1/" }],
    current: true,
    sortOrder: 30,
  },
];
