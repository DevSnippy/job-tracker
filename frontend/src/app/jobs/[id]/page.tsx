'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [saving, setSaving] = useState(false);

  const isSaved = job ? (job.status !== 'saved' || job.stage > 0) : false;

  const handleSave = async () => {
    if (!job || saving) return;
    setSaving(true);
    try {
      const updated = await api.jobs.update(job.id, { status: 'interested' });
      setJob(prev => prev ? { ...prev, status: updated.status, stage: updated.stage } as Job : prev);
    } finally {
      setSaving(false);
    }
  };

  if (!job) return <AppShell><div className="page" style={{ display: 'grid', placeItems: 'center', flex: 1 }}><span className="muted">Loading…</span></div></AppShell>;

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Workspace', 'Jobs', job.company]} actions={
          <>
            <button className="btn ghost" onClick={() => router.push('/jobs')}><Icon name="arrowLeft" size={12} /> Back</button>
            <button className="btn" onClick={handleSave} disabled={saving || isSaved} style={isSaved ? { color: 'var(--accent)' } : {}}>
              <Icon name="star" size={12} /> {isSaved ? 'Saved' : saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn" onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}><Icon name="external" size={12} /> Source</button>
            <button className="btn primary" onClick={() => setApplyOpen(true)}><Icon name="zap" size={12} /> Apply</button>
          </>
        } />

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
            {['overview','activity','notes'].map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0, overflow: 'hidden' }}>
              <IframeViewer url={job.url ?? ''} company={job.company} />
              <aside className="col" style={{ gap: 14, padding: 14, overflowY: 'auto' }}>
                <div className="panel" style={{ padding: 14 }}>
                  <h4 className="section-title">Match score</h4>
                  <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>87<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> / 100</span></div>
                  <div className="muted" style={{ fontSize: 11.5 }}>Based on your default resume</div>
                  <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setTailorOpen(true)}><Icon name="sparkle" size={12} /> Tailor resume</button>
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <h4 className="section-title">Company</h4>
                  <div className="row" style={{ gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{job.company[0]}</div>
                    <div><div style={{ fontWeight: 600 }}>{job.company}</div></div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {tab === 'activity' && (
            <div style={{ padding: 22, maxWidth: 720 }}>
              <div className="panel">
                {[
                  { t: 'You saved this job', who: 'You', when: '5 days ago', icon: 'star' },
                  { t: 'Resume attached: Senior Frontend — General.pdf', who: 'You', when: '4 days ago', icon: 'doc' },
                  { t: 'Applied via company website', who: 'You', when: '4 days ago', icon: 'check' },
                ].map((e, i) => (
                  <div key={i} className="row" style={{ gap: 10, padding: '10px 14px', borderTop: i ? '1px solid var(--border)' : 0 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--text-2)' }}><Icon name={e.icon} size={12} /></span>
                    <span style={{ flex: 1 }}>{e.t}</span>
                    <span className="muted mono-strong">{e.who}</span>
                    <span className="muted mono-strong">{e.when}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div style={{ padding: 22, maxWidth: 720 }}>
              <textarea className="input" rows={12} style={{ width: '100%', resize: 'vertical' }} placeholder="Add notes about this job…" defaultValue={job.notes} />
            </div>
          )}
        </div>
      </div>
      {applyOpen && <ApplyModal job={job} onClose={() => setApplyOpen(false)} />}
      {tailorOpen && <TailorFlow jobId={job.id} onClose={() => setTailorOpen(false)} onNavigateResume={() => { setTailorOpen(false); router.push('/editor'); }} />}
    </AppShell>
  );
}

function IframeViewer({ url, company }: { url: string; company: string }) {
  const [ready, setReady] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRight: '1px solid var(--border)' }}>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--surface-2)', zIndex: 1 }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Rendering page…</div>
            <div className="muted" style={{ fontSize: 11.5 }}>Loading {company}&apos;s job posting</div>
          </div>
        </div>
      )}
      <iframe
        key={url}
        src={`http://localhost:8000/api/proxy?url=${encodeURIComponent(url)}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setReady(true)}
      />
    </div>
  );
}
