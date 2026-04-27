import type { UserProfile } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Jobs
export const api = {
  user: {
    get: () => req<UserProfile>('/api/user'),
    update: (body: Partial<UserProfile>) =>
      req<UserProfile>('/api/user', { method: 'PATCH', body: JSON.stringify(body) }),
    parseResume: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetch(`${BASE}/api/user/parse-resume`, { method: 'POST', body: fd })
        .then(r => { if (!r.ok) throw new Error('Parse failed'); return r.json() as Promise<UserProfile>; });
    },
  },
  jobs: {
    list: (params?: { q?: string; status?: string; discover?: boolean; tracked?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.status && params.status !== 'all') qs.set('status', params.status);
      if (params?.discover) qs.set('discover', 'true');
      if (params?.tracked) qs.set('tracked', 'true');
      const query = qs.toString();
      return req<JobAPI[]>(`/api/jobs${query ? `?${query}` : ''}`);
    },
    get: (id: string) => req<JobDetailAPI>(`/api/jobs/${id}`),
    create: (body: Partial<JobDetailAPI>) =>
      req<JobAPI>('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<JobAPI>) =>
      req<JobAPI>(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/api/jobs/${id}`, { method: 'DELETE' }),
    fetchUrl: (url: string) =>
      req<{ url: string; title: string; text: string; ok: boolean }>('/api/jobs/fetch-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
  },
  resumes: {
    list: () => req<ResumeAPI[]>('/api/resumes'),
    get: (id: string) => req<ResumeDetailAPI>(`/api/resumes/${id}`),
    create: (body: { name: string; template?: string; resume_data?: object }) =>
      req<ResumeAPI>('/api/resumes', { method: 'POST', body: JSON.stringify(body) }),
    upload: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetch(`${BASE}/api/resumes/upload`, { method: 'POST', body: fd }).then(r => r.json() as Promise<ResumeAPI>);
    },
    update: (id: string, body: Partial<ResumeAPI>) =>
      req<ResumeAPI>(`/api/resumes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/api/resumes/${id}`, { method: 'DELETE' }),
  },
  webhooks: {
    list: () => req<WebhookAPI[]>('/api/webhooks'),
    get: (id: string) => req<WebhookAPI>(`/api/webhooks/${id}`),
    create: (body: Partial<WebhookAPI>) =>
      req<WebhookAPI>('/api/webhooks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<WebhookAPI>) =>
      req<WebhookAPI>(`/api/webhooks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/api/webhooks/${id}`, { method: 'DELETE' }),
    test: (id: string) => req<WebhookAPI>(`/api/webhooks/test/${id}`, { method: 'POST' }),
  },
  tailor: {
    analyze: (body: { job_description: string; resume_data?: object; user_profile?: object; resume_content?: string }) =>
      req<TailorAnalysis>('/api/tailor/analyze', { method: 'POST', body: JSON.stringify(body) }),
    tailorSync: (body: { job_description: string; resume_data?: object; clarifications?: object; user_profile?: object; resume_content?: string }) =>
      req<object>('/api/tailor/sync', { method: 'POST', body: JSON.stringify(body) }),
  },
  apply: {
    start: (body: { url: string; user_profile: object; resume_data: object; resume_html?: string; resume_pdf_name?: string }) =>
      fetch(`${BASE}/api/apply/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    confirm: (sessionId: string) =>
      fetch(`${BASE}/api/apply/confirm/${sessionId}`, { method: 'POST' }),
    exportPDF: (body: { html: string; filename: string }) =>
      fetch(`${BASE}/api/apply/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.blob()),
    personalizeLetter: (body: { template: string; company: string; role: string; candidate_name: string; candidate_profile: object }) =>
      req<{ letter: string }>('/api/apply/personalize-letter', { method: 'POST', body: JSON.stringify(body) }),
  },
};

// Raw API shapes (snake_case from backend)
export interface JobAPI {
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
  status: string;
  logo: string;
  color: string;
  ats_score: number;
  url: string;
  notes: string;
}

export interface JobDetailAPI extends JobAPI {
  description: string;
}

export interface ResumeAPI {
  id: string;
  name: string;
  template: string;
  updated: string;
  size: string;
  pages: number;
  default: boolean;
  tags: string[];
  resume_data: object;
}

export interface ResumeDetailAPI extends ResumeAPI {
  content: string;
}

export interface WebhookAPI {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  last_fired: string;
  status: string;
}

export interface TailorAnalysis {
  title: string;
  company: string;
  requirements: string[];
  nice_to_have: string[];
  keywords: string[];
  ats_gaps: string[];
}
