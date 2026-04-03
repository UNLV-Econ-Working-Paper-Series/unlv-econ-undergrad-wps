export type PublicProfileSection = "editorial_team" | "graduate_assistants";

export type PublicProfileLinkType = "website" | "linkedin" | "scholar" | "researchgate";

export interface PublicProfileLink {
  type: PublicProfileLinkType;
  href: string;
  label?: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  displayRole: string;
  summary: string;
  profileBio?: string[];
  sections: PublicProfileSection[];
  headshot?: string;
  photoSource?: string;
  profileHref?: string;
  links?: PublicProfileLink[];
  current?: boolean;
  sortOrder?: number;
}
