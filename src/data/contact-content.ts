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
      title: "Series Team",
      desc: "Questions about papers, corrections, permissions, takedown requests, and site issues",
      email: SERIES.contactEmail,
      hint: "",
      actions: [
        { label: "Email Series Team", href: `mailto:${SERIES.contactEmail}`, primary: true },
        { label: "Common Requests", href: "#requests" },
      ],
    },
    dept: {
      title: INSTITUTION.department.name,
      desc: "Department office contact information and general departmental inquiries",
      phone: `+1-${INSTITUTION.department.phoneDisplay}`,
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
        { label: "Get Directions", href: "https://maps.google.com/?q=Frank+and+Estella+Beam+Hall+UNLV", external: true },
      ],
    },
  },
  requests: {
    title: "Common Requests",
    items: [
      { label: "Broken link", subject: "Report a broken link" },
      { label: "Author update", subject: "Author update request" },
      { label: "Correction / updated PDF", subject: "Correction or updated PDF" },
      { label: "Permissions / reuse", subject: "Permissions or reuse" },
      { label: "Takedown", subject: "Takedown request" },
    ],
    note:
      "For paper-specific issues, include the paper title and paper URL. For reuse requests, include what content you want to reuse and where it will be used.",
  },
  directions: {
    title: "Directions",
    linkLabel: "Open in Google Maps →",
  },
};
