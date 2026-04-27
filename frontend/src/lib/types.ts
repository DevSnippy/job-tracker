export interface Job {
  id: string;
  company: string;
  role: string;
  loc: string;
  type: string;
  remote: string;
  posted: string;
  source: string;
  stack: string[];
  stage: number;
  status: JobStatus;
  logo: string;
  color: string;
  url?: string;
  description?: string;
  notes?: string;
  ats_score?: number;
}

export type JobStatus = 'saved' | 'interested' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Resume {
  id: string;
  name: string;
  template: string;
  updated: string;
  size: string;
  pages: number;
  default: boolean;
  tags: string[];
}

export interface Template {
  id: string;
  name: string;
  style: string;
  accent: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastFired: string;
  status: string;
}

export interface EducationItem {
  degree: string;
  school: string;
  loc: string;
  when: string;
}

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  links: ResumeLink[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  headline: string;
  location: string;
  interested_titles: string[];
  preferred_levels: string[];
  preferred_tracks: string[];
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  linkedin_url: string;
  website_url: string;
  portfolio_url: string;
  cover_letter: string;
}

export interface ExperienceItem {
  role: string;
  company: string;
  loc: string;
  when: string;
  bullets: string[];
}
