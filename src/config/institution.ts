export const INSTITUTION = {
  university: {
    name: "University of Nevada, Las Vegas",
    shortName: "UNLV",
    url: "https://www.unlv.edu/",
  },
  school: {
    name: "Lee Business School",
    url: "https://www.unlv.edu/business",
  },
  department: {
    name: "Molasky Family Department of Economics and Real Estate",
    url: "https://www.unlv.edu/economics",
    office: "Frank and Estella Beam Hall (BEH), Room 508",
    mailStop: "6005",
    streetAddress: "4505 S. Maryland Pkwy.",
    locality: "Las Vegas, NV 89154",
    phoneDisplay: "702-895-3776",
    phoneHref: "tel:+17028953776",
  },
} as const;

export const INSTITUTIONAL_HIERARCHY = [
  INSTITUTION.university.name,
  INSTITUTION.school.name,
  INSTITUTION.department.name,
  "UNLV Undergraduate Economics Working Paper Series",
] as const;
