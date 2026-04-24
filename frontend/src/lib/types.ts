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

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: ExperienceItem[];
  skills: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  loc: string;
  when: string;
  bullets: string[];
}
