'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import StatusChip from '@/components/ui/StatusChip';
import CompanyLogo from '@/components/ui/CompanyLogo';
import ApplyModal from '@/components/jobs/ApplyModal';
import TailorFlow from '@/components/tailor/TailorFlow';
import { api } from '@/lib/api';
import type { Job } from '@/lib/types';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    api.jobs.get(jobId).then(data => setJob(data as Job)).catch(() => {});
  }, [jobId]);

  const [tab, setTab] = useState('overview');
  const [applyOpen, setApplyOpen] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);

  if (!job) return <AppShell><div className="page" style={{ display: 'grid', placeItems: 'center', flex: 1 }}><span className="muted">Loading…</span></div></AppShell>;

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Workspace', 'Jobs', job.company]} actions={
          <>
            <button className="btn ghost" onClick={() => router.push('/jobs')}><Icon name="arrowLeft" size={12} /> Back</button>
            <button className="btn"><Icon name="star" size={12} /> Save</button>
            <button className="btn"><Icon name="external" size={12} /> Source</button>
            <button className="btn primary" onClick={() => setApplyOpen(true)}><Icon name="zap" size={12} /> Apply</button>
          </>
        } />

        <div className="page-body">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div className="row" style={{ gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 22 }}>{job.company[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>{job.role}</div>
                <div className="row" style={{ gap: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>{job.company}</span>
                  <span className="muted">·</span>
                  <span className="muted row" style={{ gap: 4 }}><Icon name="map" size={12} /> {job.loc}</span>
                  <span className="muted">·</span>
                  <span className="muted">{job.remote}</span>
                  <span className="muted">·</span>
                  <span className="muted">{job.type}</span>
                  <span className="muted">·</span>
                  <span className="muted row" style={{ gap: 4 }}><Icon name="clock" size={12} /> Posted {job.posted} ago</span>
                </div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
                <StatusChip status={job.status} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 14, gap: 6, flexWrap: 'wrap' }}>
              <span className="chip mono-strong">{job.id}</span>
              <span className="chip">techmap</span>
              {job.stack.map(t => <span key={t} className="chip chip-accent">{t}</span>)}
            </div>
          </div>

          <div className="tabs">
            {['overview','description','company','activity','notes'].map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, padding: 22 }}>
            <div className="col" style={{ gap: 22 }}>
              <section>
                <h4 className="section-title">About the role</h4>
                <p>Senior role owning frontend architecture for our cloud-security console. Partner closely with design and backend to ship new surface area, contribute to the internal design system, and drive perf work on data-dense tables and graph visualizations.</p>
                <p>You&apos;ll be one of five senior frontend engineers on a team that ships weekly, reviews each other&apos;s PRs, and cares a lot about craft.</p>
              </section>
              <section>
                <h4 className="section-title">What you&apos;ll do</h4>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>Architect and ship major product surfaces in React + TypeScript</li>
                  <li>Extend the internal design system — tokens, primitives, patterns</li>
                  <li>Own perf budgets; profile and optimize large table + graph views</li>
                  <li>Mentor 1–2 mid-level engineers; set code-review tone</li>
                  <li>Partner with product design on flows before they hit Figma</li>
                </ul>
              </section>
              <section>
                <h4 className="section-title">Requirements</h4>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>6+ years production React / TypeScript</li>
                  <li>Shipped a design-system or component library at scale</li>
                  <li>Comfortable with data-dense B2B UX patterns</li>
                  <li>Experience with observability / security tooling is a plus</li>
                </ul>
              </section>
              <section>
                <h4 className="section-title">Activity</h4>
                <div className="panel">
                  {[
                    { t: 'You saved this job', who: 'You', when: '5 days ago', icon: 'star' },
                    { t: 'Webhook fired → Notion DB', who: 'n8n · Applications', when: '5 days ago', icon: 'plug' },
                    { t: 'Resume attached: Senior Frontend — General.pdf', who: 'You', when: '4 days ago', icon: 'doc' },
                    { t: 'Applied via company website', who: 'You', when: '4 days ago', icon: 'check' },
                    { t: 'Recruiter reached out', who: 'gmail inbox', when: '2 days ago', icon: 'mail' },
                  ].map((e, i) => (
                    <div key={i} className="row" style={{ gap: 10, padding: '10px 14px', borderTop: i ? '1px solid var(--border)' : 0 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--text-2)' }}><Icon name={e.icon} size={12} /></span>
                      <span style={{ flex: 1 }}>{e.t}</span>
                      <span className="muted mono-strong">{e.who}</span>
                      <span className="muted mono-strong">{e.when}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="col" style={{ gap: 14 }}>
              <div className="panel" style={{ padding: 14 }}>
                <h4 className="section-title">Match score</h4>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>87<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> / 100</span></div>
                <div className="muted" style={{ fontSize: 11.5 }}>Based on your default resume</div>
                <div className="stack-sm" style={{ marginTop: 12 }}>
                  {[{ k: 'React experience', v: 95 },{ k: 'TypeScript', v: 92 },{ k: 'Design systems', v: 80 },{ k: 'Security domain', v: 45 }].map(r => (
                    <div key={r.k}>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
                        <span>{r.k}</span><span className="mono-strong">{r.v}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, marginTop: 3 }}>
                        <div style={{ width: `${r.v}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setTailorOpen(true)}><Icon name="sparkle" size={12} /> Tailor resume</button>
              </div>

              <div className="panel" style={{ padding: 14 }}>
                <h4 className="section-title">Company</h4>
                <div className="row" style={{ gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{job.company[0]}</div>
                  <div><div style={{ fontWeight: 600 }}>{job.company}</div><div className="muted" style={{ fontSize: 11.5 }}>Cloud Security · 900–1500</div></div>
                </div>
                <div className="stack-sm" style={{ marginTop: 10, fontSize: 12 }}>
                  <div className="row"><Icon name="globe" size={12} /><span className="muted">{job.company.toLowerCase()}.io</span></div>
                  <div className="row"><Icon name="building" size={12} /><span className="muted">HQ in Tel Aviv, NY</span></div>
                  <div className="row"><Icon name="trend" size={12} /><span className="muted">Series E · $1.9B raised</span></div>
                </div>
              </div>

              <div className="panel" style={{ padding: 14 }}>
                <h4 className="section-title">Similar roles</h4>
                <div className="stack-sm">
                  <div className="muted" style={{ fontSize: 12, padding: '6px 0' }}>Browse jobs to see similar roles.</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      {applyOpen && <ApplyModal job={job} onClose={() => setApplyOpen(false)} />}
      {tailorOpen && <TailorFlow jobId={job.id} onClose={() => setTailorOpen(false)} onNavigateResume={() => { setTailorOpen(false); router.push('/editor'); }} />}
    </AppShell>
  );
}
