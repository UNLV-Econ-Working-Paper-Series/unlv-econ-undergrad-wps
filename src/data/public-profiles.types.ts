export type PublicProfileSection = "editorial_team" | "graduate_assistants";

export interface PublicProfile {
  id: string;
  name: string;
  displayRole: string;
  summary: string;
  sections: PublicProfileSection[];
  headshot?: string;
  profileHref?: string;
  current?: boolean;
  sortOrder?: number;
}
