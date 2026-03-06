import type { ContactPageContent } from "./contact-content.types";

// Backend sync target:
// keep the object shape stable so backend can revise page text without changing layout code.
export const CONTACT_PAGE_CONTENT: ContactPageContent = {
  banner: {
    title: "Contact",
    lead: "Reach the series team or the Department of Economics office.",
  },
  routingTitle: "Who are you trying to reach?",
  contact: {
    series: {
      title: "Series Team",
      desc: "Questions about papers, corrections, permissions, takedown requests, and site issues.",
      email: "series-team@unlv.edu",
      hint: "Use this for corrections, permissions, takedown requests, author updates, and site issues.",
      actions: [
        { label: "Email Series Team", href: "mailto:series-team@unlv.edu", primary: true },
        { label: "Common Requests", href: "#requests" },
      ],
    },
    dept: {
      title: "Department of Economics",
      desc: "Department office contact information and general departmental inquiries.",
      phone: "+1-702-895-3776",
      locationLine: "Frank and Estella Beam Hall (BEH), Room 508",
      addressLines: [
        "Department of Economics",
        "University of Nevada, Las Vegas",
        "Mail Stop: 6005",
        "4505 S. Maryland Pkwy.",
        "Las Vegas, NV 89154",
      ],
      directionsUrl: "https://maps.google.com/?q=Frank+and+Estella+Beam+Hall+UNLV",
      actions: [
        { label: "Call Office", href: "tel:+1-702-895-3776", primary: true },
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
