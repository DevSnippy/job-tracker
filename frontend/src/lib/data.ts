import type { Job, Resume, Template, Webhook, ResumeData } from './types';

export const JOBS: Job[] = [
  { id: "TM-8421", company: "Wiz", role: "Senior Frontend Engineer", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "2d", source: "techmap", stack: ["React","TS","Node"], stage: 2, status: "applied", logo: "W", color: "#5B5FEF" },
  { id: "TM-8420", company: "Monday.com", role: "Staff Product Designer", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "3d", source: "techmap", stack: ["Figma","DesignSys"], stage: 1, status: "interested", logo: "M", color: "#FF3D57" },
  { id: "TM-8419", company: "Lightricks", role: "ML Engineer, GenAI", loc: "Jerusalem", type: "Full-time", remote: "On-site", posted: "4d", source: "techmap", stack: ["Python","PyTorch"], stage: 0, status: "saved", logo: "L", color: "#111111" },
  { id: "TM-8418", company: "Fiverr", role: "Backend Engineer, Payments", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "5d", source: "techmap", stack: ["Go","PostgreSQL"], stage: 3, status: "interview", logo: "F", color: "#1DBF73" },
  { id: "TM-8417", company: "Riskified", role: "Data Scientist", loc: "Tel Aviv", type: "Full-time", remote: "Remote", posted: "5d", source: "techmap", stack: ["Python","SQL","ML"], stage: 0, status: "saved", logo: "R", color: "#0A2540" },
  { id: "TM-8416", company: "Taboola", role: "Senior DevOps Engineer", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "6d", source: "techmap", stack: ["K8s","AWS","Terraform"], stage: 0, status: "saved", logo: "T", color: "#0066FF" },
  { id: "TM-8415", company: "Gong", role: "Product Manager, Growth", loc: "Ramat Gan", type: "Full-time", remote: "Hybrid", posted: "6d", source: "techmap", stack: ["SaaS","B2B"], stage: 2, status: "applied", logo: "G", color: "#8039DF" },
  { id: "TM-8414", company: "Checkmarx", role: "Security Research Lead", loc: "Tel Aviv", type: "Full-time", remote: "On-site", posted: "1w", source: "techmap", stack: ["Security","C++"], stage: 0, status: "saved", logo: "C", color: "#35BB9B" },
  { id: "TM-8413", company: "Papaya Global", role: "Full-stack Engineer", loc: "Herzliya", type: "Full-time", remote: "Hybrid", posted: "1w", source: "techmap", stack: ["React","Node","AWS"], stage: 4, status: "offer", logo: "P", color: "#FF6B35" },
  { id: "TM-8412", company: "JoyTunes", role: "iOS Engineer", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "1w", source: "techmap", stack: ["Swift","iOS"], stage: 0, status: "saved", logo: "J", color: "#FFB800" },
  { id: "TM-8411", company: "Cellebrite", role: "Engineering Manager", loc: "Petah Tikva", type: "Full-time", remote: "On-site", posted: "1w", source: "techmap", stack: ["Management"], stage: 0, status: "saved", logo: "C", color: "#003366" },
  { id: "TM-8410", company: "Pagaya", role: "Principal SRE", loc: "Tel Aviv", type: "Full-time", remote: "Remote", posted: "1w", source: "techmap", stack: ["K8s","GCP"], stage: 1, status: "interested", logo: "P", color: "#1A1A1A" },
  { id: "TM-8409", company: "Wix", role: "Frontend Tech Lead", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "2w", source: "techmap", stack: ["React","Vue"], stage: 0, status: "saved", logo: "W", color: "#0C6EFC" },
  { id: "TM-8408", company: "Rapyd", role: "Senior Backend Engineer", loc: "Tel Aviv", type: "Full-time", remote: "Hybrid", posted: "2w", source: "techmap", stack: ["Java","Kafka"], stage: 2, status: "applied", logo: "R", color: "#4318FF" },
  { id: "TM-8407", company: "Deel", role: "Staff Engineer", loc: "Remote IL", type: "Full-time", remote: "Remote", posted: "2w", source: "techmap", stack: ["Node","React"], stage: 0, status: "saved", logo: "D", color: "#0F4C3A" },
];

export const STATUS_CONFIG = {
  saved:     { label: "Saved",      chip: "chip",         color: "var(--text-2)" },
  interested:{ label: "Interested", chip: "chip-info",    color: "var(--info)" },
  applied:   { label: "Applied",    chip: "chip-accent",  color: "var(--accent)" },
  interview: { label: "Interview",  chip: "chip-warn",    color: "var(--warn)" },
  offer:     { label: "Offer",      chip: "chip-success", color: "var(--success)" },
  rejected:  { label: "Rejected",   chip: "chip-danger",  color: "var(--danger)" },
} as const;

export const STAGES = ["Saved", "Interested", "Applied", "Interview", "Offer"];

export const RESUMES: Resume[] = [
  { id: "r1", name: "Senior Frontend — General.pdf", template: "Vanguard", updated: "2d ago", size: "312 KB", pages: 2, default: true, tags: ["Frontend","React"] },
  { id: "r2", name: "Fullstack — Startup focus.pdf", template: "Ledger", updated: "1w ago", size: "298 KB", pages: 2, default: false, tags: ["Fullstack","Node"] },
  { id: "r3", name: "Staff Eng — Leadership.pdf", template: "Serif Classic", updated: "2w ago", size: "341 KB", pages: 2, default: false, tags: ["Staff","Management"] },
  { id: "r4", name: "Design Engineer — Hybrid.pdf", template: "Modern Grid", updated: "3w ago", size: "289 KB", pages: 1, default: false, tags: ["Design","Frontend"] },
];

export const TEMPLATES: Template[] = [
  { id: "t1", name: "Vanguard", style: "modern · sans", accent: "#4F46E5" },
  { id: "t2", name: "Ledger", style: "classic · serif", accent: "#111111" },
  { id: "t3", name: "Serif Classic", style: "editorial · serif", accent: "#2B2B2B" },
  { id: "t4", name: "Modern Grid", style: "two-col · sans", accent: "#0EA5E9" },
  { id: "t5", name: "Monospace", style: "technical · mono", accent: "#059669" },
  { id: "t6", name: "Minimal", style: "whitespace · sans", accent: "#DC2626" },
];

export const WEBHOOKS: Webhook[] = [
  { id: "wh1", name: "Notion — Applications DB", url: "https://n8n.example.com/webhook/a2f9e1", events: ["job.applied","job.interview"], active: true, lastFired: "12m ago", status: "ok" },
  { id: "wh2", name: "Slack — #job-hunt", url: "https://n8n.example.com/webhook/b71d03", events: ["job.applied","job.offer"], active: true, lastFired: "2h ago", status: "ok" },
  { id: "wh3", name: "Google Sheets Logger", url: "https://n8n.example.com/webhook/c0e442", events: ["job.applied"], active: false, lastFired: "3d ago", status: "paused" },
  { id: "wh4", name: "Email digest (Gmail)", url: "https://n8n.example.com/webhook/d913ab", events: ["job.offer","job.rejected"], active: true, lastFired: "never", status: "untested" },
];

export const WEBHOOK_EVENTS = [
  "job.saved","job.interested","job.applied","job.interview","job.offer","job.rejected","resume.updated"
];

export const DEFAULT_RESUME_DATA: ResumeData = {
  name: "Yonatan Levi",
  title: "Senior Frontend Engineer",
  email: "yonatan@pm.me",
  phone: "+972 54-123-4567",
  location: "Tel Aviv, IL",
  summary: "Senior engineer with 7+ years building data-dense B2B consoles. Owned design systems, shipped perf-critical tables, and mentored mid-level ICs. Looking for staff-track frontend work at a product-focused company.",
  experience: [
    { role: "Senior Frontend Engineer", company: "Observely", loc: "Tel Aviv", when: "2022 — Present", bullets: ["Led migration to a tokenized design system across 40+ surfaces.", "Rebuilt the large-dataset table layer — p95 interaction 420ms → 90ms.", "Mentored three mid-level engineers; set code-review culture."] },
    { role: "Frontend Engineer", company: "Riskified", loc: "Tel Aviv", when: "2019 — 2022", bullets: ["Shipped the rules editor and policy explorer used by all tier-1 merchants.", "Drove accessibility audit to WCAG AA compliance across the admin."] },
    { role: "Software Engineer", company: "Cellebrite", loc: "Petah Tikva", when: "2017 — 2019", bullets: ["Built the forensic case-review UI in React + Redux.", "Contributed to the internal component library."] },
  ],
  education: [
    { degree: "B.Sc. Computer Science", school: "Tel Aviv University", loc: "Tel Aviv", when: "2013 — 2017" },
  ],
  skills: ["React","TypeScript","Node.js","GraphQL","Design Systems","Perf","Accessibility","Figma"],
  links: [],
};

export const ELEMENTOR_JOB: Job = {
  id: "EL-2041", company: "Elementor", role: "Full Stack Developer",
  loc: "Ramat Gan", remote: "Hybrid", type: "Full-time", color: "#93003F",
  stack: ["PHP","React","MySQL","Node"], status: "saved", stage: 0,
  source: "techmap", logo: "E", posted: "1w",
  url: "https://elementor.com/careers/position/full-stack-developer",
};
