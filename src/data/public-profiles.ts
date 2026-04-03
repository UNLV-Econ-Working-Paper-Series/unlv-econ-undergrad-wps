import type { PublicProfile } from "./public-profiles.types";

// Backend sync target:
// this file represents the public-facing subset of backend user/profile data.
export const PUBLIC_PROFILES: PublicProfile[] = [
  {
    id: "professor-djeto-assane",
    name: "Professor Djeto Assané, Ph.D.",
    displayRole: "Editorial Lead",
    summary:
      "Professor of economics in the Lee Business School. His teaching and research areas include econometrics, microeconomics, economic growth, trade, institutions, and energy economics.",
    sections: ["editorial_team"],
    headshot: "/assets/images/assane.jpg",
    sortOrder: 10,
  },
  {
    id: "professor-eric-chiang",
    name: "Professor Eric Chiang, Ph.D.",
    displayRole: "Co-Editor",
    summary:
      "Professor-in-Residence of economics in the Lee Business School. Before joining UNLV, he taught at Florida Atlantic University and was recognized there with the Distinguished Teacher of the Year award.",
    sections: ["editorial_team"],
    headshot: "/assets/images/eric-chiang.jpeg",
    sortOrder: 15,
  },
  {
    id: "mark-jayson-farol",
    name: "Mark Jayson Farol, M.A.",
    displayRole: "Series Organizer",
    summary:
      "Built the site and manages page setup, metadata, and issue posting for the series.",
    sections: ["editorial_team"],
    headshot: "/assets/images/mark-jayson.jpg",
    sortOrder: 20,
  },
  {
    id: "brandon-penticoff",
    name: "Brandon Penticoff",
    displayRole: "Spring 2026",
    summary: "Helps prepare papers for posting and checks issue materials before publication.",
    sections: ["graduate_assistants"],
    headshot: "/assets/images/brandon-penticoff.jpg",
    profileHref: "/graduate-assistants/brandon-penticoff/",
    current: true,
    sortOrder: 30,
  },
];
