import type { ContactPageContent } from "./contact-content.types";
import { INSTITUTION } from "../config/institution";
import { SERIES } from "../config/publication";

// Backend sync target:
// keep the object shape stable so backend can revise page text without changing layout code.
export const CONTACT_PAGE_CONTENT: ContactPageContent = {
  banner: {
    title: "Contact",
    lead: `Reach the Series team or the ${INSTITUTION.department.name} office`,
  },
  routingTitle: "Who are you trying to reach?",
  contact: {
    series: {
      title: "Series Editorial Office",
      desc: "Submissions, corrections, rights, accessibility, privacy, technical, and repository-record questions",
      email: SERIES.contactEmail,
      hint: "",
      actions: [
        { label: "Email the Series", href: `mailto:${SERIES.contactEmail}`, primary: true },
        { label: "Choose a request category", href: "#requests" },
      ],
    },
    dept: {
      title: INSTITUTION.department.name,
      desc: "Department office contact information and general departmental inquiries",
      phone: INSTITUTION.department.phoneDisplay,
      phoneHref: INSTITUTION.department.phoneHref,
      locationLine: INSTITUTION.department.office,
      addressLines: [
        INSTITUTION.department.name,
        INSTITUTION.university.name,
        `Mail Stop: ${INSTITUTION.department.mailStop}`,
        INSTITUTION.department.streetAddress,
        INSTITUTION.department.locality,
      ],
      directionsUrl: "https://maps.google.com/?q=Frank+and+Estella+Beam+Hall+UNLV",
      actions: [
        { label: "Call Office", href: INSTITUTION.department.phoneHref, primary: true },
        {
          label: "Get Directions",
          href: "https://maps.google.com/?q=Frank+and+Estella+Beam+Hall+UNLV",
          external: true,
        },
      ],
    },
  },
  requests: {
    title: "Common Requests",
    items: [
      { label: "Series submissions", subject: "Series submission inquiry" },
      { label: "Corrections and revised files", subject: "Correction or revised file" },
      { label: "Rights and permissions", subject: "Rights or permissions question" },
      { label: "Accessibility", subject: "Accessibility request or barrier report" },
      { label: "Takedown or privacy concerns", subject: "Takedown or privacy concern" },
      { label: "Technical problems", subject: "Technical problem" },
      { label: "Department office", href: `${INSTITUTION.department.url}/contact` },
      { label: "OAsis record or DOI questions", subject: "OAsis record or DOI question" },
    ],
    note: "Choose the closest category to prepare an email to the Series or reach the department office. For a paper-specific issue, include the paper title and URL. Do not send confidential, restricted, or personally identifiable research data by email.",
  },
  retention: {
    title: "Communications and public records",
    body: "Communications to the Series are retained and managed according to applicable UNLV and Nevada System of Higher Education records-retention requirements. Messages related to university operations may constitute public records under Nevada law.",
  },
  directions: {
    title: "Directions",
    linkLabel: "Open in Google Maps →",
  },
};
