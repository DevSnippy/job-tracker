'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import StatusChip from '@/components/ui/StatusChip';
import StageBar from '@/components/ui/StageBar';
import CompanyLogo from '@/components/ui/CompanyLogo';
import MatchBar from '@/components/jobs/MatchBar';
import PasteUrlModal from '@/components/jobs/PasteUrlModal';
import TailorFlow from '@/components/tailor/TailorFlow';
import { api } from '@/lib/api';
import type { Job, JobStatus } from '@/lib/types';

type ViewMode = 'table' | 'split' | 'grid';

const LEVEL_PATTERNS: [string, RegExp][] = [
  ['Student / Intern', /student|intern|trainee/i],
  ['Junior', /junior|jr\.?(?:\s|$)/i],
  ['Mid', /\bmid\b|\bmiddle\b/i],
  ['Senior', /senior|sr\.?(?:\s|$)/i],
  ['Lead', /\blead\b|\bstaff\b|\bprincipal\b/i],
  ['Manager+', /manager|director|vp\b|head of|c[xt]o\b/i],
];

function getLevel(role: string): string {
  for (const [label, re] of LEVEL_PATTERNS) {
    if (re.test(role)) return label;
  }
  return 'Mid';
}

interface Filters {
  city: string;
  remote: string;
  level: string;
  category: string;
}

const EMPTY_FILTERS: Filters = { city: '', remote: '', level: '', category: '' };

export default function JobsPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('grid');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set<string>());
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [tailorJobId, setTailorJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    api.jobs.list({ discover: true }).then(data => setJobs(data as Job[])).catch(() => {});
  }, []);

  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      if (j.loc) counts.set(j.loc, (counts.get(j.loc) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([c]) => c);
  }, [jobs]);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const j of jobs) for (const s of j.stack) seen.add(s);
    return Array.from(seen).sort();
  }, [jobs]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    let out = jobs;
    if (q) {
      const qq = q.toLowerCase();
      out = out.filter(j => j.company.toLowerCase().includes(qq) || j.role.toLowerCase().includes(qq) || j.loc.toLowerCase().includes(qq));
    }
    if (statusFilter !== 'all') out = out.filter(j => j.status === statusFilter);
    if (filters.city) out = out.filter(j => j.loc === filters.city);
    if (filters.remote) out = out.filter(j => j.remote === filters.remote);
    if (filters.level) out = out.filter(j => getLevel(j.role) === filters.level);
    if (filters.category) out = out.filter(j => j.stack.includes(filters.category));
    return out;
  }, [q, statusFilter, jobs, filters]);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const openTailor = (id: string) => setTailorJobId(id || filtered[0]?.id);

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Workspace', 'Jobs']} actions={
          <>
            <div className="row" style={{ gap: 2, border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
              {(['table', 'split', 'grid'] as ViewMode[]).map(v => (
                <button key={v} className="icon-btn" style={{ background: view === v ? 'var(--hover)' : 'transparent' }} onClick={() => setView(v)} title={v}>
                  <Icon name={v} />
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => setPasteOpen(true)}><Icon name="link" /> Paste URL</button>
            <button className="btn primary" onClick={() => openTailor(filtered[0]?.id)}><Icon name="sparkle" /> Tailor resume</button>
          </>
        } />

        <div className="filter-bar">
          <div className="search-wrap">
            <Icon name="search" size={13} />
            <input className="input filter-input" placeholder="Filter by company, role, location…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 4 }}>
            {(['all','saved','interested','applied','interview','offer'] as const).map(s => (
              <button key={s} className={`btn sm${statusFilter === s ? '' : ' ghost'}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span className="mono-strong muted">{filtered.length} jobs</span>
          <div className="vsep" />
          <div style={{ position: 'relative' }}>
            <button
              className={`btn sm${activeFilterCount > 0 ? '' : ' ghost'}`}
              onClick={() => setFiltersOpen(v => !v)}
            >
              <Icon name="filter" size={12} /> Filters
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filtersOpen && (
              <FilterPanel
                filters={filters}
                cities={cityOptions}
                categories={categoryOptions}
                onChange={setFilters}
                onClose={() => setFiltersOpen(false)}
              />
            )}
          </div>
          <button className="btn sm ghost"><Icon name="sortAsc" size={12} /> Sort</button>
          {selected.size > 0 && (
            <>
              <div className="vsep" />
              <span className="chip chip-accent">{selected.size} selected</span>
              <button className="btn sm">Tailor all…</button>
              <button className="btn sm ghost"><Icon name="trash" size={12} /></button>
            </>
          )}
        </div>

        {view === 'table' && <JobsTable jobs={filtered} selected={selected} toggle={toggle} onOpen={id => router.push(`/jobs/${id}`)} onTailor={openTailor} />}
        {view === 'split' && <JobsSplit jobs={filtered} onOpen={id => router.push(`/jobs/${id}`)} onTailor={openTailor} />}
        {view === 'grid' && <JobsGrid jobs={filtered} onOpen={id => router.push(`/jobs/${id}`)} onTailor={openTailor} />}

        {pasteOpen && <PasteUrlModal onClose={() => setPasteOpen(false)} onTailor={id => { setPasteOpen(false); openTailor(id); }} />}
        {tailorJobId && <TailorFlow jobId={tailorJobId} onClose={() => setTailorJobId(null)} onNavigateResume={() => { setTailorJobId(null); router.push('/editor'); }} />}
      </div>
    </AppShell>
  );
}

function JobsTable({ jobs, selected, toggle, onOpen, onTailor }: { jobs: Job[]; selected: Set<string>; toggle: (id: string) => void; onOpen: (id: string) => void; onTailor: (id: string) => void }) {
  return (
    <div className="table-scroll">
      <table className="data">
        <thead>
          <tr>
            <th style={{ width: 28 }}></th>
            <th>Company</th>
            <th>Role</th>
            <th>Location</th>
            <th>Remote</th>
            <th>Stack</th>
            <th>Match</th>
            <th>Status</th>
            <th>Stage</th>
            <th style={{ textAlign: 'right' }}>Posted</th>
            <th style={{ width: 120, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j, idx) => {
            const match = 60 + ((idx * 11) % 35);
            return (
              <tr key={j.id} className={selected.has(j.id) ? 'selected' : ''}>
                <td onClick={e => { e.stopPropagation(); toggle(j.id); }}>
                  <input type="checkbox" checked={selected.has(j.id)} onChange={() => {}} />
                </td>
                <td className="company-cell" onClick={() => onOpen(j.id)} style={{ cursor: 'pointer' }}>
                  <CompanyLogo company={j.company} color={j.color} />
                  {j.company}
                </td>
                <td onClick={() => onOpen(j.id)} style={{ color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>{j.role}</td>
                <td className="muted">{j.loc}</td>
                <td><span className="chip">{j.remote}</span></td>
                <td>
                  <span className="row" style={{ gap: 3 }}>
                    {j.stack.slice(0, 2).map(t => <span key={t} className="chip">{t}</span>)}
                    {j.stack.length > 2 && <span className="muted mono" style={{ fontSize: 11 }}>+{j.stack.length - 2}</span>}
                  </span>
                </td>
                <td><MatchBar value={match} /></td>
                <td><StatusChip status={j.status} /></td>
                <td><StageBar stage={j.stage} /></td>
                <td className="muted" style={{ textAlign: 'right' }}>{j.posted}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <button className="btn sm" onClick={e => { e.stopPropagation(); onTailor(j.id); }}>
                      <Icon name="sparkle" size={12} /> Tailor
                    </button>
                    <button className="icon-btn" onClick={e => e.stopPropagation()}><Icon name="dotsV" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function JobsSplit({ jobs, onOpen, onTailor }: { jobs: Job[]; onOpen: (id: string) => void; onTailor: (id: string) => void }) {
  const [activeId, setActiveId] = useState(jobs[0]?.id);
  const current = jobs.find(j => j.id === activeId) || jobs[0];
  return (
    <div className="split" style={{ flex: 1 }}>
      <div className="panel-col">
        <table className="data">
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} className={current?.id === j.id ? 'selected' : ''} onClick={() => setActiveId(j.id)} style={{ cursor: 'pointer' }}>
                <td className="company-cell" style={{ minWidth: 170 }}>
                  <CompanyLogo company={j.company} color={j.color} />
                  <div className="col" style={{ gap: 1 }}>
                    <span style={{ fontWeight: 500 }}>{j.company}</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>{j.role}</span>
                  </div>
                </td>
                <td><span className="chip">{j.remote}</span></td>
                <td><StatusChip status={j.status} /></td>
                <td className="muted" style={{ textAlign: 'right' }}>{j.posted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-col" style={{ padding: 18 }}>
        {current && <JobDetailInline job={current} onOpenFull={() => onOpen(current.id)} onTailor={() => onTailor(current.id)} />}
      </div>
    </div>
  );
}

function JobsGrid({ jobs, onOpen, onTailor }: { jobs: Job[]; onOpen: (id: string) => void; onTailor: (id: string) => void }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
        {jobs.map(j => (
          <div key={j.id} className="panel" style={{ padding: 14 }}>
            <div className="row" style={{ gap: 10 }}>
              <CompanyLogo company={j.company} color={j.color} size={28} />
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{j.company}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{j.loc} · {j.remote}</div>
              </div>
              <StatusChip status={j.status} />
            </div>
            <div style={{ marginTop: 10, fontWeight: 500, cursor: 'pointer' }} onClick={() => onOpen(j.id)}>{j.role}</div>
            <div className="row" style={{ marginTop: 10, gap: 4, flexWrap: 'wrap' }}>
              {j.stack.map(t => <span key={t} className="chip">{t}</span>)}
            </div>
            <div className="row" style={{ marginTop: 12, justifyContent: 'space-between', fontSize: 11 }}>
              <StageBar stage={j.stage} />
              <span className="muted">{j.posted}</span>
            </div>
            <div className="row" style={{ marginTop: 10, gap: 6 }}>
              <button className="btn sm" style={{ flex: 1 }} onClick={() => onOpen(j.id)}>Open</button>
              <button className="btn sm primary" style={{ flex: 1 }} onClick={() => onTailor(j.id)}><Icon name="sparkle" size={12} /> Tailor</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPanel({ filters, cities, categories, onChange, onClose }: {
  filters: Filters;
  cities: string[];
  categories: string[];
  onChange: (f: Filters) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: filters[key] === val ? '' : val });

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 16, width: 280,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filters</span>
        <button className="btn sm ghost" onClick={() => onChange(EMPTY_FILTERS)}>Clear all</button>
      </div>

      <div className="col" style={{ gap: 14 }}>
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Remote</div>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
            {['Remote', 'Hybrid', 'On-site'].map(v => (
              <button
                key={v}
                className={`btn sm${filters.remote === v ? '' : ' ghost'}`}
                onClick={() => set('remote', v)}
              >{v}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Experience level</div>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
            {LEVEL_PATTERNS.map(([label]) => (
              <button
                key={label}
                className={`btn sm${filters.level === label ? '' : ' ghost'}`}
                onClick={() => set('level', label)}
              >{label}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Category</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {categories.map(c => (
              <button
                key={c}
                className={`btn sm${filters.category === c ? '' : ' ghost'}`}
                onClick={() => set('category', c)}
              >{c}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>City</div>
          <select
            className="input"
            style={{ width: '100%', fontSize: 12 }}
            value={filters.city}
            onChange={e => onChange({ ...filters, city: e.target.value })}
          >
            <option value="">All cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function JobDetailInline({ job, onOpenFull, onTailor }: { job: Job; onOpenFull: () => void; onTailor: () => void }) {
  return (
    <div>
      <div className="row" style={{ gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{job.company[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{job.role}</div>
          <div className="muted">{job.company} · {job.loc} · {job.remote}</div>
        </div>
        <button className="btn ghost sm" onClick={onOpenFull}><Icon name="external" size={12} /> Open</button>
      </div>
      <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: 'wrap' }}>
        <span className="chip mono-strong">{job.id}</span>
        <span className="chip">{job.type}</span>
        {job.stack.map(t => <span key={t} className="chip chip-accent">{t}</span>)}
      </div>
      <h4 className="section-title" style={{ marginTop: 18 }}>Description</h4>
      {job.description
        ? <p className="muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{job.description}</p>
        : <p className="muted">Open this job to load the description.</p>
      }
      <div className="row" style={{ marginTop: 18, gap: 8 }}>
        <button className="btn primary" onClick={onTailor}><Icon name="sparkle" size={12} /> Tailor resume</button>
        <button className="btn"><Icon name="star" size={12} /> Save</button>
        <button className="btn ghost" onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}><Icon name="external" size={12} /> Source</button>
      </div>
    </div>
  );
}
