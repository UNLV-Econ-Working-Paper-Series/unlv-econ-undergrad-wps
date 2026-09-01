export interface ContactAction {
  label: string;
  href: string;
  primary?: boolean;
  external?: boolean;
}

export interface ContactRequest {
  label: string;
  subject?: string;
  href?: string;
}

export interface ContactSeriesCard {
  title: string;
  desc: string;
  email: string;
  hint: string;
  actions: ContactAction[];
}

export interface ContactDepartmentCard {
  title: string;
  desc: string;
  phone: string;
  phoneHref: string;
  locationLine: string;
  addressLines: string[];
  directionsUrl: string;
  actions: ContactAction[];
}

export interface ContactPageContent {
  banner: {
    title: string;
    lead: string;
  };
  routingTitle: string;
  contact: {
    series: ContactSeriesCard;
    dept: ContactDepartmentCard;
  };
  requests: {
    title: string;
    items: ContactRequest[];
    note: string;
  };
  retention: {
    title: string;
    body: string;
  };
  directions: {
    title: string;
    linkLabel: string;
  };
}
