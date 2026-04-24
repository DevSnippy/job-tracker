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
  return res.json();
}

// Jobs
export const api = {
  jobs: {
    list: (params?: { q?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.status && params.status !== 'all') qs.set('status', params.status);
      const query = qs.toString();
      return req<JobAPI[]>(`/api/jobs${query ? `?${query}` : ''}`);
    },
    get: (id: string) => req<JobAPI>(`/api/jobs/${id}`),
    create: (body: Partial<JobAPI>) =>
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
    get: (id: string) => req<ResumeAPI>(`/api/resumes/${id}`),
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
    analyze: (body: { job_description: string; resume_data: object }) =>
      req<TailorAnalysis>('/api/tailor/analyze', { method: 'POST', body: JSON.stringify(body) }),
    tailorSync: (body: { job_description: string; resume_data: object; clarifications?: object }) =>
      req<object>('/api/tailor/sync', { method: 'POST', body: JSON.stringify(body) }),
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
  description: string;
  notes: string;
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
